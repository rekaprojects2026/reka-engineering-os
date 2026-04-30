-- ============================================================
-- Migration: 0046_project_phases
-- Phase 02 — Sprint / phase grouping per project + optional task.phase_id
-- ============================================================

CREATE TABLE IF NOT EXISTS public.project_phases (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name        text NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  description text,
  start_date  date,
  end_date    date,
  status      text NOT NULL DEFAULT 'active'
              CHECK (status IN ('active', 'completed', 'on_hold')),
  sort_order  integer NOT NULL DEFAULT 0,
  created_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.project_phases IS
  'Named project phases (e.g. SD/DD); tasks may optionally reference phase_id.';

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS phase_id uuid REFERENCES public.project_phases(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS project_phases_project_id_idx ON public.project_phases (project_id);
CREATE INDEX IF NOT EXISTS project_phases_sort_order_idx ON public.project_phases (project_id, sort_order);
CREATE INDEX IF NOT EXISTS tasks_phase_id_idx ON public.tasks (phase_id) WHERE phase_id IS NOT NULL;

CREATE TRIGGER project_phases_updated_at
  BEFORE UPDATE ON public.project_phases
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.project_phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_phases_select"
  ON public.project_phases FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "project_phases_insert"
  ON public.project_phases FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND system_role IN ('direktur', 'technical_director', 'manajer')
    )
  );

CREATE POLICY "project_phases_update"
  ON public.project_phases FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND system_role IN ('direktur', 'technical_director', 'manajer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND system_role IN ('direktur', 'technical_director', 'manajer')
    )
  );

CREATE POLICY "project_phases_delete"
  ON public.project_phases FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND system_role IN ('direktur', 'technical_director')
    )
  );
