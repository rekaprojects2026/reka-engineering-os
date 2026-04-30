'use server'

import { createServerClient } from '@/lib/supabase/server'
import { getSessionProfile, requireRole } from '@/lib/auth/session'
import { revalidatePath } from 'next/cache'

export async function createPaymentAccount(formData: FormData) {
  const sp = await getSessionProfile()
  requireRole(sp.system_role, ['finance'])

  const supabase = await createServerClient()
  const { error } = await supabase.from('payment_accounts').insert({
    name: formData.get('name') as string,
    account_type: formData.get('account_type') as string,
    currency: formData.get('currency') as string,
    account_identifier: (formData.get('account_identifier') as string) || null,
    description: (formData.get('description') as string) || null,
    sort_order: parseInt(formData.get('sort_order') as string) || 0,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/settings')
  revalidatePath('/finance')
  revalidatePath('/finance/payment-accounts')
}

export async function updatePaymentAccount(id: string, formData: FormData) {
  const sp = await getSessionProfile()
  requireRole(sp.system_role, ['finance'])

  const supabase = await createServerClient()
  const { error } = await supabase.from('payment_accounts').update({
    name: formData.get('name') as string,
    account_type: formData.get('account_type') as string,
    currency: formData.get('currency') as string,
    account_identifier: (formData.get('account_identifier') as string) || null,
    description: (formData.get('description') as string) || null,
    sort_order: parseInt(formData.get('sort_order') as string) || 0,
  }).eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/settings')
  revalidatePath('/finance/payment-accounts')
}

export async function togglePaymentAccount(id: string, currentActive: boolean) {
  const sp = await getSessionProfile()
  requireRole(sp.system_role, ['finance'])

  const supabase = await createServerClient()
  const { error } = await supabase
    .from('payment_accounts')
    .update({ is_active: !currentActive })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/settings')
  revalidatePath('/finance/payment-accounts')
}

export async function deletePaymentAccount(id: string) {
  const sp = await getSessionProfile()
  requireRole(sp.system_role, ['finance'])

  const supabase = await createServerClient()
  const { error } = await supabase.from('payment_accounts').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/settings')
  revalidatePath('/finance/payment-accounts')
}
