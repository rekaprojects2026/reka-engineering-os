'use server'

import { createServerClient } from '@/lib/supabase/server'
import { getSessionProfile, requireRole } from '@/lib/auth/session'
import { revalidatePath } from 'next/cache'
import { getNextPayslipCode } from '@/lib/payslips/queries'

export type PayslipActionResult = { error?: string }

export async function createPayslip(formData: FormData): Promise<PayslipActionResult> {
  const sp = await getSessionProfile()
  requireRole(sp.system_role, ['direktur', 'finance'])

  const supabase = await createServerClient()

  const profile_id = formData.get('profile_id') as string
  const period_month = parseInt(formData.get('period_month') as string, 10)
  const period_year = parseInt(formData.get('period_year') as string, 10)
  const currency = ((formData.get('base_amount_currency') as string) || 'IDR').toUpperCase()
  const base_amount = parseFloat(formData.get('base_amount') as string) || 0
  const bonus_amount = parseFloat(formData.get('bonus_amount') as string) || 0
  const deduction_amount = parseFloat(formData.get('deduction_amount') as string) || 0
  const payment_account_id = (formData.get('payment_account_id') as string) || null
  const notes = (formData.get('notes') as string) || null

  if (!profile_id) return { error: 'Member is required' }
  if (period_month < 1 || period_month > 12 || isNaN(period_month)) return { error: 'Invalid month' }
  if (period_year <= 2020 || isNaN(period_year)) return { error: 'Invalid year' }
  if (currency !== 'IDR' && currency !== 'USD') return { error: 'Currency must be IDR or USD' }

  const payslip_code = await getNextPayslipCode(period_year, period_month)

  const { error } = await supabase.from('payslips').insert({
    payslip_code,
    profile_id,
    period_month,
    period_year,
    base_amount,
    currency,
    bonus_amount,
    deduction_amount,
    payment_account_id: payment_account_id || null,
    notes,
    generated_by: sp.id,
  })

  if (error) return { error: error.message }

  revalidatePath('/finance/payslips')
  return {}
}

export async function markPayslipPaid(payslipId: string): Promise<PayslipActionResult> {
  const sp = await getSessionProfile()
  requireRole(sp.system_role, ['direktur', 'finance'])

  const supabase = await createServerClient()

  const { data: existing, error: fetchErr } = await supabase
    .from('payslips')
    .select('status')
    .eq('id', payslipId)
    .single()

  if (fetchErr || !existing) return { error: fetchErr?.message ?? 'Payslip not found' }
  if (existing.status === 'paid') return { error: 'Already marked as paid' }

  const { error } = await supabase
    .from('payslips')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', payslipId)

  if (error) return { error: error.message }

  revalidatePath('/finance/payslips')
  revalidatePath(`/finance/payslips/${payslipId}`)
  return {}
}

export async function deletePayslip(payslipId: string): Promise<PayslipActionResult> {
  const sp = await getSessionProfile()
  requireRole(sp.system_role, ['direktur', 'finance'])

  const supabase = await createServerClient()

  const { data: row, error: fetchErr } = await supabase
    .from('payslips')
    .select('status')
    .eq('id', payslipId)
    .single()

  if (fetchErr || !row) return { error: fetchErr?.message ?? 'Payslip not found' }
  if (row.status !== 'draft') return { error: 'Only draft payslips can be deleted' }

  const { error } = await supabase.from('payslips').delete().eq('id', payslipId)
  if (error) return { error: error.message }

  revalidatePath('/finance/payslips')
  return {}
}
