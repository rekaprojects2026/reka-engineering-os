'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { loadMutationProfile, ensureCompensationOrPaymentMutation } from '@/lib/auth/mutation-policy'
import { buildPaymentPayload } from '@/lib/payments/helpers'

export async function createPayment(formData: FormData) {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const perm = ensureCompensationOrPaymentMutation(profile)
  if (perm) return { error: perm }

  const built = buildPaymentPayload(formData)
  if (!built.ok) return { error: built.error }
  const payload = built.payload
  if (!payload.member_id) return { error: 'Member is required.' }

  const { data, error } = await supabase
    .from('payment_records')
    .insert({ ...payload, created_by: user.id })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/payments')
  revalidatePath('/my-payments')
  redirect(`/payments/${data.id}`)
}

export async function updatePayment(id: string, formData: FormData) {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const perm = ensureCompensationOrPaymentMutation(profile)
  if (perm) return { error: perm }

  const built = buildPaymentPayload(formData)
  if (!built.ok) return { error: built.error }
  const payload = built.payload
  if (!payload.member_id) return { error: 'Member is required.' }

  const { error } = await supabase
    .from('payment_records')
    .update(payload)
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/payments')
  revalidatePath(`/payments/${id}`)
  revalidatePath('/my-payments')
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
  revalidatePath('/my-payments')
  redirect('/payments')
}
