import type { SupabaseClient } from '@supabase/supabase-js'
import { unstable_cache } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { getUsdToIdrWithClient } from '@/lib/fx/queries'

export type PnlPeriod = 'this_month' | 'this_quarter' | 'this_year'

export type PnlSummary = {
  revenue: number
  revenueCurrency: 'USD'
  platformFees: number
  expenses: number
  grossProfit: number
  profitMarginPct: number
  periodLabel: string
}

function periodStartUtc(period: PnlPeriod, ref: Date): Date {
  const y = ref.getUTCFullYear()
  const m = ref.getUTCMonth()
  if (period === 'this_year') return new Date(Date.UTC(y, 0, 1, 0, 0, 0, 0))
  if (period === 'this_month') return new Date(Date.UTC(y, m, 1, 0, 0, 0, 0))
  const q0 = Math.floor(m / 3) * 3
  return new Date(Date.UTC(y, q0, 1, 0, 0, 0, 0))
}

function buildPeriodLabel(period: PnlPeriod, ref: Date): string {
  const y = ref.getUTCFullYear()
  const m = ref.getUTCMonth()
  if (period === 'this_year') return String(y)
  if (period === 'this_month') {
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(Date.UTC(y, m, 1)))
  }
  const q = Math.floor(m / 3) + 1
  return `Q${q} ${y}`
}

/** Convert stored amount to USD using invoice FX snapshot (USD→IDR) or latest rate for IDR. */
function toUsd(
  amount: number,
  currency: string | null | undefined,
  fxSnapshot: number | null | undefined,
  usdToIdr: number
): number {
  const cur = (currency ?? 'USD').toUpperCase()
  if (cur === 'USD') return amount
  const rate = fxSnapshot && fxSnapshot > 0 ? fxSnapshot : usdToIdr
  if (rate <= 0) return amount
  return amount / rate
}

export function parsePnlPeriodParam(raw: string | undefined): PnlPeriod {
  if (raw === 'this_quarter' || raw === 'this_year' || raw === 'this_month') return raw
  return 'this_month'
}

/**
 * Profit & loss snapshot for the owner dashboard.
 * Revenue & fees from paid client invoices; expenses = paid compensation + paid member payment records.
 * Amounts are normalised to USD using per-row `fx_rate_snapshot` when present, else `usdToIdr`.
 */
async function _getPnlSummary(
  supabase: SupabaseClient,
  period: PnlPeriod,
  usdToIdr: number,
): Promise<PnlSummary> {
  const p = period
  const ref = new Date()
  const start = periodStartUtc(p, ref)
  const startIso = start.toISOString()
  const fx = usdToIdr

  const [invRes, compRes, payRes] = await Promise.all([
    supabase
      .from('client_invoices')
      .select('net_amount, currency, platform_fee_amount, fx_rate_snapshot, status, created_at')
      .gte('created_at', startIso),
    supabase
      .from('compensation_records')
      .select('subtotal_amount, currency_code, status, created_at')
      .gte('created_at', startIso),
    supabase
      .from('payment_records')
      .select('total_paid, currency_code, payment_status, created_at')
      .gte('created_at', startIso),
  ])

  const invoices = invRes.data ?? []
  const paidInvoices = invoices.filter(i => i.status === 'paid')

  let revenue = 0
  let platformFees = 0
  for (const inv of paidInvoices) {
    const snap = inv.fx_rate_snapshot as number | null | undefined
    revenue += toUsd(Number(inv.net_amount ?? 0), inv.currency as string, snap, fx)
    platformFees += toUsd(Number(inv.platform_fee_amount ?? 0), inv.currency as string, snap, fx)
  }

  const comps = (compRes.data ?? []).filter(c => c.status === 'paid')
  let expenses = 0
  for (const c of comps) {
    expenses += toUsd(Number(c.subtotal_amount ?? 0), c.currency_code as string, null, fx)
  }

  const pays = (payRes.data ?? []).filter(x => x.payment_status === 'paid')
  for (const pr of pays) {
    expenses += toUsd(Number(pr.total_paid ?? 0), pr.currency_code as string, null, fx)
  }

  const grossProfit = revenue - expenses
  const profitMarginPct = revenue > 0 ? (grossProfit / revenue) * 100 : 0

  return {
    revenue,
    revenueCurrency: 'USD',
    platformFees,
    expenses,
    grossProfit,
    profitMarginPct,
    periodLabel: buildPeriodLabel(p, ref),
  }
}

export async function getPnlSummary(
  viewerId: string,
  period: PnlPeriod = 'this_month',
  usdToIdr?: number,
): Promise<PnlSummary> {
  const supabase = await createServerClient()
  const fxResolved = usdToIdr ?? (await getUsdToIdrWithClient(supabase))
  return unstable_cache(
    async () => _getPnlSummary(supabase, period, fxResolved),
    ['pnl-summary', viewerId, period, String(fxResolved)],
    { revalidate: 300, tags: ['dashboard', 'dashboard:kpis', 'invoices'] },
  )()
}
