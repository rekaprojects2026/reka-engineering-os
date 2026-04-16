'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { loadMutationProfile, ensureCompensationOrPaymentMutation } from '@/lib/auth/mutation-policy'

function buildPayload(formData: FormData) {
  const total_due = parseFloat(formData.get('total_due') as string) || 0
  const total_paid = parseFloat(formData.get('total_paid') as string) || 0
  const balance = total_due - total_paid

  let payment_status: 'unpaid' | 'partial' | 'paid' = 'unpaid'
  if (total_paid >= total_due && total_due > 0) payment_status = 'paid'
  else if (total_paid > 0) payment_status = 'partial'

  return {
    member_id: formData.get('member_id') as string,
    period_label: (formData.get('period_label') as string)?.trim() || null,
    total_due,
    total_paid,
    balance,
    currency_code: (formData.get('currency_code') as string) || 'IDR',
    payment_status,
    payment_date: (formData.get('payment_date') as string) || null,
    payment_method: (formData.get('payment_method') as string) || null,
    payment_reference: (formData.get('payment_reference') as string)?.trim() || null,
    proof_link: (formData.get('proof_link') as string)?.trim() || null,
    notes: (formData.get('notes') as string)?.trim() || null,
  }
}

export async function createPayment(formData: FormData) {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const perm = ensureCompensationOrPaymentMutation(profile)
  if (perm) return { error: perm }

  const payload = buildPayload(formData)
  if (!payload.member_id) return { error: 'Member is required.' }

  const { data, error } = await supabase
    .from('payment_records')
    .insert({ ...payload, created_by: user.id })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/payments')
  redirect(`/payments/${data.id}`)
}

export async function updatePayment(id: string, formData: FormData) {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const perm = ensureCompensationOrPaymentMutation(profile)
  if (perm) return { error: perm }

  const payload = buildPayload(formData)
  if (!payload.member_id) return { error: 'Member is required.' }

  const { error } = await supabase
    .from('payment_records')
    .update(payload)
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/payments')
  revalidatePath(`/payments/${id}`)
  redirect(`/payments/${id}`)
}

export async function deletePayment(id: string) {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const perm = ensureCompensationOrPaymentMutation(profile)
  if (perm) return { error: perm }

  const { error } = await supabase
    .from('payment_records')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/payments')
  redirect('/payments')
}
