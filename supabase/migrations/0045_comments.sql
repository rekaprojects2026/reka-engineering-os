-- ============================================================
-- Migration: 0045_comments
-- Phase 01 — Comments on tasks and deliverables (1-level replies)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.comments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  task_id         uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  deliverable_id  uuid REFERENCES public.deliverables(id) ON DELETE CASCADE,

  parent_id       uuid REFERENCES public.comments(id) ON DELETE CASCADE,

  author_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body            text NOT NULL CHECK (char_length(body) >= 1 AND char_length(body) <= 2000),

  edited_at       timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT comments_target_check CHECK (
    (task_id IS NOT NULL AND deliverable_id IS NULL)
    OR (task_id IS NULL AND deliverable_id IS NOT NULL)
  )
);

COMMENT ON TABLE public.comments IS
  'Threaded comments attached to a task or a deliverable; at most one level of replies (parent is top-level).';

CREATE INDEX IF NOT EXISTS comments_task_id_idx ON public.comments (task_id) WHERE task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS comments_deliverable_id_idx ON public.comments (deliverable_id) WHERE deliverable_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS comments_parent_id_idx ON public.comments (parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS comments_author_id_idx ON public.comments (author_id);
CREATE INDEX IF NOT EXISTS comments_created_at_idx ON public.comments (created_at DESC);

CREATE TRIGGER comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_select"
  ON public.comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "comments_insert"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "comments_update"
  ON public.comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "comments_delete"
  ON public.comments FOR DELETE
  TO authenticated
  USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND system_role IN ('direktur', 'technical_director')
    )
  );
