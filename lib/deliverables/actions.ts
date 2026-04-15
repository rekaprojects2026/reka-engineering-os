'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

// ─── Create ───────────────────────────────────────────────────
export async function createDeliverable(formData: FormData) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const name = (formData.get('name') as string)?.trim()
  const projectId = (formData.get('project_id') as string)?.trim()
  const type = (formData.get('type') as string)?.trim()
  const preparedBy = (formData.get('prepared_by_user_id') as string)?.trim()

  if (!name) return { error: 'Deliverable name is required.' }
  if (!projectId) return { error: 'Project is required.' }
  if (!type) return { error: 'Deliverable type is required.' }
  if (!preparedBy) return { error: 'Prepared by is required.' }

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
  redirect(`/deliverables/${data.id}`)
}

// ─── Update ───────────────────────────────────────────────────
export async function updateDeliverable(id: string, formData: FormData) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const name = (formData.get('name') as string)?.trim()
  const projectId = (formData.get('project_id') as string)?.trim()
  const type = (formData.get('type') as string)?.trim()
  const preparedBy = (formData.get('prepared_by_user_id') as string)?.trim()

  if (!name) return { error: 'Deliverable name is required.' }
  if (!projectId) return { error: 'Project is required.' }
  if (!type) return { error: 'Deliverable type is required.' }
  if (!preparedBy) return { error: 'Prepared by is required.' }

  const status = (formData.get('status') as string)

  // Auto-set submitted_to_client_date when status → sent_to_client
  let submittedDate = (formData.get('submitted_to_client_date') as string) || null
  if (status === 'sent_to_client' && !submittedDate) {
    submittedDate = new Date().toISOString().split('T')[0]
  }

  // Auto-set approved_date when status → approved or final_issued
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

  revalidatePath('/deliverables')
  revalidatePath(`/deliverables/${id}`)
  revalidatePath(`/projects/${projectId}`)
  redirect(`/deliverables/${id}`)
}
