'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { loadMutationProfile, ensureCompensationOrPaymentMutation } from '@/lib/auth/mutation-policy'
import { parsePaymentProofLink } from '@/lib/payments/proof-link'

function moneyInt(n: number): number {
  return Math.round(Number.isFinite(n) ? n : 0)
}

/** Derive status from due/paid; IDR amounts stored as whole numbers. */
function derivePaymentStatus(
  total_due: number,
  total_paid: number,
): 'unpaid' | 'partial' | 'paid' {
  const due = moneyInt(total_due)
  const paid = moneyInt(total_paid)
  if (due <= 0) {
    if (paid <= 0) return 'paid'
    return 'partial'
  }
  if (paid >= due) return 'paid'
  if (paid > 0) return 'partial'
  return 'unpaid'
}

type PaymentPayload = {
  member_id: string
  period_label: string | null
  total_due: number
  total_paid: number
  balance: number
  currency_code: string
  payment_status: 'unpaid' | 'partial' | 'paid'
  payment_date: string | null
  payment_method: string | null
  payment_reference: string | null
  proof_link: string | null
  notes: string | null
}

function buildPayload(formData: FormData): { ok: true; payload: PaymentPayload } | { ok: false; error: string } {
  const total_due = moneyInt(parseFloat(formData.get('total_due') as string) || 0)
  const total_paid = moneyInt(parseFloat(formData.get('total_paid') as string) || 0)
  const balance = moneyInt(total_due - total_paid)
  const payment_status = derivePaymentStatus(total_due, total_paid)

  const proofRaw = (formData.get('proof_link') as string)?.trim() || null
  const proofParsed = parsePaymentProofLink(proofRaw)
  if (!proofParsed.ok) return { ok: false, error: proofParsed.message }

  return {
    ok: true,
    payload: {
      member_id: formData.get('member_id') as string,
      period_label: (formData.get('period_label') as string)?.trim() || null,
      total_due,
      total_paid,
      balance,
      currency_code: (formData.get('currency_code') as string) || 'IDR',
      payment_status,
      payment_date: (formData.get('payment_date') as string) || null,
      payment_method: (formData.get('payment_method') as string)?.trim() || null,
      payment_reference: (formData.get('payment_reference') as string)?.trim() || null,
      proof_link: proofParsed.href,
      notes: (formData.get('notes') as string)?.trim() || null,
    },
  }
}

export async function createPayment(formData: FormData) {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const perm = ensureCompensationOrPaymentMutation(profile)
  if (perm) return { error: perm }

  const built = buildPayload(formData)
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

  const built = buildPayload(formData)
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
