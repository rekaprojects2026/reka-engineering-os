'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { isDirektur, isTD } from '@/lib/auth/permissions'
import {
  ensureCommentOnDeliverable,
  ensureCommentOnTask,
  loadMutationProfile,
  MUTATION_FORBIDDEN,
} from '@/lib/auth/mutation-policy'
import { getCommentById } from '@/lib/comments/queries'

function revalidateCommentPaths(taskId: string | null, deliverableId: string | null) {
  if (taskId) revalidatePath(`/tasks/${taskId}`)
  if (deliverableId) revalidatePath(`/deliverables/${deliverableId}`)
}

export async function addComment(input: {
  body: string
  taskId?: string
  deliverableId?: string
  parentId?: string
}): Promise<{ ok: true } | { error: string }> {
  const profile = await loadMutationProfile()
  const supabase = await createServerClient()

  const { body, taskId, deliverableId, parentId } = input

  if (!body.trim()) return { error: 'Komentar tidak boleh kosong' }
  if (body.length > 2000) return { error: 'Komentar terlalu panjang (maks 2000 karakter)' }
  if (!taskId && !deliverableId) return { error: 'Target tidak valid' }
  if (taskId && deliverableId) return { error: 'Target tidak valid' }

  if (taskId) {
    const gate = await ensureCommentOnTask(profile, taskId)
    if ('error' in gate) return { error: gate.error }
  } else if (deliverableId) {
    const gate = await ensureCommentOnDeliverable(profile, deliverableId)
    if ('error' in gate) return { error: gate.error }
  }

  if (parentId) {
    const parent = await getCommentById(parentId)
    if (!parent) return { error: 'Komentar induk tidak ditemukan.' }
    if (parent.parent_id != null) {
      return { error: 'Balasan hanya satu tingkat.' }
    }
    if (taskId && (parent.task_id !== taskId || parent.deliverable_id != null)) {
      return { error: 'Komentar induk tidak cocok dengan task ini.' }
    }
    if (deliverableId && (parent.deliverable_id !== deliverableId || parent.task_id != null)) {
      return { error: 'Komentar induk tidak cocok dengan deliverable ini.' }
    }
  }

  const { error } = await supabase.from('comments').insert({
    body: body.trim(),
    task_id: taskId ?? null,
    deliverable_id: deliverableId ?? null,
    parent_id: parentId ?? null,
    author_id: profile.id,
  })

  if (error) return { error: error.message }

  revalidateCommentPaths(taskId ?? null, deliverableId ?? null)
  return { ok: true }
}

export async function editComment(id: string, body: string): Promise<{ ok: true } | { error: string }> {
  const profile = await loadMutationProfile()
  const supabase = await createServerClient()

  if (!body.trim()) return { error: 'Komentar tidak boleh kosong' }

  const row = await getCommentById(id)
  if (!row) return { error: 'Komentar tidak ditemukan.' }
  if (row.author_id !== profile.id) return { error: MUTATION_FORBIDDEN }

  if (row.task_id) {
    const gate = await ensureCommentOnTask(profile, row.task_id)
    if ('error' in gate) return { error: gate.error }
  } else if (row.deliverable_id) {
    const gate = await ensureCommentOnDeliverable(profile, row.deliverable_id)
    if ('error' in gate) return { error: gate.error }
  }

  const { error } = await supabase
    .from('comments')
    .update({ body: body.trim(), edited_at: new Date().toISOString() })
    .eq('id', id)
    .eq('author_id', profile.id)

  if (error) return { error: error.message }

  revalidateCommentPaths(row.task_id, row.deliverable_id)
  return { ok: true }
}

export async function deleteComment(id: string): Promise<{ ok: true } | { error: string }> {
  const profile = await loadMutationProfile()
  const supabase = await createServerClient()

  const row = await getCommentById(id)
  if (!row) return { error: 'Komentar tidak ditemukan.' }

  const isAdminDelete = isDirektur(profile.system_role) || isTD(profile.system_role)
  if (row.author_id !== profile.id && !isAdminDelete) return { error: MUTATION_FORBIDDEN }

  if (row.task_id) {
    const gate = await ensureCommentOnTask(profile, row.task_id)
    if ('error' in gate) return { error: gate.error }
  } else if (row.deliverable_id) {
    const gate = await ensureCommentOnDeliverable(profile, row.deliverable_id)
    if ('error' in gate) return { error: gate.error }
  }

  const { error } = await supabase.from('comments').delete().eq('id', id)

  if (error) return { error: error.message }

  revalidateCommentPaths(row.task_id, row.deliverable_id)
  return { ok: true }
}
