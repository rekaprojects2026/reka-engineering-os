import { createServerClient } from '@/lib/supabase/server'
import type { Payslip, SystemRole } from '@/types/database'

export type PayslipWithProfile = Payslip & {
  profile: {
    full_name: string
    photo_url: string | null
    functional_role: string | null
    system_role: SystemRole | null
    bank_name: string | null
    bank_account_number: string | null
  } | null
  payment_accounts: { name: string } | null
}

export type PayslipMemberOption = {
  id: string
  full_name: string
  system_role: SystemRole | null
  photo_url: string | null
}

interface GetPayslipsOptions {
  profileId?: string
  month?: number
  year?: number
  status?: string
  search?: string
}

export async function getPayslips(opts: GetPayslipsOptions = {}): Promise<PayslipWithProfile[]> {
  const supabase = await createServerClient()
  let query = supabase
    .from('payslips')
    .select(`
      *,
      profile:profiles!payslips_profile_id_fkey ( full_name, photo_url, functional_role, system_role, bank_name, bank_account_number ),
      payment_accounts ( name )
    `)
    .order('created_at', { ascending: false })

  if (opts.profileId) query = query.eq('profile_id', opts.profileId)
  if (opts.month != null && opts.month >= 1 && opts.month <= 12) query = query.eq('period_month', opts.month)
  if (opts.year != null && opts.year > 2020) query = query.eq('period_year', opts.year)
  if (opts.status) query = query.eq('status', opts.status)

  const { data, error } = await query
  if (error) return []

  let rows = (data ?? []) as unknown as PayslipWithProfile[]

  if (opts.search?.trim()) {
    const q = opts.search.trim().toLowerCase()
    rows = rows.filter(
      r => r.profile?.full_name?.toLowerCase().includes(q)
    )
  }

  return rows
}

export async function getPayslipById(id: string): Promise<PayslipWithProfile | null> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('payslips')
    .select(`
      *,
      profile:profiles!payslips_profile_id_fkey ( full_name, photo_url, functional_role, system_role, bank_name, bank_account_number ),
      payment_accounts ( name )
    `)
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data as unknown as PayslipWithProfile
}

/** Next code PS-YYYYMM-NNN for the given calendar month */
export async function getNextPayslipCode(year: number, month: number): Promise<string> {
  const supabase = await createServerClient()
  const ym = `${year}${String(month).padStart(2, '0')}`
  const prefix = `PS-${ym}-`

  const { data } = await supabase
    .from('payslips')
    .select('payslip_code')
    .like('payslip_code', `${prefix}%`)
    .order('payslip_code', { ascending: false })
    .limit(1)

  const last = data?.[0]?.payslip_code as string | undefined
  let nextSeq = 1
  if (last?.startsWith(prefix)) {
    const tail = last.slice(prefix.length)
    const n = parseInt(tail, 10)
    if (!isNaN(n)) nextSeq = n + 1
  }
  return `${prefix}${String(nextSeq).padStart(3, '0')}`
}

/** Profiles eligible for payslip generation (internal payroll roles) */
export async function getProfilesForPayslipForm(): Promise<PayslipMemberOption[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, system_role, photo_url')
    .eq('is_active', true)
    .in('system_role', ['member', 'manajer', 'senior', 'technical_director', 'finance', 'direktur', 'freelancer'])
    .order('full_name', { ascending: true })

  if (error) return []
  return (data ?? []) as PayslipMemberOption[]
}
