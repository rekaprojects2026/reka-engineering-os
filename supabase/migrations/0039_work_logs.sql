-- ============================================================
-- Migration: 0039_work_logs
-- Time tracking — log jam kerja per task per member per hari.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.work_logs (
  id           uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id      uuid          NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  project_id   uuid          NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  member_id    uuid          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  log_date     date          NOT NULL DEFAULT (current_date),
  hours_logged numeric(5,2)  NOT NULL CHECK (hours_logged > 0 AND hours_logged <= 24),
  description  text,

  created_by   uuid          REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   timestamptz   NOT NULL DEFAULT now(),
  updated_at   timestamptz   NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.work_logs IS
  'Daily work hour logs per member per task. Basis for utilization reports and freelancer payroll.';

CREATE INDEX IF NOT EXISTS work_logs_task_idx     ON public.work_logs (task_id);
CREATE INDEX IF NOT EXISTS work_logs_project_idx   ON public.work_logs (project_id);
CREATE INDEX IF NOT EXISTS work_logs_member_idx  ON public.work_logs (member_id);
CREATE INDEX IF NOT EXISTS work_logs_date_idx     ON public.work_logs (log_date DESC);

CREATE TRIGGER work_logs_updated_at
  BEFORE UPDATE ON public.work_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.work_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "work_logs: member read own"
  ON public.work_logs FOR SELECT
  USING (member_id = auth.uid());

CREATE POLICY "work_logs: member insert own"
  ON public.work_logs FOR INSERT
  WITH CHECK (member_id = auth.uid() AND created_by = auth.uid());

CREATE POLICY "work_logs: member update own"
  ON public.work_logs FOR UPDATE
  USING (member_id = auth.uid())
  WITH CHECK (member_id = auth.uid());

CREATE POLICY "work_logs: member delete own"
  ON public.work_logs FOR DELETE
  USING (member_id = auth.uid());

CREATE POLICY "work_logs: management read all"
  ON public.work_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.system_role IN ('direktur', 'technical_director', 'finance')
    )
  );

CREATE POLICY "work_logs: td manage all"
  ON public.work_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.system_role IN ('direktur', 'technical_director')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.system_role IN ('direktur', 'technical_director')
    )
  );
