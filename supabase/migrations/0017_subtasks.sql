-- =============================================================
-- Migration: 0017_subtasks
-- Subtasks: ordering, depth, stricter parent FK
-- Note: public.tasks.parent_task_id already exists (0007_tasks);
-- this migration adds display/order fields and ON DELETE CASCADE.
-- =============================================================

-- ─── 1. Depth & sort order (parent_task_id left unchanged) ───
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS depth integer NOT NULL DEFAULT 0;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- ─── 2. Parent FK: CASCADE (subtasks remove with parent) ───────
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_parent_task_id_fkey;

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_parent_task_id_fkey
  FOREIGN KEY (parent_task_id)
  REFERENCES public.tasks (id)
  ON DELETE CASCADE;

-- ─── 3. Indexes (parent index name from 0007 kept; add composite) ─
CREATE INDEX IF NOT EXISTS idx_tasks_project_sort
  ON public.tasks (project_id, sort_order);

COMMENT ON COLUMN public.tasks.depth IS
  'Nesting level: 0 = top-level, increments for each parent.';
COMMENT ON COLUMN public.tasks.sort_order IS
  'Order among siblings (same project_id and parent_task_id).';
