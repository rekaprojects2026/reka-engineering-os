'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { loadMutationProfile, ensureProjectTeamMutation } from '@/lib/auth/mutation-policy'
import { getWorkspaceDrive, shareDriveFolderWithEmail } from '@/lib/google/workspace-drive'

// ─── Add team member ─────────────────────────────────────────
export async function addTeamMember(formData: FormData) {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const projectId = (formData.get('project_id') as string)?.trim()
  const userId = (formData.get('user_id') as string)?.trim()
  const teamRole = (formData.get('team_role') as string)?.trim() || 'engineer'
  const disciplineRaw = (formData.get('discipline') as string)?.trim()
  const discipline = disciplineRaw || null

  if (!projectId) return { error: 'Project is required.' }
  if (!userId) return { error: 'Team member is required.' }

  const gate = await ensureProjectTeamMutation(profile, projectId)
  if ('error' in gate) return { error: gate.error }

  const { error } = await supabase
    .from('project_team_assignments')
    .insert({
      project_id: projectId,
      user_id: userId,
      team_role: teamRole,
      discipline,
    })

  if (error) {
    if (error.code === '23505') {
      return { error: 'This user is already assigned to this project.' }
    }
    return { error: error.message }
  }

  try {
    const { data: project } = await supabase
      .from('projects')
      .select('google_drive_folder_id')
      .eq('id', projectId)
      .maybeSingle()

    if (project?.google_drive_folder_id) {
      const { data: memberProfile } = await supabase
        .from('profiles')
        .select('email, google_email')
        .eq('id', userId)
        .maybeSingle()

      const emailToShare =
        (memberProfile?.google_email as string | null | undefined)?.trim() ||
        (memberProfile?.email as string | undefined)?.trim()
      if (emailToShare) {
        const ws = await getWorkspaceDrive(supabase)
        if (ws) {
          await shareDriveFolderWithEmail(ws.drive, project.google_drive_folder_id, emailToShare)
        }
      }
    }
  } catch (err) {
    console.error('[Drive] Failed to share folder to new member:', err)
  }

  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

// ─── Remove team member ──────────────────────────────────────
export async function removeTeamMember(formData: FormData) {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const assignmentId = (formData.get('assignment_id') as string)?.trim()
  const projectId = (formData.get('project_id') as string)?.trim()

  if (!assignmentId) return { error: 'Assignment ID is required.' }
  if (!projectId) return { error: 'Project is required.' }

  const gate = await ensureProjectTeamMutation(profile, projectId)
  if ('error' in gate) return { error: gate.error }

  const { error } = await supabase
    .from('project_team_assignments')
    .delete()
    .eq('id', assignmentId)

  if (error) return { error: error.message }

  if (projectId) revalidatePath(`/projects/${projectId}`)
  return { success: true }
}
