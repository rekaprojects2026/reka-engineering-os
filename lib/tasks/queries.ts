// Server-side query helpers for the Tasks module
import { createServerClient } from '@/lib/supabase/server'
import { buildTaskTree, type TaskNode, type TaskWithRelations } from './task-tree'

export type { TaskNode, TaskWithRelations }
export { buildTaskTree }

// ─── List (all tasks, cross-project) ──────────────────────────

export interface GetTasksResult {
  rows: TaskWithRelations[]
  count: number
}

export async function getTasks(opts?: {
  search?: string
  status?: string
  priority?: string
  project_id?: string
  assigned_to?: string
  /** Member scope: only tasks assigned to this user */
  scopeAssignedTo?: string
  /** Reviewer scope: only tasks where this user is the reviewer */
  scopeReviewerId?: string
  /**
   * Coordinator (and similar) portfolio: only tasks in these projects.
   * Pass [] when the user has no viewable projects to get an empty list.
   */
  scopeProjectIds?: string[]
  page?: number
  pageSize?: number
}): Promise<GetTasksResult> {
  const supabase = await createServerClient()

  const selectCols =
    '*, projects(id, name, project_code), assignee:profiles!assigned_to_user_id(id, full_name), reviewer:profiles!reviewer_user_id(id, full_name)'

  if (opts?.scopeProjectIds !== undefined && opts.scopeProjectIds.length === 0) {
    return { rows: [], count: 0 }
  }

  const paginate = opts?.page != null && opts?.pageSize != null
  const page = opts?.page ?? 1
  const pageSize = opts?.pageSize ?? 50
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase.from('tasks').select(selectCols, paginate ? { count: 'exact' } : undefined).order('created_at', { ascending: false })

  if (opts?.status && opts.status !== 'all') {
    query = query.eq('status', opts.status)
  }
  if (opts?.priority && opts.priority !== 'all') {
    query = query.eq('priority', opts.priority)
  }
  if (opts?.project_id) {
    query = query.eq('project_id', opts.project_id)
  }
  if (opts?.assigned_to) {
    query = query.eq('assigned_to_user_id', opts.assigned_to)
  }
  const q = opts?.search?.trim() ?? ''
  if (q.length >= 3) {
    query = query.textSearch('title_tsv', q, { type: 'websearch', config: 'simple' })
  } else if (q.length > 0) {
    query = query.ilike('title', `${q}%`)
  }

  if (opts?.scopeAssignedTo) {
    query = query.eq('assigned_to_user_id', opts.scopeAssignedTo)
  }
  if (opts?.scopeReviewerId) {
    query = query.eq('reviewer_user_id', opts.scopeReviewerId)
  }
  if (opts?.scopeProjectIds !== undefined && opts.scopeProjectIds.length > 0) {
    query = query.in('project_id', opts.scopeProjectIds)
  }

  if (paginate) {
    query = query.range(from, to)
  }

  const { data, error, count } = await query
  if (error) throw new Error(error.message)
  const rows = (data ?? []) as unknown as TaskWithRelations[]
  return { rows, count: paginate ? count ?? 0 : rows.length }
}

// ─── Single ───────────────────────────────────────────────────

export async function getTaskById(id: string): Promise<TaskWithRelations | null> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('tasks')
    .select(
      '*, projects(id, name, project_code), assignee:profiles!assigned_to_user_id(id, full_name), reviewer:profiles!reviewer_user_id(id, full_name)'
    )
    .eq('id', id)
    .single()

  if (error) return null
  return data as unknown as TaskWithRelations
}

// ─── By Project ───────────────────────────────────────────────

export async function getTasksByProjectId(projectId: string): Promise<TaskWithRelations[]> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('tasks')
    .select(
      '*, projects(id, name, project_code), assignee:profiles!assigned_to_user_id(id, full_name), reviewer:profiles!reviewer_user_id(id, full_name)'
    )
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) return []
  return (data ?? []) as unknown as TaskWithRelations[]
}

/** Top-level tasks only (parent_task_id IS NULL); cancelled excluded from total. */
export async function getProjectTopLevelTaskProgressCounts(
  projectId: string,
): Promise<{ total: number; done: number }> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('tasks')
    .select('status')
    .eq('project_id', projectId)
    .is('parent_task_id', null)

  if (error) throw new Error(error.message)

  const rows = data ?? []
  const total = rows.filter((r) => r.status !== 'cancelled').length
  const done = rows.filter((r) => r.status === 'done').length
  return { total, done }
}
