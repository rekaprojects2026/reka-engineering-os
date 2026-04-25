import { unstable_cache } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { aggregateApprovedExpensesUsd } from '@/lib/expenses/queries'
import { createServerClient } from '@/lib/supabase/server'
import { getUsdToIdrWithClient } from '@/lib/fx/queries'
import type { InvoiceStatus } from '@/types/database'

export type CashFlowForecast = {
  projectedInflow: number
  overdueAmount: number
  currency: 'USD'
  invoiceCount: { sent: number; partial: number; overdue: number }
}

const INVOICE_STATUSES: InvoiceStatus[] = [
  'draft',
  'sent',
  'partial',
  'paid',
  'overdue',
  'void',
]

export type InvoiceStatusCounts = Record<InvoiceStatus, number>

async function _getCashFlowForecast(supabase: SupabaseClient): Promise<CashFlowForecast> {
  const usdToIdr = await getUsdToIdrWithClient(supabase)

  const { data } = await supabase
    .from('client_invoices')
    .select('net_amount, currency, fx_rate_snapshot, status')
    .in('status', ['sent', 'partial', 'overdue'])

  const rows = data ?? []

  function toUsd(amount: number, currency: string | null, snap: number | null): number {
    const cur = (currency ?? 'USD').toUpperCase()
    if (cur === 'USD') return amount
    const rate = snap && snap > 0 ? snap : usdToIdr
    return rate > 0 ? amount / rate : amount
  }

  let projectedInflow = 0
  let overdueAmount = 0
  let sentCount = 0
  let partialCount = 0
  let overdueCount = 0

  for (const row of rows) {
    const usd = toUsd(
      Number(row.net_amount ?? 0),
      row.currency as string,
      row.fx_rate_snapshot as number | null,
    )
    if (row.status === 'sent') {
      projectedInflow += usd
      sentCount++
    } else if (row.status === 'partial') {
      projectedInflow += usd
      partialCount++
    } else if (row.status === 'overdue') {
      overdueAmount += usd
      overdueCount++
    }
  }

  return {
    projectedInflow,
    overdueAmount,
    currency: 'USD',
    invoiceCount: { sent: sentCount, partial: partialCount, overdue: overdueCount },
  }
}

export async function getCashFlowForecast(): Promise<CashFlowForecast> {
  const supabase = await createServerClient()
  return unstable_cache(
    () => _getCashFlowForecast(supabase),
    ['finance-cashflow-forecast'],
    { revalidate: 300, tags: ['invoices', 'dashboard'] },
  )()
}

async function _getInvoiceStatusCounts(supabase: SupabaseClient): Promise<InvoiceStatusCounts> {
  const results = await Promise.all(
    INVOICE_STATUSES.map(async (status) => {
      const { count, error } = await supabase
        .from('client_invoices')
        .select('id', { count: 'exact', head: true })
        .eq('status', status)
      return { status, count: error ? 0 : (count ?? 0) }
    }),
  )
  const out: InvoiceStatusCounts = {
    draft: 0,
    sent: 0,
    partial: 0,
    paid: 0,
    overdue: 0,
    void: 0,
  }
  for (const { status, count } of results) {
    out[status] = count
  }
  return out
}

export async function getInvoiceStatusCounts(): Promise<InvoiceStatusCounts> {
  const supabase = await createServerClient()
  return unstable_cache(
    () => _getInvoiceStatusCounts(supabase),
    ['finance-invoice-status-counts'],
    { revalidate: 300, tags: ['invoices', 'dashboard'] },
  )()
}

export type ProjectMarginRow = {
  projectId: string
  projectCode: string
  projectName: string
  clientName: string | null
  status: string
  revenue: number
  expenses: number
  grossProfit: number
  marginPct: number
}

export type ProjectMarginSummary = {
  rows: ProjectMarginRow[]
  currency: 'USD'
}

type ProjectRowForMargin = {
  id: string
  project_code: string
  name: string
  status: string
  clients: { client_name: string } | { client_name: string }[] | null
}

async function _getProjectMargins(supabase: SupabaseClient, usdToIdr: number): Promise<ProjectMarginSummary> {
  function toUsd(amount: number, currency: string | null, snap: number | null): number {
    const cur = (currency ?? 'USD').toUpperCase()
    if (cur === 'USD') return amount
    const rate = snap && snap > 0 ? snap : usdToIdr
    return rate > 0 ? amount / rate : amount
  }

  const [projRes, invRes, compRes, approvedExpMap] = await Promise.all([
    supabase
      .from('projects')
      .select('id, project_code, name, status, clients(client_name)')
      .order('created_at', { ascending: false }),
    supabase
      .from('client_invoices')
      .select('project_id, net_amount, currency, fx_rate_snapshot, status')
      .eq('status', 'paid'),
    supabase
      .from('compensation_records')
      .select('project_id, subtotal_amount, currency_code, status')
      .eq('status', 'paid'),
    aggregateApprovedExpensesUsd(supabase, usdToIdr),
  ])

  const projects = (projRes.data ?? []) as ProjectRowForMargin[]

  const revenueMap = new Map<string, number>()
  for (const inv of invRes.data ?? []) {
    if (!inv.project_id) continue
    const usd = toUsd(
      Number(inv.net_amount ?? 0),
      inv.currency as string,
      inv.fx_rate_snapshot as number | null,
    )
    revenueMap.set(inv.project_id, (revenueMap.get(inv.project_id) ?? 0) + usd)
  }

  const expenseMap = new Map<string, number>()
  for (const comp of compRes.data ?? []) {
    if (!comp.project_id) continue
    const usd = toUsd(Number(comp.subtotal_amount ?? 0), comp.currency_code as string, null)
    expenseMap.set(comp.project_id, (expenseMap.get(comp.project_id) ?? 0) + usd)
  }

  for (const [projectId, usdExp] of approvedExpMap.entries()) {
    expenseMap.set(projectId, (expenseMap.get(projectId) ?? 0) + usdExp)
  }

  function getClientName(c: { client_name: string } | { client_name: string }[] | null): string | null {
    if (!c) return null
    const obj = Array.isArray(c) ? c[0] : c
    return obj?.client_name ?? null
  }

  const rows: ProjectMarginRow[] = projects.map((p) => {
    const revenue = revenueMap.get(p.id) ?? 0
    const expenses = expenseMap.get(p.id) ?? 0
    const grossProfit = revenue - expenses
    const marginPct = revenue > 0 ? (grossProfit / revenue) * 100 : 0
    return {
      projectId: p.id,
      projectCode: p.project_code,
      projectName: p.name,
      clientName: getClientName(p.clients),
      status: p.status,
      revenue,
      expenses,
      grossProfit,
      marginPct,
    }
  })

  rows.sort((a, b) => b.revenue - a.revenue)

  return { rows, currency: 'USD' }
}

export async function getProjectMargins(): Promise<ProjectMarginSummary> {
  const supabase = await createServerClient()
  const usdToIdr = await getUsdToIdrWithClient(supabase)
  return unstable_cache(
    () => _getProjectMargins(supabase, usdToIdr),
    ['finance-project-margins', String(usdToIdr)],
    { revalidate: 300, tags: ['invoices', 'dashboard', 'projects', 'expenses'] },
  )()
}
