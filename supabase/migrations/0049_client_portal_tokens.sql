-- ============================================================
-- Migration: 0049_client_portal_tokens
-- Phase 03 — Shareable read-only client portal links per project
-- ============================================================

CREATE TABLE IF NOT EXISTS public.client_portal_tokens (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  token            text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  label            text,
  expires_at       timestamptz,
  is_active        boolean NOT NULL DEFAULT true,
  created_by       uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  last_accessed_at timestamptz
);

COMMENT ON TABLE public.client_portal_tokens IS
  'Opaque tokens for unauthenticated client portal; payload served via client_portal_fetch().';

CREATE INDEX IF NOT EXISTS client_portal_tokens_project_id_idx ON public.client_portal_tokens (project_id);
CREATE INDEX IF NOT EXISTS client_portal_tokens_token_idx ON public.client_portal_tokens (token);

ALTER TABLE public.client_portal_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "portal_tokens_select"
  ON public.client_portal_tokens FOR SELECT
  TO authenticated
  USING (
    public.get_my_system_role() IN ('direktur', 'technical_director', 'manajer')
  );

CREATE POLICY "portal_tokens_insert"
  ON public.client_portal_tokens FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_my_system_role() IN ('direktur', 'technical_director', 'manajer')
  );

CREATE POLICY "portal_tokens_update"
  ON public.client_portal_tokens FOR UPDATE
  TO authenticated
  USING (public.get_my_system_role() IN ('direktur', 'technical_director', 'manajer'))
  WITH CHECK (public.get_my_system_role() IN ('direktur', 'technical_director', 'manajer'));

CREATE POLICY "portal_tokens_delete"
  ON public.client_portal_tokens FOR DELETE
  TO authenticated
  USING (public.get_my_system_role() IN ('direktur', 'technical_director', 'manajer'));

-- Unauthenticated portal: validate token and return safe JSON (no assignees / internal fields).
CREATE OR REPLACE FUNCTION public.client_portal_fetch(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.client_portal_tokens%ROWTYPE;
  proj jsonb;
  task_rows jsonb;
  del_rows jsonb;
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) < 8 THEN
    RETURN NULL;
  END IF;

  SELECT * INTO r
  FROM public.client_portal_tokens
  WHERE token = p_token
    AND is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF r.expires_at IS NOT NULL AND r.expires_at < now() THEN
    RETURN NULL;
  END IF;

  UPDATE public.client_portal_tokens
  SET last_accessed_at = now()
  WHERE id = r.id;

  SELECT jsonb_build_object(
    'id', p.id,
    'name', p.name,
    'status', p.status,
    'project_code', p.project_code,
    'progress_percent', p.progress_percent,
    'start_date', p.start_date,
    'target_due_date', p.target_due_date,
    'client_name', COALESCE(c.client_name, '')
  )
  INTO proj
  FROM public.projects p
  LEFT JOIN public.clients c ON c.id = p.client_id
  WHERE p.id = r.project_id;

  SELECT coalesce(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
  INTO task_rows
  FROM (
    SELECT id, title, status, due_date, priority
    FROM public.tasks
    WHERE project_id = r.project_id
      AND status IS DISTINCT FROM 'cancelled'
    ORDER BY created_at ASC
  ) t;

  SELECT coalesce(jsonb_agg(row_to_json(d)::jsonb), '[]'::jsonb)
  INTO del_rows
  FROM (
    SELECT id, name, type, status, submitted_to_client_date AS client_date
    FROM public.deliverables
    WHERE project_id = r.project_id
    ORDER BY created_at ASC
  ) d;

  RETURN jsonb_build_object(
    'project', proj,
    'tasks', task_rows,
    'deliverables', del_rows
  );
END;
$$;

COMMENT ON FUNCTION public.client_portal_fetch(text) IS
  'Returns client-safe portal JSON for a valid active token; updates last_accessed_at.';

REVOKE ALL ON FUNCTION public.client_portal_fetch(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.client_portal_fetch(text) TO anon;
GRANT EXECUTE ON FUNCTION public.client_portal_fetch(text) TO authenticated;
