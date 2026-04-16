'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { loadMutationProfile, ensureCompensationOrPaymentMutation } from '@/lib/auth/mutation-policy'

function buildPayload(formData: FormData) {
  const qty = parseFloat(formData.get('qty') as string) || 1
  const rate_amount = parseFloat(formData.get('rate_amount') as string) || 0
  const subtotal_amount = qty * rate_amount

  return {
    member_id: formData.get('member_id') as string,
    project_id: formData.get('project_id') as string,
    task_id: (formData.get('task_id') as string) || null,
    deliverable_id: (formData.get('deliverable_id') as string) || null,
    rate_type: formData.get('rate_type') as string,
    qty,
    rate_amount,
    subtotal_amount,
    currency_code: (formData.get('currency_code') as string) || 'IDR',
    status: (formData.get('status') as string) || 'draft',
    period_label: (formData.get('period_label') as string)?.trim() || null,
    work_date: (formData.get('work_date') as string) || null,
    notes: (formData.get('notes') as string)?.trim() || null,
  }
}

export async function createCompensation(formData: FormData) {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const perm = ensureCompensationOrPaymentMutation(profile)
  if (perm) return { error: perm }

  const payload = buildPayload(formData)
  if (!payload.member_id) return { error: 'Member is required.' }
  if (!payload.project_id) return { error: 'Project is required.' }
  if (!payload.rate_type) return { error: 'Rate type is required.' }

  const { data, error } = await supabase
    .from('compensation_records')
    .insert({ ...payload, created_by: user.id })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/compensation')
  redirect(`/compensation/${data.id}`)
}

export async function updateCompensation(id: string, formData: FormData) {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const perm = ensureCompensationOrPaymentMutation(profile)
  if (perm) return { error: perm }

  const payload = buildPayload(formData)
  if (!payload.member_id) return { error: 'Member is required.' }
  if (!payload.project_id) return { error: 'Project is required.' }

  const { error } = await supabase
    .from('compensation_records')
    .update(payload)
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/compensation')
  revalidatePath(`/compensation/${id}`)
  redirect(`/compensation/${id}`)
}

export async function deleteCompensation(id: string) {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const perm = ensureCompensationOrPaymentMutation(profile)
  if (perm) return { error: perm }

  const { error } = await supabase
    .from('compensation_records')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/compensation')
  redirect('/compensation')
}
