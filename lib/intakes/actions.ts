'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getSessionProfile, requireRole } from '@/lib/auth/session'
import { loadMutationProfile, ensureIntakeMutation } from '@/lib/auth/mutation-policy'

// ─── Create ───────────────────────────────────────────────────
export async function createIntake(formData: FormData) {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const perm = ensureIntakeMutation(profile)
  if (perm) return { error: perm }

  const clientId = (formData.get('client_id') as string)?.trim() || null
  const tempClientName = (formData.get('temp_client_name') as string)?.trim() || null
  const title = (formData.get('title') as string)?.trim()
  const budgetRaw = formData.get('budget_estimate') as string

  // Server-side validation
  if (!title) return { error: 'Title is required.' }
  if (!clientId && !tempClientName) {
    return { error: 'Either a linked client or a prospect name is required.' }
  }

  const payload = {
    client_id:             clientId || null,
    temp_client_name:      clientId ? null : tempClientName, // clear if client linked
    source:                formData.get('source') as string || 'direct',
    external_reference_url: (formData.get('external_reference_url') as string)?.trim() || null,
    title,
    short_brief:           (formData.get('short_brief') as string)?.trim() || null,
    discipline:            formData.get('discipline') as string || 'mechanical',
    project_type:          formData.get('project_type') as string || 'design',
    proposed_deadline:     (formData.get('proposed_deadline') as string) || null,
    budget_estimate:       budgetRaw ? parseFloat(budgetRaw) : null,
    estimated_complexity:  formData.get('estimated_complexity') as string || null,
    qualification_notes:   (formData.get('qualification_notes') as string)?.trim() || null,
    status:                formData.get('status') as string || 'new',
    received_date:         (formData.get('received_date') as string) || new Date().toISOString().split('T')[0],
    created_by:            user.id,
    intake_code:           '', // trigger will generate
  }

  const { data, error } = await supabase
    .from('intakes')
    .insert(payload)
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/intakes')
  if (payload.client_id) revalidatePath(`/clients/${payload.client_id}`)
  redirect(`/intakes/${data.id}`)
}

// ─── Update ───────────────────────────────────────────────────
export async function updateIntake(id: string, formData: FormData) {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const perm = ensureIntakeMutation(profile)
  if (perm) return { error: perm }

  const clientId = (formData.get('client_id') as string)?.trim() || null
  const tempClientName = (formData.get('temp_client_name') as string)?.trim() || null
  const title = (formData.get('title') as string)?.trim()
  const budgetRaw = formData.get('budget_estimate') as string

  if (!title) return { error: 'Title is required.' }
  if (!clientId && !tempClientName) {
    return { error: 'Either a linked client or a prospect name is required.' }
  }

  const payload = {
    client_id:             clientId || null,
    temp_client_name:      clientId ? null : tempClientName,
    source:                formData.get('source') as string,
    external_reference_url: (formData.get('external_reference_url') as string)?.trim() || null,
    title,
    short_brief:           (formData.get('short_brief') as string)?.trim() || null,
    discipline:            formData.get('discipline') as string,
    project_type:          formData.get('project_type') as string,
    proposed_deadline:     (formData.get('proposed_deadline') as string) || null,
    budget_estimate:       budgetRaw ? parseFloat(budgetRaw) : null,
    estimated_complexity:  formData.get('estimated_complexity') as string || null,
    qualification_notes:   (formData.get('qualification_notes') as string)?.trim() || null,
    status:                formData.get('status') as string,
    received_date:         formData.get('received_date') as string,
  }

  const { error } = await supabase
    .from('intakes')
    .update(payload)
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/intakes')
  revalidatePath(`/intakes/${id}`)
  if (payload.client_id) revalidatePath(`/clients/${payload.client_id}`)
  redirect(`/intakes/${id}`)
}

const INTAKE_MUTABLE_STATUSES = new Set([
  'new',
  'awaiting_info',
  'qualified',
  'rejected',
  'closed',
])

/** Update intake status from inline / quick select (not for marking converted — use convert flow). */
export async function updateIntakeStatus(
  intakeId: string,
  newStatus: string,
): Promise<{ error: string } | void> {
  const supabase = await createServerClient()
  const profile = await getSessionProfile()
  requireRole(profile.system_role, ['direktur', 'technical_director', 'manajer', 'bd'])

  const perm = ensureIntakeMutation(profile)
  if (perm) return { error: perm }

  if (newStatus === 'converted') {
    return { error: 'Use “Convert to project” to mark an intake as converted.' }
  }
  if (!INTAKE_MUTABLE_STATUSES.has(newStatus)) {
    return { error: 'Invalid status.' }
  }

  const { error } = await supabase
    .from('intakes')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', intakeId)

  if (error) return { error: error.message }

  revalidatePath('/intakes')
  revalidatePath('/leads')
  revalidatePath(`/intakes/${intakeId}`)
  revalidatePath(`/leads/${intakeId}`)
}
