'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { userCanViewProject } from '@/lib/auth/access-surface'
import { isDirektur, isTD } from '@/lib/auth/permissions'
import {
  ensureProjectOperationalMutation,
  loadMutationProfile,
  MUTATION_FORBIDDEN,
} from '@/lib/auth/mutation-policy'
import { getProjectNoteById } from '@/lib/project-notes/queries'

function revalidateProjectNotes(projectId: string) {
  revalidatePath(`/projects/${projectId}`)
}

export async function createProjectNote(
  projectId: string,
  title: string,
): Promise<{ ok: true; id: string } | { error: string }> {
  const profile = await loadMutationProfile()
  const supabase = await createServerClient()

  const gate = await ensureProjectOperationalMutation(profile, projectId)
  if ('error' in gate) return { error: gate.error }
  if (!(await userCanViewProject(profile, gate.project))) return { error: MUTATION_FORBIDDEN }

  const t = title.trim() || 'Untitled'

  const { data, error } = await supabase
    .from('project_notes')
    .insert({
      project_id: projectId,
      title: t,
      created_by: profile.id,
      updated_by: profile.id,
    })
    .select('id')
    .single()

  if (error || !data) return { error: error?.message ?? 'Insert failed' }
  revalidateProjectNotes(projectId)
  return { ok: true, id: data.id as string }
}

export async function updateProjectNote(
  id: string,
  input: {
    title?: string
    content?: unknown
    contentText?: string | null
  },
): Promise<{ ok: true } | { error: string }> {
  const profile = await loadMutationProfile()
  const supabase = await createServerClient()

  const row = await getProjectNoteById(id)
  if (!row) return { error: 'Note not found.' }

  const gate = await ensureProjectOperationalMutation(profile, row.project_id)
  if ('error' in gate) return { error: gate.error }
  if (!(await userCanViewProject(profile, gate.project))) return { error: MUTATION_FORBIDDEN }

  const patch: Record<string, unknown> = { updated_by: profile.id }
  if (input.title !== undefined) {
    const nt = input.title.trim()
    if (!nt) return { error: 'Title cannot be empty.' }
    patch.title = nt
  }
  if (input.content !== undefined) patch.content = input.content
  if (input.contentText !== undefined) patch.content_text = input.contentText

  const { error } = await supabase.from('project_notes').update(patch).eq('id', id)

  if (error) return { error: error.message }
  revalidateProjectNotes(row.project_id)
  return { ok: true }
}

export async function deleteProjectNote(
  id: string,
  projectId: string,
): Promise<{ ok: true } | { error: string }> {
  const profile = await loadMutationProfile()
  const supabase = await createServerClient()

  const row = await getProjectNoteById(id)
  if (!row || row.project_id !== projectId) return { error: 'Note not found.' }

  const gate = await ensureProjectOperationalMutation(profile, projectId)
  if ('error' in gate) return { error: gate.error }
  if (!(await userCanViewProject(profile, gate.project))) return { error: MUTATION_FORBIDDEN }
  if (!isDirektur(profile.system_role) && !isTD(profile.system_role)) return { error: MUTATION_FORBIDDEN }

  const { error } = await supabase.from('project_notes').delete().eq('id', id)

  if (error) return { error: error.message }
  revalidateProjectNotes(projectId)
  return { ok: true }
}
