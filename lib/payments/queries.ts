import { createServerClient } from '@/lib/supabase/server'
import type { PaymentStatus } from '@/types/database'

export type PaymentRow = {
  id: string
  member_id: string
  period_label: string | null
  total_due: number
  total_paid: number
  balance: number
  currency_code: string
  payment_status: PaymentStatus
  payment_date: string | null
  payment_method: string | null
  payment_reference: string | null
  proof_link: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  member: { full_name: string } | null
}

const PAY_SELECT = `
  *,
  member:profiles!member_id(full_name)
`.trim()

export interface GetPaymentRecordsOptions {
  status?: string
  memberName?: string
  page?: number
  pageSize?: number
}

export async function getPaymentRecords(opts: GetPaymentRecordsOptions = {}): Promise<{ rows: PaymentRow[]; count: number }> {
  const supabase = await createServerClient()
  const { status, memberName, page = 1, pageSize = 30 } = opts

  let query = supabase
    .from('payment_records')
    .select(PAY_SELECT, { count: 'exact' })
    .order('created_at', { ascending: false })

  if (status) query = query.eq('payment_status', status)

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) return { rows: [], count: 0 }

  let rows = (data ?? []) as unknown as PaymentRow[]

  // Client-side member name filter (profile join can't be filtered server-side easily)
  if (memberName && memberName.trim()) {
    const needle = memberName.trim().toLowerCase()
    rows = rows.filter(r => (r.member?.full_name ?? '').toLowerCase().includes(needle))
  }

  return { rows, count: count ?? 0 }
}

export async function getPaymentById(id: string): Promise<PaymentRow | null> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('payment_records')
    .select(PAY_SELECT)
    .eq('id', id)
    .single()

  if (error) return null
  return data as unknown as PaymentRow
}

/** Payment rows for one member (admin team hub, or caller must pass the signed-in user on My Payments). */
export async function getPaymentsByMember(memberId: string): Promise<PaymentRow[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('payment_records')
    .select(PAY_SELECT)
    .eq('member_id', memberId)
    .order('created_at', { ascending: false })

  if (error) return []
  return (data ?? []) as unknown as PaymentRow[]
}
