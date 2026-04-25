'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { loadMutationProfile, ensureWorkLogMutation } from '@/lib/auth/mutation-policy'

export type WorkLogActionResult = { ok: true } | { error: string }

export async function deleteWorkLog(formData: FormData): Promise<void> {
  const profile = await loadMutationProfile()
  const denied = ensureWorkLogMutation(profile)
  if (denied) return

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const id = String(formData.get('id') ?? '').trim()
  if (!id) return

  const { error } = await supabase.from('work_logs').delete().eq('id', id).eq('member_id', user.id)

  if (error) return

  revalidateTag('work-logs')
  revalidatePath('/work-logs')
}

export async function createWorkLog(formData: FormData): Promise<WorkLogActionResult> {
  const profile = await loadMutationProfile()
  const denied = ensureWorkLogMutation(profile)
  if (denied) return { error: denied }

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const taskId = String(formData.get('task_id') ?? '').trim()
  const projectId = String(formData.get('project_id') ?? '').trim()
  const logDate = String(formData.get('log_date') ?? '').trim()
  const hoursRaw = parseFloat(String(formData.get('hours_logged') ?? ''))
  const descRaw = String(formData.get('description') ?? '').trim()
  const description = descRaw.length > 0 ? descRaw : null

  if (!taskId || !projectId || !logDate) return { error: 'Task, project, dan tanggal wajib diisi.' }
  if (Number.isNaN(hoursRaw) || hoursRaw <= 0 || hoursRaw > 24) {
    return { error: 'Jam harus lebih dari 0 dan paling banyak 24.' }
  }

  const { data: task, error: taskErr } = await supabase
    .from('tasks')
    .select('id, project_id, assigned_to_user_id')
    .eq('id', taskId)
    .single()

  if (taskErr || !task) return { error: 'Task tidak ditemukan.' }
  if (task.project_id !== projectId) return { error: 'Project tidak cocok dengan task.' }
  if (task.assigned_to_user_id !== user.id) {
    return { error: 'Anda hanya dapat mencatat waktu pada task yang ditugaskan kepada Anda.' }
  }

  const { error } = await supabase.from('work_logs').insert({
    task_id: taskId,
    project_id: projectId,
    member_id: user.id,
    log_date: logDate,
    hours_logged: hoursRaw,
    description,
    created_by: user.id,
  })

  if (error) return { error: error.message }

  revalidateTag('work-logs')
  revalidatePath('/work-logs')
  return { ok: true }
}
