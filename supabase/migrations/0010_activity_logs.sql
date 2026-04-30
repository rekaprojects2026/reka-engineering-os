-- 0010_activity_logs.sql
-- Records key operational events for the Recent Activity feed and audit trail.

CREATE TABLE public.activity_logs (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type  text        NOT NULL,          -- 'project' | 'task' | 'deliverable' | 'intake'
  entity_id    text        NOT NULL,          -- UUID of the referenced entity (stored as text for flexibility)
  action_type  text        NOT NULL,          -- 'created' | 'updated' | 'status_updated' | 'converted'
  user_id      uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  note         text,                          -- human-readable description, e.g. "Task status changed to done"
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Fast recent-activity queries (dashboard feed)
CREATE INDEX activity_logs_created_at_idx ON public.activity_logs (created_at DESC);

-- Fast per-entity queries (project detail activity tab in Stage 06)
CREATE INDEX activity_logs_entity_idx ON public.activity_logs (entity_type, entity_id);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read activity logs"
  ON public.activity_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert activity logs"
  ON public.activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);
