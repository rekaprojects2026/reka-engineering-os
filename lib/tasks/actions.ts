'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/activity/actions'
import { effectiveRole, isFreelancer, isManajer, isManagement, isSenior } from '@/lib/auth/permissions'
import {
  loadMutationProfile,
  ensureProjectOperationalMutation,
  MUTATION_FORBIDDEN,
} from '@/lib/auth/mutation-policy'
import { userCanEditProjectMetadata } from '@/lib/auth/access-surface'
import { getProjectById } from '@/lib/projects/queries'
import { userIsOnProjectRoster } from '@/lib/projects/team-queries'
import { getTaskById } from '@/lib/tasks/queries'
import { fireTaskCompletedWebhook } from '@/lib/webhooks/task-events'

// ─── Create ───────────────────────────────────────────────────
export async function createTask(formData: FormData) {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const title = (formData.get('title') as string)?.trim()
  const projectId = (formData.get('project_id') as string)?.trim()
  const assignedTo = (formData.get('assigned_to_user_id') as string)?.trim()
  const returnTo = (formData.get('return_to') as string)?.trim() || ''
  const parentTaskId = (formData.get('parent_task_id') as string)?.trim() || null

  if (!title) return { error: 'Task title is required.' }
  if (!projectId) return { error: 'Project is required.' }
  if (!assignedTo) return { error: 'Assignee is required.' }

  const gate = await ensureProjectOperationalMutation(profile, projectId)
  if ('error' in gate) return { error: gate.error }

  if (!(await userIsOnProjectRoster(supabase, projectId, assignedTo))) {
    return { error: 'Assignee must be a member of this project (team, lead, or reviewer).' }
  }

  let depth = 0
  let sortOrder = 0

  if (parentTaskId) {
    const { data: parent, error: pErr } = await supabase
      .from('tasks')
      .select('id, project_id, depth')
      .eq('id', parentTaskId)
      .maybeSingle()

    if (pErr) return { error: pErr.message }
    if (!parent) return { error: 'Parent task not found.' }
    if (parent.project_id !== projectId) {
      return { error: 'Parent task must belong to the same project.' }
    }

    depth = (parent.depth ?? 0) + 1

    const { data: sib } = await supabase
      .from('tasks')
      .select('sort_order')
      .eq('project_id', projectId)
      .eq('parent_task_id', parentTaskId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()

    const maxS = sib?.sort_order != null ? sib.sort_order : -1
    sortOrder = maxS + 1
  } else {
    const { data: top } = await supabase
      .from('tasks')
      .select('sort_order')
      .eq('project_id', projectId)
      .is('parent_task_id', null)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()

    const maxS = top?.sort_order != null ? top.sort_order : -1
    sortOrder = maxS + 1
  }

  const reviewerUserId = (formData.get('reviewer_user_id') as string)?.trim() || null

  if (reviewerUserId && !(await userIsOnProjectRoster(supabase, projectId, reviewerUserId))) {
    return { error: 'Reviewer must be a member of this project (team, lead, or reviewer).' }
  }

  const payload = {
    title,
    project_id:           projectId,
    parent_task_id:       parentTaskId,
    depth,
    sort_order:           sortOrder,
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
  revalidateTag('dashboard')

  if (returnTo === 'project') {
    redirect(`/projects/${projectId}?tab=tasks`)
  }
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
  if (isSenior(role)) {
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

    fireTaskCompletedWebhook(task.status, status, id, task.project_id)

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
    revalidateTag('dashboard')
    redirect(`/tasks/${id}`)
  }

  // ── Member assignee: own execution fields only ──
  if (role === 'member' || isFreelancer(role)) {
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

    fireTaskCompletedWebhook(task.status, status, id, task.project_id)

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
    revalidateTag('dashboard')
    redirect(`/tasks/${id}`)
  }

  // ── Admin / coordinator: full task edit ──
  if (!isManagement(role) && !isManajer(role)) {
    return { error: MUTATION_FORBIDDEN }
  }

  if (role === 'manajer') {
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

  if (role === 'manajer') {
    const dest = await ensureProjectOperationalMutation(profile, projectId)
    if ('error' in dest) return { error: dest.error }
  }

  if (!(await userIsOnProjectRoster(supabase, projectId, assignedTo))) {
    return { error: 'Assignee must be a member of this project (team, lead, or reviewer).' }
  }

  const status = (formData.get('status') as string)
  const reviewerUserId = (formData.get('reviewer_user_id') as string)?.trim() || null

  if (reviewerUserId && !(await userIsOnProjectRoster(supabase, projectId, reviewerUserId))) {
    return { error: 'Reviewer must be a member of this project (team, lead, or reviewer).' }
  }

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

  fireTaskCompletedWebhook(task.status, status, id, projectId)

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
  revalidateTag('dashboard')
  redirect(`/tasks/${id}`)
}

// ─── Quick status update (for inline/kanban) ──────────────────
export async function updateTaskStatus(id: string, status: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const completedDate = status === 'done' ? new Date().toISOString().split('T')[0] : null

  const { data: task, error: fetchError } = await supabase
    .from('tasks')
    .select('project_id, status')
    .eq('id', id)
    .single()

  if (fetchError) throw new Error(fetchError.message)

  const previousStatus = task?.status ?? ''

  const { error } = await supabase
    .from('tasks')
    .update({ status, completed_date: completedDate })
    .eq('id', id)

  if (error) throw new Error(error.message)

  if (task?.project_id) {
    fireTaskCompletedWebhook(previousStatus, status, id, task.project_id)
  }

  revalidatePath('/tasks')
  revalidatePath(`/tasks/${id}`)
  if (task?.project_id) revalidatePath(`/projects/${task.project_id}`)
  revalidateTag('dashboard')
}

// ─── Mark task problematic (admin / coordinator on project) ────
export async function markTaskProblematic(
  taskId: string,
  isProblematic: boolean,
  note?: string | null,
) {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  const task = await getTaskById(taskId)
  if (!task) throw new Error('Task not found.')

  const gate = await ensureProjectOperationalMutation(profile, task.project_id)
  if ('error' in gate) throw new Error(gate.error)

  const trimmed = typeof note === 'string' ? note.trim() : ''
  const { error } = await supabase
    .from('tasks')
    .update({
      is_problematic: isProblematic,
      problem_note: isProblematic && trimmed ? trimmed : null,
    })
    .eq('id', taskId)

  if (error) throw new Error(error.message)
  revalidatePath('/tasks')
  revalidatePath(`/tasks/${taskId}`)
  revalidatePath(`/projects/${task.project_id}`)
  revalidateTag('dashboard')
}
