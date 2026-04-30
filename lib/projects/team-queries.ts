// Server-side query helpers for project team assignments
import type { SupabaseClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase/server'

export interface TeamMemberWithProfile {
  id: string
  project_id: string
  user_id: string
  team_role: string
  /** Assignment-specific discipline; null = all disciplines on the project. */
  discipline: string | null
  assigned_at: string
  profiles: {
    id: string
    full_name: string
    email: string
    discipline: string | null
  }
}

/**
 * Get all team members for a project, joined with profile data.
 */
export async function getTeamByProjectId(
  projectId: string,
): Promise<TeamMemberWithProfile[]> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('project_team_assignments')
    .select('*, profiles(id, full_name, email, discipline)')
    .eq('project_id', projectId)
    .order('assigned_at', { ascending: true })

  if (error) return []
  return (data ?? []) as unknown as TeamMemberWithProfile[]
}

/** True if user is project lead, reviewer, or on the team roster. */
export async function userIsOnProjectRoster(
  supabase: SupabaseClient,
  projectId: string,
  userId: string,
): Promise<boolean> {
  const { data: project } = await supabase
    .from('projects')
    .select('project_lead_user_id, reviewer_user_id')
    .eq('id', projectId)
    .maybeSingle()

  if (!project) return false
  if (project.project_lead_user_id === userId || project.reviewer_user_id === userId) return true

  const { data: row } = await supabase
    .from('project_team_assignments')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .maybeSingle()

  return !!row
}
