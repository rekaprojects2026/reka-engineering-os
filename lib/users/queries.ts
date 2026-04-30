// Server-side query helpers for user profiles
// Used by project forms for lead/reviewer assignment dropdowns
import { createServerClient } from '@/lib/supabase/server'
import { getAssignedProjectIdsForUser } from '@/lib/projects/queries'

export type UserSelectRow = { id: string; full_name: string; email: string; discipline: string | null }

/** Project roster row for task assignee/reviewer pickers (includes synthetic roles for lead/reviewer). */
export type ProjectMemberUserRow = UserSelectRow & { team_role: string }

export async function getUsersForSelect(): Promise<UserSelectRow[]> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, discipline')
    .eq('is_active', true)
    .order('full_name', { ascending: true })

  if (error) return []
  return data ?? []
}

/** Profiles tied to a project: roster + lead + reviewer (assignment pickers). */
export async function getUsersForProjectAssignment(projectId: string): Promise<UserSelectRow[]> {
  const supabase = await createServerClient()

  const { data: project, error: pe } = await supabase
    .from('projects')
    .select('project_lead_user_id, reviewer_user_id')
    .eq('id', projectId)
    .single()

  if (pe || !project) return []

  const { data: team } = await supabase
    .from('project_team_assignments')
    .select('user_id')
    .eq('project_id', projectId)

  const ids = new Set<string>()
  if (project.project_lead_user_id) ids.add(project.project_lead_user_id)
  if (project.reviewer_user_id) ids.add(project.reviewer_user_id)
  for (const row of team ?? []) ids.add(row.user_id)

  if (ids.size === 0) return []

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, discipline')
    .in('id', [...ids])
    .eq('is_active', true)
    .order('full_name', { ascending: true })

  if (error) return []
  return data ?? []
}

/** Union of people on all projects the coordinator is assigned to (+ self). */
export async function getUsersForCoordinatorProjectPortfolio(coordinatorUserId: string): Promise<UserSelectRow[]> {
  const projectIds = await getAssignedProjectIdsForUser(coordinatorUserId)
  if (projectIds.length === 0) return []

  const supabase = await createServerClient()
  const allIds = new Set<string>()
  allIds.add(coordinatorUserId)

  for (const pid of projectIds) {
    const { data: project } = await supabase
      .from('projects')
      .select('project_lead_user_id, reviewer_user_id')
      .eq('id', pid)
      .single()

    if (project?.project_lead_user_id) allIds.add(project.project_lead_user_id)
    if (project?.reviewer_user_id) allIds.add(project.reviewer_user_id)

    const { data: team } = await supabase
      .from('project_team_assignments')
      .select('user_id')
      .eq('project_id', pid)

    for (const row of team ?? []) allIds.add(row.user_id)
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, discipline')
    .in('id', [...allIds])
    .eq('is_active', true)
    .order('full_name', { ascending: true })

  if (error) return []
  return data ?? []
}

/** Alias — semua active users, dipakai di admin/coordinator pages */
export async function getAllUsers(): Promise<UserSelectRow[]> {
  return getUsersForSelect()
}

/**
 * Users who may receive tasks on this project: team assignments plus project lead and reviewer
 * when they are not already in the assignment list (synthetic roles `project_lead` / `reviewer`).
 */
export async function getProjectMemberUsers(projectId: string): Promise<ProjectMemberUserRow[]> {
  const supabase = await createServerClient()

  const { data: assignments, error: aErr } = await supabase
    .from('project_team_assignments')
    .select('team_role, user_id, profiles(id, full_name, email, discipline)')
    .eq('project_id', projectId)

  if (aErr) return []

  const byUser = new Map<string, ProjectMemberUserRow>()

  for (const row of assignments ?? []) {
    const rawProf = row.profiles as unknown
    const prof = (Array.isArray(rawProf) ? rawProf[0] : rawProf) as {
      id: string
      full_name: string
      email: string
      discipline: string | null
    } | null
    if (!prof?.id) continue
    byUser.set(prof.id, {
      id: prof.id,
      full_name: prof.full_name,
      email: prof.email,
      discipline: prof.discipline,
      team_role: String(row.team_role ?? 'engineer'),
    })
  }

  const { data: project } = await supabase
    .from('projects')
    .select('project_lead_user_id, reviewer_user_id')
    .eq('id', projectId)
    .maybeSingle()

  async function addIfMissing(userId: string | null, teamRole: string) {
    if (!userId || byUser.has(userId)) return
    const { data: prof } = await supabase
      .from('profiles')
      .select('id, full_name, email, discipline')
      .eq('id', userId)
      .eq('is_active', true)
      .maybeSingle()
    if (!prof) return
    byUser.set(userId, {
      id: prof.id,
      full_name: prof.full_name,
      email: prof.email,
      discipline: prof.discipline,
      team_role: teamRole,
    })
  }

  await addIfMissing(project?.project_lead_user_id ?? null, 'project_lead')
  await addIfMissing(project?.reviewer_user_id ?? null, 'reviewer')

  return [...byUser.values()].sort((a, b) => a.full_name.localeCompare(b.full_name))
}
