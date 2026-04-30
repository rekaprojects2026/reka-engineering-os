'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { isDirektur, isTD } from '@/lib/auth/permissions'
import { userCanEditProjectMetadata, userCanEditTask } from '@/lib/auth/access-surface'
import {
  ensureProjectOperationalMutation,
  loadMutationProfile,
  MUTATION_FORBIDDEN,
} from '@/lib/auth/mutation-policy'
import { getPhaseById, getProjectPhases } from '@/lib/phases/queries'
import { getTaskById } from '@/lib/tasks/queries'

function revalidateProject(projectId: string) {
  revalidatePath(`/projects/${projectId}`)
}

export async function createPhase(input: {
  projectId: string
  name: string
  description?: string
  startDate?: string
  endDate?: string
}): Promise<{ ok: true } | { error: string }> {
  const profile = await loadMutationProfile()
  const supabase = await createServerClient()

  const gate = await ensureProjectOperationalMutation(profile, input.projectId)
  if ('error' in gate) return { error: gate.error }
  if (!(await userCanEditProjectMetadata(profile, gate.project))) return { error: MUTATION_FORBIDDEN }

  const name = input.name.trim()
  if (!name) return { error: 'Nama phase wajib diisi.' }

  const phases = await getProjectPhases(input.projectId)
  const nextOrder = phases.reduce((m, p) => Math.max(m, p.sort_order), -1) + 1

  const { error } = await supabase.from('project_phases').insert({
    project_id: input.projectId,
    name,
    description: input.description?.trim() || null,
    start_date: input.startDate?.trim() || null,
    end_date: input.endDate?.trim() || null,
    sort_order: nextOrder,
    created_by: profile.id,
  })

  if (error) return { error: error.message }
  revalidateProject(input.projectId)
  return { ok: true }
}

export async function updatePhase(
  id: string,
  input: {
    name?: string
    description?: string
    startDate?: string | null
    endDate?: string | null
    status?: 'active' | 'completed' | 'on_hold'
  },
): Promise<{ ok: true } | { error: string }> {
  const profile = await loadMutationProfile()
  const supabase = await createServerClient()

  const phase = await getPhaseById(id)
  if (!phase) return { error: 'Phase tidak ditemukan.' }

  const gate = await ensureProjectOperationalMutation(profile, phase.project_id)
  if ('error' in gate) return { error: gate.error }
  if (!(await userCanEditProjectMetadata(profile, gate.project))) return { error: MUTATION_FORBIDDEN }

  const patch: Record<string, string | null> = {}
  if (input.name !== undefined) {
    const n = input.name.trim()
    if (!n) return { error: 'Nama phase tidak boleh kosong.' }
    patch.name = n
  }
  if (input.description !== undefined) patch.description = input.description.trim() || null
  if (input.startDate !== undefined) patch.start_date = input.startDate?.trim() || null
  if (input.endDate !== undefined) patch.end_date = input.endDate?.trim() || null
  if (input.status !== undefined) patch.status = input.status

  if (Object.keys(patch).length === 0) return { ok: true }

  const { error } = await supabase.from('project_phases').update(patch).eq('id', id)

  if (error) return { error: error.message }
  revalidateProject(phase.project_id)
  return { ok: true }
}

export async function deletePhase(id: string, projectId: string): Promise<{ ok: true } | { error: string }> {
  const profile = await loadMutationProfile()
  const supabase = await createServerClient()

  if (!isDirektur(profile.system_role) && !isTD(profile.system_role)) {
    return { error: MUTATION_FORBIDDEN }
  }

  const phase = await getPhaseById(id)
  if (!phase || phase.project_id !== projectId) return { error: 'Phase tidak ditemukan.' }

  const gate = await ensureProjectOperationalMutation(profile, projectId)
  if ('error' in gate) return { error: gate.error }
  if (!(await userCanEditProjectMetadata(profile, gate.project))) return { error: MUTATION_FORBIDDEN }

  const { error } = await supabase.from('project_phases').delete().eq('id', id)

  if (error) return { error: error.message }
  revalidateProject(projectId)
  return { ok: true }
}

export async function assignTaskToPhase(
  taskId: string,
  phaseId: string | null,
): Promise<{ ok: true } | { error: string }> {
  const profile = await loadMutationProfile()
  const supabase = await createServerClient()

  const task = await getTaskById(taskId)
  if (!task) return { error: 'Task tidak ditemukan.' }

  const gate = await ensureProjectOperationalMutation(profile, task.project_id)
  if ('error' in gate) return { error: gate.error }
  if (!(await userCanEditTask(profile, task))) return { error: MUTATION_FORBIDDEN }

  if (phaseId) {
    const ph = await getPhaseById(phaseId)
    if (!ph || ph.project_id !== task.project_id) return { error: 'Phase tidak valid untuk project ini.' }
  }

  const { error } = await supabase.from('tasks').update({ phase_id: phaseId }).eq('id', taskId)

  if (error) return { error: error.message }
  revalidateProject(task.project_id)
  return { ok: true }
}
