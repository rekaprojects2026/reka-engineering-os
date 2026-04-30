-- ============================================================
-- Migration: 0048_project_notes
-- Phase 03 — Wiki ringan per project (BlockNote JSON + plain text search)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.project_notes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title        text NOT NULL DEFAULT 'Untitled' CHECK (char_length(title) >= 1 AND char_length(title) <= 200),
  content      jsonb,
  content_text text,
  created_by   uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by   uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.project_notes IS
  'Per-project technical notes; content is BlockNote/JSON, content_text for search.';

CREATE INDEX IF NOT EXISTS project_notes_project_id_idx ON public.project_notes (project_id);
CREATE INDEX IF NOT EXISTS project_notes_created_at_idx ON public.project_notes (project_id, created_at DESC);

CREATE TRIGGER project_notes_updated_at
  BEFORE UPDATE ON public.project_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.project_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_notes_select"
  ON public.project_notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "project_notes_insert"
  ON public.project_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND system_role IN (
          'direktur', 'technical_director', 'manajer', 'member', 'senior', 'freelancer'
        )
    )
  );

CREATE POLICY "project_notes_update"
  ON public.project_notes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND system_role IN (
          'direktur', 'technical_director', 'manajer', 'member', 'senior', 'freelancer'
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND system_role IN (
          'direktur', 'technical_director', 'manajer', 'member', 'senior', 'freelancer'
        )
    )
  );

CREATE POLICY "project_notes_delete"
  ON public.project_notes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND system_role IN ('direktur', 'technical_director')
    )
  );
