-- =============================================================
-- Migration: 0019_auto_progress_trigger
-- Replaces 0016 auto-progress logic:
--   - Only top-level tasks (parent_task_id IS NULL); subtasks ignored
--   - Denominator excludes cancelled tasks (same spirit as 0016)
-- =============================================================

-- Drop legacy trigger from 0016 (same name) so we can replace the function body.
DROP TRIGGER IF EXISTS task_progress_trigger ON public.tasks;

-- Single implementation: project % from done / (non-cancelled top-level tasks).
CREATE OR REPLACE FUNCTION public.update_project_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project_id uuid;
  v_total      integer;
  v_done       integer;
  v_pct        integer;
BEGIN
  v_project_id := COALESCE(NEW.project_id, OLD.project_id);
  IF v_project_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  SELECT
    COUNT(*) FILTER (WHERE status != 'cancelled')::integer,
    COUNT(*) FILTER (WHERE status = 'done')::integer
  INTO v_total, v_done
  FROM public.tasks
  WHERE project_id = v_project_id
    AND parent_task_id IS NULL;

  IF v_total = 0 THEN
    v_pct := 0;
  ELSE
    v_pct := ROUND((v_done::numeric / v_total::numeric) * 100)::integer;
  END IF;

  UPDATE public.projects
  SET progress_percent = v_pct,
      updated_at         = now()
  WHERE id = v_project_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_project_progress() IS
  'Sets projects.progress_percent from top-level tasks only (parent_task_id IS NULL); cancelled excluded from total.';

CREATE TRIGGER task_progress_trigger
  AFTER INSERT OR UPDATE OF status OR DELETE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_project_progress();
