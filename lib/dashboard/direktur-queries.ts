/**
 * Direktur dashboard — org finance + operations + governance queues.
 */

import { unstable_cache } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { getUsdToIdrRate } from '@/lib/fx/queries'
import { getInvoiceSummary } from '@/lib/invoices/queries'
import { countDraftCompensationRecords } from '@/lib/compensation/queries'
import {
  getDashboardKpis,
  getDeadlineBuckets,
  getNeedsAttention,
  getOpenTaskStatusCounts,
  getPaymentSnapshot,
  getTeamWorkload,
  getWaitingOnClientProjects,
  getUrgentProjects,
  type DashboardKpis,
  type DeadlineBuckets,
  type NeedsAttentionData,
  type OpenTaskStatusCounts,
  type PaymentSnapshot,
  type UrgentProject,
  type WaitingClientProjectRow,
  type WorkloadUser,
} from '@/lib/dashboard/queries'
import { getRecentActivity } from '@/lib/activity/queries'
import { getPnlSummary, parsePnlPeriodParam, type PnlPeriod, type PnlSummary } from '@/lib/dashboard/pnl-queries'
import { getAccountReceiveSummary, type AccountSummary } from '@/lib/payment-accounts/queries'
import type { ActivityLogEntry } from '@/lib/activity/queries'

export type PendingApprovalProjectRow = {
  id: string
  name: string
  project_code: string
  discipline: string
  client_name: string | null
  project_lead_name: string | null
  approval_requested_at: string | null
}

export type OverdueInvoiceBrief = {
  id: string
  invoice_code: string
  net_amount: number
  currency: string
  due_date: string | null
  clients: { client_name: string } | null
}

export type DirekturDashboardData = {
  pnlPeriod: PnlPeriod
  kpis: DashboardKpis
  attention: NeedsAttentionData
  waitingClient: WaitingClientProjectRow[]
  pipeline: OpenTaskStatusCounts
  buckets: DeadlineBuckets
  paymentSnapshot: PaymentSnapshot
  workload: WorkloadUser[]
  activity: ActivityLogEntry[]
  invoiceSummary: Awaited<ReturnType<typeof getInvoiceSummary>>
  pnl: PnlSummary
  accountReceive: AccountSummary[]
  fxRate: number
  pendingApprovalProjects: PendingApprovalProjectRow[]
  overdueInvoices: OverdueInvoiceBrief[]
  compensationDraftCount: number
  revenueMtdIdr: number
  revenueYtdIdr: number
  projectsCompletedThisMonth: number
  teamUtilizationPct: number
  projectOverview: UrgentProject[]
}

async function _getPendingApprovalProjectsImpl(): Promise<PendingApprovalProjectRow[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('projects')
    .select(
      `
        id,
        name,
        project_code,
        discipline,
        disciplines,
        approval_requested_at,
        clients ( client_name ),
        lead:profiles!project_lead_user_id ( full_name )
      `,
    )
    .eq('status', 'pending_approval')
    .order('approval_requested_at', { ascending: true, nullsFirst: false })
    .range(0, 9)

  if (error) throw new Error(error.message)

  type NameRow = { client_name?: string } | null
  type LeadRow = { full_name?: string } | null

  function oneClientName(c: NameRow | NameRow[] | null | undefined): string | null {
    if (c == null) return null
    const o = Array.isArray(c) ? c[0] : c
    return o?.client_name ?? null
  }

  function oneLeadName(l: LeadRow | LeadRow[] | null | undefined): string | null {
    if (l == null) return null
    const o = Array.isArray(l) ? l[0] : l
    return o?.full_name ?? null
  }

  const raw = (data ?? []) as {
    id: string
    name: string
    project_code: string
    discipline: string
    disciplines: string[] | null
    approval_requested_at: string | null
    clients: NameRow | NameRow[] | null
    lead: LeadRow | LeadRow[] | null
  }[]

  function disciplineLine(r: (typeof raw)[number]): string {
    const parts =
      Array.isArray(r.disciplines) && r.disciplines.length > 0
        ? r.disciplines
        : r.discipline
          ? [r.discipline]
          : []
    return parts.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(' · ')
  }

  return raw.map((r) => ({
    id: r.id,
    name: r.name,
    project_code: r.project_code,
    discipline: disciplineLine(r),
    client_name: oneClientName(r.clients),
    project_lead_name: oneLeadName(r.lead),
    approval_requested_at: r.approval_requested_at,
  }))
}

/** Proyek menunggu persetujuan Direktur (ringkas, di-cache 60s). */
export function getPendingApprovalProjects(): Promise<PendingApprovalProjectRow[]> {
  return unstable_cache(
    _getPendingApprovalProjectsImpl,
    ['direktur-pending-approval-projects'],
    { revalidate: 60, tags: ['dashboard', 'projects'] },
  )()
}

function monthStartIso(utcMonthOffset = 0): string {
  const d = new Date()
  const y = d.getUTCFullYear()
  const m = d.getUTCMonth() + utcMonthOffset
  const adj = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0))
  return adj.toISOString()
}

function yearStartIso(): string {
  const d = new Date()
  return new Date(Date.UTC(d.getUTCFullYear(), 0, 1, 0, 0, 0, 0)).toISOString()
}

function toIdr(net: number, currency: string | null | undefined, fxSnap: number | null | undefined, usdToIdr: number): number {
  const cur = (currency ?? 'IDR').toUpperCase()
  if (cur === 'IDR') return Math.round(net)
  const rate = fxSnap && fxSnap > 0 ? fxSnap : usdToIdr
  if (rate <= 0) return Math.round(net)
  return Math.round(net * rate)
}

async function sumPaidRevenueIdrSince(iso: string, usdToIdr: number): Promise<number> {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('client_invoices')
    .select('net_amount, currency, fx_rate_snapshot, updated_at')
    .eq('status', 'paid')
    .gte('updated_at', iso)

  let sum = 0
  for (const row of data ?? []) {
    sum += toIdr(Number(row.net_amount ?? 0), row.currency as string, row.fx_rate_snapshot as number | null, usdToIdr)
  }
  return sum
}

export async function getDirekturDashboardData(viewerId: string, pnlPeriodParam?: string): Promise<DirekturDashboardData> {
  const pnlPeriod = parsePnlPeriodParam(pnlPeriodParam)

  const [
    kpis,
    attention,
    pipeline,
    buckets,
    paymentSnapshot,
    waitingClient,
    activity,
    workload,
    invoiceSummary,
    pnl,
    accountReceive,
    fxRate,
    pendingApprovalProjects,
    overdueRes,
    compDrafts,
    revenueMtdIdr,
    revenueYtdIdr,
    completedRes,
    utilRes,
    projectOverview,
  ] = await Promise.all([
    getDashboardKpis(viewerId),
    getNeedsAttention(viewerId),
    getOpenTaskStatusCounts(viewerId),
    getDeadlineBuckets(viewerId),
    getPaymentSnapshot(viewerId),
    getWaitingOnClientProjects(viewerId),
    getRecentActivity(18),
    getTeamWorkload(viewerId),
    getInvoiceSummary().catch(() => ({ totalGross: 0, totalNet: 0, outstanding: 0, paid: 0, byStatus: {} })),
    getPnlSummary(viewerId, pnlPeriod).catch(() => ({
      revenue: 0,
      revenueCurrency: 'USD' as const,
      platformFees: 0,
      expenses: 0,
      grossProfit: 0,
      profitMarginPct: 0,
      periodLabel: '',
    })),
    getAccountReceiveSummary().catch(() => [] as AccountSummary[]),
    getUsdToIdrRate().catch(() => 16400),
    getPendingApprovalProjects().catch(() => []),
    (async () => {
      const supabase = await createServerClient()
      const { data } = await supabase
        .from('client_invoices')
        .select('id, invoice_code, net_amount, currency, due_date, clients(client_name)')
        .eq('status', 'overdue')
        .order('due_date', { ascending: true })
        .limit(8)
      return (data ?? []) as unknown as OverdueInvoiceBrief[]
    })(),
    countDraftCompensationRecords(),
    (async () => {
      const fx = await getUsdToIdrRate().catch(() => 16400)
      return sumPaidRevenueIdrSince(monthStartIso(0), fx)
    })(),
    (async () => {
      const fx = await getUsdToIdrRate().catch(() => 16400)
      return sumPaidRevenueIdrSince(yearStartIso(), fx)
    })(),
    (async () => {
      const supabase = await createServerClient()
      const { count } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('updated_at', monthStartIso(0))
      return count ?? 0
    })(),
    (async () => {
      const supabase = await createServerClient()
      const [{ count: activeProfiles }, { data: assignees }] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('active_status', 'active'),
        supabase.from('tasks').select('assigned_to_user_id').neq('status', 'done'),
      ])
      const total = activeProfiles ?? 0
      if (total === 0) return 0
      const busy = new Set((assignees ?? []).map((r) => r.assigned_to_user_id).filter(Boolean))
      return Math.round((busy.size / total) * 1000) / 10
    })(),
    getUrgentProjects(viewerId),
  ])

  return {
    pnlPeriod,
    kpis,
    attention,
    waitingClient,
    pipeline,
    buckets,
    paymentSnapshot,
    workload,
    activity,
    invoiceSummary,
    pnl,
    accountReceive,
    fxRate,
    pendingApprovalProjects,
    overdueInvoices: overdueRes,
    compensationDraftCount: compDrafts,
    revenueMtdIdr,
    revenueYtdIdr,
    projectsCompletedThisMonth: completedRes,
    teamUtilizationPct: utilRes,
    projectOverview,
  }
}
