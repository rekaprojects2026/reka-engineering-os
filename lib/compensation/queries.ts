import { createServerClient } from '@/lib/supabase/server'
import type { SessionProfile } from '@/lib/auth/session'
import { isManajer } from '@/lib/auth/permissions'
import type { CompensationStatus, RateType } from '@/types/database'

export type CompensationRow = {
  id: string
  member_id: string
  project_id: string
  task_id: string | null
  deliverable_id: string | null
  rate_type: RateType
  qty: number
  rate_amount: number
  subtotal_amount: number
  currency_code: string
  status: CompensationStatus
  period_label: string | null
  work_date: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  proposed_by: string | null
  proposed_at: string | null
  return_note: string | null
  finance_note: string | null
  confirmed_by: string | null
  confirmed_at: string | null
  is_monthly_fixed_direct: boolean
  member: { full_name: string } | null
  project: { name: string } | null
  proposer: { full_name: string } | null
  confirmer: { full_name: string } | null
}

export type CompensationListFilter = 'all' | 'draft' | 'confirmed'

export interface GetCompensationRecordsResult {
  rows: CompensationRow[]
  count: number
}

const COMP_SELECT = `
  *,
  member:profiles!member_id(full_name),
  project:projects!project_id(name),
  proposer:profiles!proposed_by(full_name),
  confirmer:profiles!confirmed_by(full_name)
`.trim()

export async function getCompensationRecords(
  profile: SessionProfile,
  filter: CompensationListFilter = 'all',
  opts?: { page?: number; pageSize?: number },
): Promise<GetCompensationRecordsResult> {
  const supabase = await createServerClient()
  const paginate = opts?.page != null && opts?.pageSize != null
  const page = opts?.page ?? 1
  const pageSize = opts?.pageSize ?? 50
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let q = supabase
    .from('compensation_records')
    .select(COMP_SELECT, paginate ? { count: 'exact' } : undefined)
    .order('created_at', { ascending: false })

  if (isManajer(profile.system_role)) {
    q = q.eq('proposed_by', profile.id)
  }

  if (filter === 'draft') {
    q = q.eq('status', 'draft')
  } else if (filter === 'confirmed') {
    q = q.eq('status', 'confirmed')
  }

  if (paginate) {
    q = q.range(from, to)
  }

  const { data, error, count } = await q
  if (error) return { rows: [], count: 0 }
  const rows = (data ?? []) as unknown as CompensationRow[]
  return { rows, count: paginate ? count ?? 0 : rows.length }
}

export async function countDraftCompensationRecords(): Promise<number> {
  const supabase = await createServerClient()
  const { count, error } = await supabase
    .from('compensation_records')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'draft')

  if (error) return 0
  return count ?? 0
}

export async function getCompensationById(id: string): Promise<CompensationRow | null> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('compensation_records')
    .select(COMP_SELECT)
    .eq('id', id)
    .single()

  if (error) return null
  return data as unknown as CompensationRow
}

export async function getCompensationByMember(memberId: string): Promise<CompensationRow[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('compensation_records')
    .select(COMP_SELECT)
    .eq('member_id', memberId)
    .order('created_at', { ascending: false })

  if (error) return []
  return (data ?? []) as unknown as CompensationRow[]
}
