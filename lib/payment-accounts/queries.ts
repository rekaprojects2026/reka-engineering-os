import { createServerClient } from '@/lib/supabase/server'
import type { PaymentAccount } from '@/types/database'

export type AccountSummary = {
  accountId: string
  accountName: string
  accountType: string
  currency: string
  totalReceived: number
  pendingAmount: number
}

/** Per payment account: paid invoice gross (received) vs open pipeline (sent / partial / overdue). */
export async function getAccountReceiveSummary(): Promise<AccountSummary[]> {
  const supabase = await createServerClient()
  const [accountsRes, invRes] = await Promise.all([
    supabase.from('payment_accounts').select('id, name, account_type, currency, sort_order').order('sort_order', { ascending: true }),
    supabase.from('client_invoices').select('destination_account_id, status, gross_amount'),
  ])

  const accounts = accountsRes.data ?? []
  const invoices = invRes.data ?? []

  const received = new Map<string, number>()
  const pending = new Map<string, number>()

  for (const inv of invoices) {
    const aid = inv.destination_account_id as string | null | undefined
    if (!aid) continue
    const gross = Number(inv.gross_amount ?? 0)
    const st = inv.status as string
    if (st === 'paid') received.set(aid, (received.get(aid) ?? 0) + gross)
    else if (st === 'sent' || st === 'partial' || st === 'overdue') pending.set(aid, (pending.get(aid) ?? 0) + gross)
  }

  return accounts.map(a => ({
    accountId: a.id,
    accountName: a.name,
    accountType: a.account_type,
    currency: a.currency,
    totalReceived: received.get(a.id) ?? 0,
    pendingAmount: pending.get(a.id) ?? 0,
  }))
}

export async function getPaymentAccounts(activeOnly = false): Promise<PaymentAccount[]> {
  const supabase = await createServerClient()
  let query = supabase
    .from('payment_accounts')
    .select('*')
    .order('sort_order', { ascending: true })

  if (activeOnly) query = query.eq('is_active', true)

  const { data } = await query
  return data ?? []
}

export async function getPaymentAccountById(id: string): Promise<PaymentAccount | null> {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('payment_accounts')
    .select('*')
    .eq('id', id)
    .single()
  return data ?? null
}
