-- Aggregated open / overdue task counts per assignee (replaces loading all tasks in JS).

CREATE OR REPLACE FUNCTION public.get_team_workload(p_project_ids uuid[] DEFAULT NULL)
RETURNS TABLE (
  user_id uuid,
  open_count bigint,
  overdue_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    t.assigned_to_user_id AS user_id,
    COUNT(*)::bigint AS open_count,
    COUNT(*) FILTER (
      WHERE t.due_date IS NOT NULL
        AND t.due_date < ((now() AT TIME ZONE 'Asia/Jakarta'))::date
    )::bigint AS overdue_count
  FROM public.tasks t
  WHERE t.status IS DISTINCT FROM 'done'
    AND t.assigned_to_user_id IS NOT NULL
    AND (p_project_ids IS NULL OR t.project_id = ANY(p_project_ids))
  GROUP BY t.assigned_to_user_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_team_workload(uuid[]) TO authenticated;
