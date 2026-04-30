// Server-side query helpers for the Projects module
import { cache } from 'react'
import { createServerClient } from '@/lib/supabase/server'
import { effectiveRole, isManagement } from '@/lib/auth/permissions'
import type { Project, SystemRole } from '@/types/database'

// ─── Types ────────────────────────────────────────────────────

export type ProjectWithRelations = Project & {
  clients: { id: string; client_name: string; client_code: string } | null
  lead: { id: string; full_name: string } | null
  reviewer: { id: string; full_name: string } | null
  intakes: { id: string; intake_code: string; title: string } | null
}

export interface GetProjectsResult {
  rows: ProjectWithRelations[]
  count: number
}

// ─── Scoping helper ──────────────────────────────────────────
// Returns project IDs that a user is assigned to via project_team_assignments.

export async function getAssignedProjectIdsForUser(userId: string): Promise<string[]> {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('project_team_assignments')
    .select('project_id')
    .eq('user_id', userId)
  return (data ?? []).map((r) => r.project_id)
}

/** True if the user has a row in project_team_assignments for this project. */
export const isUserAssignedToProject = cache(async (userId: string, projectId: string): Promise<boolean> => {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('project_team_assignments')
    .select('id')
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .limit(1)
    .maybeSingle()
  if (error) return false
  return data != null
})

/**
 * Project IDs the user may open on the hub (mirrors userCanViewProject in access-surface).
 * Admin: null (caller applies no project filter).
 * Others: union of team assignments + projects where user is lead or project reviewer.
 */
export async function getViewableProjectIdsForUser(
  userId: string,
  systemRole: SystemRole | null | undefined,
): Promise<string[] | null> {
  if (isManagement(systemRole)) return null

  const assigned = await getAssignedProjectIdsForUser(userId)
  const supabase = await createServerClient()
  const { data: leadRev } = await supabase
    .from('projects')
    .select('id')
    .or(`reviewer_user_id.eq.${userId},project_lead_user_id.eq.${userId}`)

  const rows = (leadRev ?? []) as { id: string }[]
  const set = new Set<string>([...assigned, ...rows.map((r) => r.id)])
  return [...set]
}

// ─── List ─────────────────────────────────────────────────────

export async function getProjects(opts?: {
  search?: string
  status?: string
  discipline?: string
  priority?: string
  /** Restrict to projects the user is assigned to (member/coordinator scope) */
  assignedUserId?: string
  /** Restrict to projects where user is lead or reviewer (lead + project_lead / reviewer_user_id) */
  reviewerUserId?: string
  page?: number
  pageSize?: number
}): Promise<GetProjectsResult> {
  const supabase = await createServerClient()

  const selectCols =
    '*, clients(id, client_name, client_code), lead:profiles!project_lead_user_id(id, full_name), reviewer:profiles!reviewer_user_id(id, full_name), intakes:intakes!intake_id(id, intake_code, title)'

  let assignedProjectIds: string[] | null = null
  if (opts?.assignedUserId) {
    assignedProjectIds = await getAssignedProjectIdsForUser(opts.assignedUserId)
    if (assignedProjectIds.length === 0) return { rows: [], count: 0 }
  }

  const paginate = opts?.page != null && opts?.pageSize != null
  const page = opts?.page ?? 1
  const pageSize = opts?.pageSize ?? 50
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('projects')
    .select(selectCols, paginate ? { count: 'exact' } : undefined)
    .order('created_at', { ascending: false })

  if (opts?.status && opts.status !== 'all') {
    query = query.eq('status', opts.status)
  }
  if (opts?.discipline && opts.discipline !== 'all') {
    query = query.contains('disciplines', [opts.discipline])
  }
  if (opts?.priority && opts.priority !== 'all') {
    query = query.eq('priority', opts.priority)
  }
  const q = opts?.search?.trim() ?? ''
  if (q.length >= 3) {
    query = query.textSearch('search_tsv', q, { type: 'websearch', config: 'simple' })
  } else if (q.length > 0) {
    query = query.or(`name.ilike.${q}%,project_code.ilike.${q}%`)
  }

  if (assignedProjectIds) {
    query = query.in('id', assignedProjectIds)
  }
  if (opts?.reviewerUserId) {
    query = query.eq('reviewer_user_id', opts.reviewerUserId)
  }

  if (paginate) {
    query = query.range(from, to)
  }

  const { data, error, count } = await query
  if (error) throw new Error(error.message)
  const rows = (data ?? []) as unknown as ProjectWithRelations[]
  return { rows, count: paginate ? count ?? 0 : rows.length }
}

// ─── Single ───────────────────────────────────────────────────

export async function getProjectById(id: string): Promise<ProjectWithRelations | null> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('projects')
    .select(
      '*, clients(id, client_name, client_code), lead:profiles!project_lead_user_id(id, full_name), reviewer:profiles!reviewer_user_id(id, full_name), intakes:intakes!intake_id(id, intake_code, title)'
    )
    .eq('id', id)
    .single()

  if (error) return null
  return data as unknown as ProjectWithRelations
}

/** Full list of pending-approval projects (e.g. Direktur banner on /projects) — not dashboard-cached. */
export async function getPendingApprovalProjectsForList(): Promise<Pick<Project, 'id' | 'name' | 'project_code'>[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, project_code')
    .eq('status', 'pending_approval')
    .order('approval_requested_at', { ascending: true, nullsFirst: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as Pick<Project, 'id' | 'name' | 'project_code'>[]
}

// ─── By Client ────────────────────────────────────────────────

export async function getProjectsByClientId(clientId: string): Promise<Project[]> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) return []
  return (data ?? []) as Project[]
}
