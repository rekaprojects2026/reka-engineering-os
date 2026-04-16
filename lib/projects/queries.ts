// Server-side query helpers for the Projects module
import { createServerClient } from '@/lib/supabase/server'
import type { Project } from '@/types/database'

// ─── Types ────────────────────────────────────────────────────

export type ProjectWithRelations = Project & {
  clients: { id: string; client_name: string; client_code: string } | null
  lead: { id: string; full_name: string } | null
  reviewer: { id: string; full_name: string } | null
  intakes: { id: string; intake_code: string; title: string } | null
}

// ─── Scoping helper ──────────────────────────────────────────
// Returns project IDs that a user is assigned to via project_team_assignments.

async function getAssignedProjectIds(userId: string): Promise<string[]> {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('project_team_assignments')
    .select('project_id')
    .eq('user_id', userId)
  return (data ?? []).map((r) => r.project_id)
}

/** True if the user has a row in project_team_assignments for this project. */
export async function isUserAssignedToProject(userId: string, projectId: string): Promise<boolean> {
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
}): Promise<ProjectWithRelations[]> {
  const supabase = await createServerClient()

  let query = supabase
    .from('projects')
    .select(
      '*, clients(id, client_name, client_code), lead:profiles!project_lead_user_id(id, full_name), reviewer:profiles!reviewer_user_id(id, full_name), intakes:intakes!intake_id(id, intake_code, title)'
    )
    .order('created_at', { ascending: false })

  if (opts?.status && opts.status !== 'all') {
    query = query.eq('status', opts.status)
  }
  if (opts?.discipline && opts.discipline !== 'all') {
    query = query.eq('discipline', opts.discipline)
  }
  if (opts?.priority && opts.priority !== 'all') {
    query = query.eq('priority', opts.priority)
  }
  if (opts?.search) {
    query = query.or(
      `name.ilike.%${opts.search}%,project_code.ilike.%${opts.search}%`
    )
  }

  // Role-scoped filters
  if (opts?.assignedUserId) {
    const ids = await getAssignedProjectIds(opts.assignedUserId)
    if (ids.length === 0) return []
    query = query.in('id', ids)
  }
  if (opts?.reviewerUserId) {
    query = query.eq('reviewer_user_id', opts.reviewerUserId)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as ProjectWithRelations[]
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
