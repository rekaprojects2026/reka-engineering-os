'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/activity/actions'
import { effectiveRole } from '@/lib/auth/permissions'
import {
  loadMutationProfile,
  ensureProjectOperationalMutation,
  MUTATION_FORBIDDEN,
} from '@/lib/auth/mutation-policy'
import { userCanEditProjectMetadata } from '@/lib/auth/access-surface'
import { getProjectById } from '@/lib/projects/queries'
import { getTaskById } from '@/lib/tasks/queries'

// ─── Create ───────────────────────────────────────────────────
export async function createTask(formData: FormData) {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const title = (formData.get('title') as string)?.trim()
  const projectId = (formData.get('project_id') as string)?.trim()
  const assignedTo = (formData.get('assigned_to_user_id') as string)?.trim()

  if (!title) return { error: 'Task title is required.' }
  if (!projectId) return { error: 'Project is required.' }
  if (!assignedTo) return { error: 'Assignee is required.' }

  const gate = await ensureProjectOperationalMutation(profile, projectId)
  if ('error' in gate) return { error: gate.error }

  const reviewerUserId = (formData.get('reviewer_user_id') as string)?.trim() || null

  const payload = {
    title,
    project_id:           projectId,
    parent_task_id:       (formData.get('parent_task_id') as string)?.trim() || null,
    description:          (formData.get('description') as string)?.trim() || null,
    category:             (formData.get('category') as string)?.trim() || null,
    phase:                (formData.get('phase') as string)?.trim() || null,
    assigned_to_user_id:  assignedTo,
    reviewer_user_id:     reviewerUserId,
    start_date:           (formData.get('start_date') as string) || null,
    due_date:             (formData.get('due_date') as string) || null,
    estimated_hours:      parseFloat((formData.get('estimated_hours') as string) || '') || null,
    priority:             (formData.get('priority') as string) || 'medium',
    status:               (formData.get('status') as string) || 'to_do',
    progress_percent:     parseInt((formData.get('progress_percent') as string) || '0', 10),
    blocked_reason:       (formData.get('blocked_reason') as string)?.trim() || null,
    drive_link:           (formData.get('drive_link') as string)?.trim() || null,
    notes:                (formData.get('notes') as string)?.trim() || null,
    created_by:           user.id,
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert(payload)
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/tasks')
  revalidatePath(`/projects/${projectId}`)
  redirect(`/tasks/${data.id}`)
}

// ─── Update ───────────────────────────────────────────────────
export async function updateTask(id: string, formData: FormData) {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const task = await getTaskById(id)
  if (!task) return { error: 'Task not found.' }

  const role = effectiveRole(profile.system_role)

  // ── Reviewer: review outcome / notes only (no core metadata edits) ──
  if (role === 'reviewer') {
    if (task.reviewer_user_id !== user.id) return { error: MUTATION_FORBIDDEN }

    const status = (formData.get('status') as string)
    const notes = (formData.get('notes') as string)?.trim() || null
    const blocked_reason = (formData.get('blocked_reason') as string)?.trim() || null

    let completedDate = (formData.get('completed_date') as string) || null
    if (status === 'done' && !completedDate) {
      completedDate = new Date().toISOString().split('T')[0]
    }
    if (status !== 'done') {
      completedDate = null
    }

    const payload = { status, notes, blocked_reason, completed_date: completedDate }

    const { error } = await supabase.from('tasks').update(payload).eq('id', id)
    if (error) return { error: error.message }

    await logActivity({
      entity_type: 'task',
      entity_id:   id,
      action_type: 'status_updated',
      user_id:     user.id,
      note:        `Task review update (status ${status})`,
    })

    revalidatePath('/tasks')
    revalidatePath(`/tasks/${id}`)
    revalidatePath(`/projects/${task.project_id}`)
    redirect(`/tasks/${id}`)
  }

  // ── Member assignee: own execution fields only ──
  if (role === 'member') {
    if (task.assigned_to_user_id !== user.id) return { error: MUTATION_FORBIDDEN }

    const status = (formData.get('status') as string)
    let completedDate = (formData.get('completed_date') as string) || null
    if (status === 'done' && !completedDate) {
      completedDate = new Date().toISOString().split('T')[0]
    }
    if (status !== 'done') {
      completedDate = null
    }

    const payload = {
      status,
      progress_percent: parseInt((formData.get('progress_percent') as string) || '0', 10),
      notes:            (formData.get('notes') as string)?.trim() || null,
      blocked_reason:   (formData.get('blocked_reason') as string)?.trim() || null,
      drive_link:       (formData.get('drive_link') as string)?.trim() || null,
      actual_hours:     parseFloat((formData.get('actual_hours') as string) || '') || null,
      completed_date:   completedDate,
    }

    const { error } = await supabase.from('tasks').update(payload).eq('id', id)
    if (error) return { error: error.message }

    await logActivity({
      entity_type: 'task',
      entity_id:   id,
      action_type: 'status_updated',
      user_id:     user.id,
      note:        `Task status changed to ${status}`,
    })

    revalidatePath('/tasks')
    revalidatePath(`/tasks/${id}`)
    revalidatePath(`/projects/${task.project_id}`)
    redirect(`/tasks/${id}`)
  }

  // ── Admin / coordinator: full task edit ──
  if (role !== 'admin' && role !== 'coordinator') {
    return { error: MUTATION_FORBIDDEN }
  }

  if (role === 'coordinator') {
    const project = await getProjectById(task.project_id)
    if (!project || !(await userCanEditProjectMetadata(profile, project))) {
      return { error: MUTATION_FORBIDDEN }
    }
  }

  const title = (formData.get('title') as string)?.trim()
  const projectId = (formData.get('project_id') as string)?.trim()
  const assignedTo = (formData.get('assigned_to_user_id') as string)?.trim()

  if (!title) return { error: 'Task title is required.' }
  if (!projectId) return { error: 'Project is required.' }
  if (!assignedTo) return { error: 'Assignee is required.' }

  if (role === 'coordinator') {
    const dest = await ensureProjectOperationalMutation(profile, projectId)
    if ('error' in dest) return { error: dest.error }
  }

  const status = (formData.get('status') as string)
  const reviewerUserId = (formData.get('reviewer_user_id') as string)?.trim() || null

  let completedDate = (formData.get('completed_date') as string) || null
  if (status === 'done' && !completedDate) {
    completedDate = new Date().toISOString().split('T')[0]
  }
  if (status !== 'done') {
    completedDate = null
  }

  const payload = {
    title,
    project_id:           projectId,
    parent_task_id:       (formData.get('parent_task_id') as string)?.trim() || null,
    description:          (formData.get('description') as string)?.trim() || null,
    category:             (formData.get('category') as string)?.trim() || null,
    phase:                (formData.get('phase') as string)?.trim() || null,
    assigned_to_user_id:  assignedTo,
    reviewer_user_id:     reviewerUserId,
    start_date:           (formData.get('start_date') as string) || null,
    due_date:             (formData.get('due_date') as string) || null,
    completed_date:       completedDate,
    estimated_hours:      parseFloat((formData.get('estimated_hours') as string) || '') || null,
    actual_hours:         parseFloat((formData.get('actual_hours') as string) || '') || null,
    priority:             (formData.get('priority') as string),
    status,
    progress_percent:     parseInt((formData.get('progress_percent') as string) || '0', 10),
    blocked_reason:       (formData.get('blocked_reason') as string)?.trim() || null,
    drive_link:           (formData.get('drive_link') as string)?.trim() || null,
    notes:                (formData.get('notes') as string)?.trim() || null,
  }

  const { error } = await supabase
    .from('tasks')
    .update(payload)
    .eq('id', id)

  if (error) return { error: error.message }

  await logActivity({
    entity_type: 'task',
    entity_id:   id,
    action_type: 'status_updated',
    user_id:     user.id,
    note:        `Task status changed to ${status}`,
  })

  revalidatePath('/tasks')
  revalidatePath(`/tasks/${id}`)
  revalidatePath(`/projects/${projectId}`)
  redirect(`/tasks/${id}`)
}
