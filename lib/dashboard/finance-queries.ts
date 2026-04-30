/**
 * Finance dashboard — receivables, payables, pending compensations, recent docs.
 */

import { createServerClient } from '@/lib/supabase/server'
import { getInvoiceSummary } from '@/lib/invoices/queries'
import { getPaymentSnapshot } from '@/lib/dashboard/queries'
import { countDraftCompensationRecords } from '@/lib/compensation/queries'
import type { PaymentSnapshot } from '@/lib/dashboard/queries'

export type OverdueInvoiceRow = {
  id: string
  invoice_code: string
  net_amount: number
  currency: string
  due_date: string | null
  clients: { client_name: string } | null
}

export type PendingCompensationRow = {
  id: string
  subtotal_amount: number
  currency_code: string
  created_at: string
  member: { full_name: string } | null
}

export type PayslipStats = {
  draftCount: number
  sentCount: number
  paidCount: number
}

export type RecentInvoiceRow = {
  id: string
  invoice_code: string
  status: string
  net_amount: number
  currency: string
  updated_at: string
}

export type RecentPayslipRow = {
  id: string
  payslip_code: string
  status: string
  net_amount: number
  currency: string
  updated_at: string
}

export type FinanceDashboardData = {
  invoiceSummary: Awaited<ReturnType<typeof getInvoiceSummary>>
  overdueInvoices: OverdueInvoiceRow[]
  overdueCount: number
  overdueAmountNet: number
  paymentSnapshot: PaymentSnapshot
  pendingCompensationDrafts: number
  pendingCompensations: PendingCompensationRow[]
  payslipStats: PayslipStats
  recentInvoices: RecentInvoiceRow[]
  recentPayslips: RecentPayslipRow[]
}

export async function getFinanceDashboardData(viewerId: string): Promise<FinanceDashboardData> {
  const supabase = await createServerClient()

  const [
    invoiceSummary,
    overdueRes,
    paymentSnapshot,
    pendingCompensationDrafts,
    pendingCompRes,
    draftPs,
    sentPs,
    paidPs,
    recentInv,
    recentPs,
  ] = await Promise.all([
    getInvoiceSummary(),
    supabase
      .from('client_invoices')
      .select('id, invoice_code, net_amount, currency, due_date, clients(client_name)')
      .eq('status', 'overdue')
      .order('due_date', { ascending: true })
      .limit(12),
    getPaymentSnapshot(viewerId),
    countDraftCompensationRecords(),
    supabase
      .from('compensation_records')
      .select('id, subtotal_amount, currency_code, created_at, member:profiles!member_id(full_name)')
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('payslips').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('payslips').select('*', { count: 'exact', head: true }).eq('status', 'sent'),
    supabase.from('payslips').select('*', { count: 'exact', head: true }).eq('status', 'paid'),
    supabase
      .from('client_invoices')
      .select('id, invoice_code, status, net_amount, currency, updated_at')
      .order('updated_at', { ascending: false })
      .limit(8),
    supabase
      .from('payslips')
      .select('id, payslip_code, status, net_amount, currency, updated_at')
      .order('updated_at', { ascending: false })
      .limit(8),
  ])

  const overdueRows = (overdueRes.data ?? []) as unknown as OverdueInvoiceRow[]
  let overdueAmountNet = 0
  for (const r of overdueRows) {
    overdueAmountNet += Number(r.net_amount ?? 0)
  }

  return {
    invoiceSummary,
    overdueInvoices: overdueRows,
    overdueCount: overdueRows.length,
    overdueAmountNet,
    paymentSnapshot,
    pendingCompensationDrafts,
    pendingCompensations: (pendingCompRes.data ?? []) as unknown as PendingCompensationRow[],
    payslipStats: {
      draftCount: draftPs.count ?? 0,
      sentCount: sentPs.count ?? 0,
      paidCount: paidPs.count ?? 0,
    },
    recentInvoices: (recentInv.data ?? []) as unknown as RecentInvoiceRow[],
    recentPayslips: (recentPs.data ?? []) as unknown as RecentPayslipRow[],
  }
}
