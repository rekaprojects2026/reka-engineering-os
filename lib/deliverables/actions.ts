'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/activity/actions'
import { effectiveRole, isFreelancer, isManajer, isManagement, isSenior } from '@/lib/auth/permissions'
import {
  loadMutationProfile,
  ensureAdminOrCoordinator,
  ensureProjectOperationalMutation,
  ensureDeliverableUpdateAccess,
  MUTATION_FORBIDDEN,
} from '@/lib/auth/mutation-policy'
import { getDeliverableById } from '@/lib/deliverables/queries'

// ─── Create ───────────────────────────────────────────────────
export async function createDeliverable(formData: FormData) {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const perm = ensureAdminOrCoordinator(profile)
  if (perm) return { error: perm }

  const name = (formData.get('name') as string)?.trim()
  const projectId = (formData.get('project_id') as string)?.trim()
  const type = (formData.get('type') as string)?.trim()
  const preparedBy = (formData.get('prepared_by_user_id') as string)?.trim()

  if (!name) return { error: 'Deliverable name is required.' }
  if (!projectId) return { error: 'Project is required.' }
  if (!type) return { error: 'Deliverable type is required.' }
  if (!preparedBy) return { error: 'Prepared by is required.' }

  const gate = await ensureProjectOperationalMutation(profile, projectId)
  if ('error' in gate) return { error: gate.error }

  const payload = {
    name,
    project_id:              projectId,
    linked_task_id:          (formData.get('linked_task_id') as string)?.trim() || null,
    type,
    revision_number:         parseInt((formData.get('revision_number') as string) || '0', 10),
    version_label:           (formData.get('version_label') as string)?.trim() || null,
    description:             (formData.get('description') as string)?.trim() || null,
    status:                  (formData.get('status') as string) || 'draft',
    prepared_by_user_id:     preparedBy,
    reviewed_by_user_id:     (formData.get('reviewed_by_user_id') as string)?.trim() || null,
    submitted_to_client_date: (formData.get('submitted_to_client_date') as string) || null,
    approved_date:           (formData.get('approved_date') as string) || null,
    client_feedback_summary: (formData.get('client_feedback_summary') as string)?.trim() || null,
    file_link:               (formData.get('file_link') as string)?.trim() || null,
    created_by:              user.id,
  }

  const { data, error } = await supabase
    .from('deliverables')
    .insert(payload)
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/deliverables')
  revalidatePath(`/projects/${projectId}`)
  revalidateTag('dashboard')
  redirect(`/deliverables/${data.id}`)
}

// ─── Update ───────────────────────────────────────────────────
export async function updateDeliverable(id: string, formData: FormData) {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const checked = await ensureDeliverableUpdateAccess(profile, id, getDeliverableById)
  if ('error' in checked) return { error: checked.error }
  const d = checked.d

  const role = effectiveRole(profile.system_role)

  // ── Reviewer: review outcome / client feedback only ──
  if (isSenior(role)) {
    const status = (formData.get('status') as string)

    let submittedDate = (formData.get('submitted_to_client_date') as string) || d.submitted_to_client_date
    if (status === 'sent_to_client' && !submittedDate) {
      submittedDate = new Date().toISOString().split('T')[0]
    }

    let approvedDate = (formData.get('approved_date') as string) || d.approved_date
    if ((status === 'approved' || status === 'final_issued') && !approvedDate) {
      approvedDate = new Date().toISOString().split('T')[0]
    }

    const payload = {
      status,
      submitted_to_client_date: submittedDate,
      approved_date:           approvedDate,
      client_feedback_summary: (formData.get('client_feedback_summary') as string)?.trim() || null,
    }

    const { error } = await supabase.from('deliverables').update(payload).eq('id', id)
    if (error) return { error: error.message }

    await logActivity({
      entity_type: 'deliverable',
      entity_id:   id,
      action_type: 'status_updated',
      user_id:     user.id,
      note:        `Deliverable review update (status ${status})`,
    })

    revalidatePath('/deliverables')
    revalidatePath(`/deliverables/${id}`)
    revalidatePath(`/projects/${d.project_id}`)
    revalidateTag('dashboard')
    redirect(`/deliverables/${id}`)
  }

  // ── Member preparer: own submission fields (no internal review notes) ──
  if (role === 'member' || isFreelancer(role)) {
    if (d.prepared_by_user_id !== user.id) return { error: MUTATION_FORBIDDEN }

    const name = (formData.get('name') as string)?.trim()
    const type = (formData.get('type') as string)?.trim()
    if (!name) return { error: 'Deliverable name is required.' }
    if (!type) return { error: 'Deliverable type is required.' }

    const status = (formData.get('status') as string)

    let submittedDate = (formData.get('submitted_to_client_date') as string) || d.submitted_to_client_date
    if (status === 'sent_to_client' && !submittedDate) {
      submittedDate = new Date().toISOString().split('T')[0]
    }

    let approvedDate = (formData.get('approved_date') as string) || d.approved_date
    if ((status === 'approved' || status === 'final_issued') && !approvedDate) {
      approvedDate = new Date().toISOString().split('T')[0]
    }

    const payload = {
      name,
      project_id:              d.project_id,
      linked_task_id:          (formData.get('linked_task_id') as string)?.trim() || null,
      type,
      revision_number:         parseInt((formData.get('revision_number') as string) || '0', 10),
      version_label:           (formData.get('version_label') as string)?.trim() || null,
      description:             (formData.get('description') as string)?.trim() || null,
      status,
      prepared_by_user_id:     d.prepared_by_user_id,
      reviewed_by_user_id:     d.reviewed_by_user_id,
      submitted_to_client_date: submittedDate,
      approved_date:           approvedDate,
      file_link:               (formData.get('file_link') as string)?.trim() || null,
    }

    const { error } = await supabase.from('deliverables').update(payload).eq('id', id)
    if (error) return { error: error.message }

    await logActivity({
      entity_type: 'deliverable',
      entity_id:   id,
      action_type: 'status_updated',
      user_id:     user.id,
      note:        `Deliverable status changed to ${status}`,
    })

    revalidatePath('/deliverables')
    revalidatePath(`/deliverables/${id}`)
    revalidatePath(`/projects/${d.project_id}`)
    revalidateTag('dashboard')
    redirect(`/deliverables/${id}`)
  }

  // ── Admin / coordinator: full edit ──
  if (!isManagement(role) && !isManajer(role)) {
    return { error: MUTATION_FORBIDDEN }
  }

  const name = (formData.get('name') as string)?.trim()
  const projectId = (formData.get('project_id') as string)?.trim()
  const type = (formData.get('type') as string)?.trim()
  const preparedBy = (formData.get('prepared_by_user_id') as string)?.trim()

  if (!name) return { error: 'Deliverable name is required.' }
  if (!projectId) return { error: 'Project is required.' }
  if (!type) return { error: 'Deliverable type is required.' }
  if (!preparedBy) return { error: 'Prepared by is required.' }

  if (role === 'manajer') {
    const dest = await ensureProjectOperationalMutation(profile, projectId)
    if ('error' in dest) return { error: dest.error }
  }

  const status = (formData.get('status') as string)

  let submittedDate = (formData.get('submitted_to_client_date') as string) || null
  if (status === 'sent_to_client' && !submittedDate) {
    submittedDate = new Date().toISOString().split('T')[0]
  }

  let approvedDate = (formData.get('approved_date') as string) || null
  if ((status === 'approved' || status === 'final_issued') && !approvedDate) {
    approvedDate = new Date().toISOString().split('T')[0]
  }

  const payload = {
    name,
    project_id:              projectId,
    linked_task_id:          (formData.get('linked_task_id') as string)?.trim() || null,
    type,
    revision_number:         parseInt((formData.get('revision_number') as string) || '0', 10),
    version_label:           (formData.get('version_label') as string)?.trim() || null,
    description:             (formData.get('description') as string)?.trim() || null,
    status,
    prepared_by_user_id:     preparedBy,
    reviewed_by_user_id:     (formData.get('reviewed_by_user_id') as string)?.trim() || null,
    submitted_to_client_date: submittedDate,
    approved_date:           approvedDate,
    client_feedback_summary: (formData.get('client_feedback_summary') as string)?.trim() || null,
    file_link:               (formData.get('file_link') as string)?.trim() || null,
  }

  const { error } = await supabase
    .from('deliverables')
    .update(payload)
    .eq('id', id)

  if (error) return { error: error.message }

  await logActivity({
    entity_type: 'deliverable',
    entity_id:   id,
    action_type: 'status_updated',
    user_id:     user.id,
    note:        `Deliverable status changed to ${status}`,
  })

  revalidatePath('/deliverables')
  revalidatePath(`/deliverables/${id}`)
  revalidatePath(`/projects/${projectId}`)
  revalidateTag('dashboard')
  redirect(`/deliverables/${id}`)
}
