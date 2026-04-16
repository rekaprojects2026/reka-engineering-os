'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/activity/actions'
import {
  loadMutationProfile,
  ensureCreateProjectMutation,
  ensureProjectOperationalMutation,
} from '@/lib/auth/mutation-policy'

// ─── Create ───────────────────────────────────────────────────
export async function createProject(formData: FormData) {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const perm = ensureCreateProjectMutation(profile)
  if (perm) return { error: perm }

  const name = (formData.get('name') as string)?.trim()
  const clientId = (formData.get('client_id') as string)?.trim()
  const leadUserId = (formData.get('project_lead_user_id') as string)?.trim()
  const targetDueDate = (formData.get('target_due_date') as string)?.trim()

  // Server-side validation
  if (!name) return { error: 'Project name is required.' }
  if (!clientId) return { error: 'Client is required.' }
  if (!leadUserId) return { error: 'Project lead is required.' }
  if (!targetDueDate) return { error: 'Target due date is required.' }

  const intakeId = (formData.get('intake_id') as string)?.trim() || null
  const reviewerUserId = (formData.get('reviewer_user_id') as string)?.trim() || null

  const payload = {
    name,
    client_id:              clientId,
    intake_id:              intakeId,
    source:                 (formData.get('source') as string) || 'direct',
    external_reference_url: (formData.get('external_reference_url') as string)?.trim() || null,
    discipline:             (formData.get('discipline') as string) || 'mechanical',
    project_type:           (formData.get('project_type') as string) || 'design',
    scope_summary:          (formData.get('scope_summary') as string)?.trim() || null,
    start_date:             (formData.get('start_date') as string) || new Date().toISOString().split('T')[0],
    target_due_date:        targetDueDate,
    project_lead_user_id:   leadUserId,
    reviewer_user_id:       reviewerUserId,
    priority:               (formData.get('priority') as string) || 'medium',
    status:                 (formData.get('status') as string) || 'new',
    progress_percent:       parseInt((formData.get('progress_percent') as string) || '0', 10),
    waiting_on:             (formData.get('waiting_on') as string) || 'none',
    google_drive_folder_link: (formData.get('google_drive_folder_link') as string)?.trim() || null,
    notes_internal:         (formData.get('notes_internal') as string)?.trim() || null,
    created_by:             user.id,
    project_code:           '', // trigger will generate
  }

  const { data, error } = await supabase
    .from('projects')
    .insert(payload)
    .select('id')
    .single()

  if (error) return { error: error.message }

  await logActivity({
    entity_type: 'project',
    entity_id:   data.id,
    action_type: 'created',
    user_id:     user.id,
    note:        `Project '${name}' created`,
  })

  revalidatePath('/projects')
  revalidatePath(`/clients/${clientId}`)
  redirect(`/projects/${data.id}`)
}

// ─── Update ───────────────────────────────────────────────────
export async function updateProject(id: string, formData: FormData) {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const gate = await ensureProjectOperationalMutation(profile, id)
  if ('error' in gate) return { error: gate.error }

  const name = (formData.get('name') as string)?.trim()
  const clientId = (formData.get('client_id') as string)?.trim()
  const leadUserId = (formData.get('project_lead_user_id') as string)?.trim()
  const targetDueDate = (formData.get('target_due_date') as string)?.trim()

  if (!name) return { error: 'Project name is required.' }
  if (!clientId) return { error: 'Client is required.' }
  if (!leadUserId) return { error: 'Project lead is required.' }
  if (!targetDueDate) return { error: 'Target due date is required.' }

  const reviewerUserId = (formData.get('reviewer_user_id') as string)?.trim() || null

  const payload = {
    name,
    client_id:              clientId,
    source:                 (formData.get('source') as string),
    external_reference_url: (formData.get('external_reference_url') as string)?.trim() || null,
    discipline:             (formData.get('discipline') as string),
    project_type:           (formData.get('project_type') as string),
    scope_summary:          (formData.get('scope_summary') as string)?.trim() || null,
    start_date:             (formData.get('start_date') as string),
    target_due_date:        targetDueDate,
    actual_completion_date: (formData.get('actual_completion_date') as string) || null,
    project_lead_user_id:   leadUserId,
    reviewer_user_id:       reviewerUserId,
    priority:               (formData.get('priority') as string),
    status:                 (formData.get('status') as string),
    progress_percent:       parseInt((formData.get('progress_percent') as string) || '0', 10),
    waiting_on:             (formData.get('waiting_on') as string),
    google_drive_folder_link: (formData.get('google_drive_folder_link') as string)?.trim() || null,
    notes_internal:         (formData.get('notes_internal') as string)?.trim() || null,
  }

  const { error } = await supabase
    .from('projects')
    .update(payload)
    .eq('id', id)

  if (error) return { error: error.message }

  await logActivity({
    entity_type: 'project',
    entity_id:   id,
    action_type: 'status_updated',
    user_id:     user.id,
    note:        `Project status set to ${payload.status}`,
  })

  revalidatePath('/projects')
  revalidatePath(`/projects/${id}`)
  revalidatePath(`/clients/${clientId}`)
  redirect(`/projects/${id}`)
}
