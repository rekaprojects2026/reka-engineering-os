# Stage 7 — Finance: Halaman Dedicated /finance/reports

## Rules

- **JANGAN** ubah `lib/dashboard/pnl-queries.ts` — gunakan fungsi yang sudah ada
- **JANGAN** ubah `lib/dashboard/direktur-queries.ts`
- **JANGAN** ubah halaman dashboard direktur
- **HANYA** buat file baru dan modifikasi `app/(protected)/finance/layout.tsx` untuk nav
- Semua kode harus **TypeScript strict** — tidak ada `any`
- Halaman ini **server component** — tidak ada `'use client'`
- Ikuti pola visual yang sama dengan `app/(protected)/finance/invoices/page.tsx`

---

## Context

### Stack
Next.js 15 App Router, TypeScript strict, Supabase, Tailwind minimal (pakai CSS variables inline).

### Yang sudah ada dan siap dipakai:
- `lib/dashboard/pnl-queries.ts` — `getPnlSummary(viewerId, period)` → returns `PnlSummary`
  - Fields: `revenue`, `platformFees`, `expenses`, `grossProfit`, `profitMarginPct`, `periodLabel`
  - Semua dalam USD
  - Period: `'this_month' | 'this_quarter' | 'this_year'`
- `lib/fx/queries.ts` — `getUsdToIdrRate()` → number
- `lib/invoices/queries.ts` — `getInvoices({ status })` → list invoice dengan relasi
- `lib/auth/session.ts` — `getSessionProfile()`, `requireRole()`

### Finance routes yang sudah ada:
```
app/(protected)/finance/
  layout.tsx          ← perlu tambah nav link "Reports"
  invoices/page.tsx
  payslips/page.tsx
  payment-accounts/page.tsx
  fx-rates/page.tsx
```

### CSS variables yang berlaku:
```
--color-surface, --color-border, --color-text-primary, --color-text-secondary,
--color-text-muted, --color-primary, --color-success, --color-warning, --color-danger
--radius-card, --radius-control
```

---

## Step 1 — Buat Query Cash Flow Summary

Buat file **baru**: `lib/finance/reports-queries.ts`

```typescript
import { unstable_cache } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { getUsdToIdrWithClient } from '@/lib/fx/queries'

export type CashFlowForecast = {
  projectedInflow: number       // sum net_amount dari invoice status sent + partial
  overdueAmount: number         // sum net_amount dari invoice status overdue
  currency: 'USD'
  invoiceCount: { sent: number; partial: number; overdue: number }
}

async function _getCashFlowForecast(): Promise<CashFlowForecast> {
  const supabase = await createServerClient()
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
    if (row.status === 'sent') { projectedInflow += usd; sentCount++ }
    else if (row.status === 'partial') { projectedInflow += usd; partialCount++ }
    else if (row.status === 'overdue') { overdueAmount += usd; overdueCount++ }
  }

  return {
    projectedInflow,
    overdueAmount,
    currency: 'USD',
    invoiceCount: { sent: sentCount, partial: partialCount, overdue: overdueCount },
  }
}

export function getCashFlowForecast(): Promise<CashFlowForecast> {
  return unstable_cache(
    _getCashFlowForecast,
    ['finance-cashflow-forecast'],
    { revalidate: 300, tags: ['invoices', 'dashboard'] },
  )()
}
```

---

## Step 2 — Buat Halaman Reports

Buat file **baru**: `app/(protected)/finance/reports/page.tsx`

Halaman ini menampilkan:
1. **Period selector** — this_month / this_quarter / this_year (GET param `?period=`)
2. **P&L Summary cards** — Revenue, Platform Fees, Expenses, Gross Profit, Margin %
3. **Cash Flow Forecast cards** — Projected Inflow, Overdue Amount
4. **Invoice status breakdown** — count per status

```typescript
import { getSessionProfile, requireRole } from '@/lib/auth/session'
import { getPnlSummary, parsePnlPeriodParam } from '@/lib/dashboard/pnl-queries'
import { getCashFlowForecast } from '@/lib/finance/reports-queries'
import { getUsdToIdrRate } from '@/lib/fx/queries'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'

export const metadata = { title: 'Finance Reports — ReKa Engineering OS' }

interface PageProps {
  searchParams: Promise<{ period?: string }>
}

function usd(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function idr(n: number, rate: number) {
  return (n * rate).toLocaleString('id-ID', {
    style: 'currency', currency: 'IDR',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  })
}

export default async function FinanceReportsPage({ searchParams }: PageProps) {
  const profile = await getSessionProfile()
  requireRole(profile.system_role, ['direktur', 'finance'])

  const params = await searchParams
  const period = parsePnlPeriodParam(params.period)

  const [pnl, cashflow, fxRate] = await Promise.all([
    getPnlSummary(profile.id, period),
    getCashFlowForecast(),
    getUsdToIdrRate(),
  ])

  const periods: { value: string; label: string }[] = [
    { value: 'this_month',   label: 'This Month' },
    { value: 'this_quarter', label: 'This Quarter' },
    { value: 'this_year',    label: 'This Year' },
  ]

  const marginColor =
    pnl.profitMarginPct >= 30 ? 'var(--color-success)' :
    pnl.profitMarginPct >= 10 ? 'var(--color-warning)' :
    'var(--color-danger)'

  return (
    <div>
      <PageHeader
        title="Finance Reports"
        subtitle="P&L ringkasan, cash flow, dan proyeksi pendapatan."
        actions={
          <form method="GET" style={{ display: 'flex', gap: '8px' }}>
            {periods.map((p) => (
              <button
                key={p.value}
                type="submit"
                name="period"
                value={p.value}
                style={{
                  padding: '7px 14px',
                  borderRadius: 'var(--radius-control)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.8125rem',
                  fontWeight: period === p.value ? 600 : 400,
                  backgroundColor: period === p.value ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: period === p.value ? 'var(--color-primary-fg)' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                }}
              >
                {p.label}
              </button>
            ))}
          </form>
        }
      />

      {/* P&L Cards */}
      <SectionCard title={`P&L — ${pnl.periodLabel}`}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
          {[
            { label: 'Revenue',       amount: pnl.revenue,       note: 'Paid invoices', color: 'var(--color-success)' },
            { label: 'Platform Fees', amount: pnl.platformFees,  note: 'Deducted from gross', color: 'var(--color-warning)' },
            { label: 'Expenses',      amount: pnl.expenses,      note: 'Compensation + payments', color: 'var(--color-danger)' },
            { label: 'Gross Profit',  amount: pnl.grossProfit,   note: 'Revenue − Expenses', color: pnl.grossProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)' },
            { label: 'Margin',        amount: null,              note: 'Gross profit %', color: marginColor },
          ].map((card) => (
            <div key={card.label} style={{ padding: '16px', background: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)' }}>
              <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>{card.label}</p>
              {card.amount !== null ? (
                <>
                  <p style={{ fontSize: '1.125rem', fontWeight: 700, color: card.color, margin: '0 0 2px', fontFamily: 'monospace' }}>
                    USD {usd(card.amount)}
                  </p>
                  <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                    ~{idr(card.amount, fxRate)}
                  </p>
                </>
              ) : (
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: card.color, margin: '0 0 2px' }}>
                  {pnl.profitMarginPct.toFixed(1)}%
                </p>
              )}
              <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>{card.note}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Cash Flow Forecast */}
      <SectionCard title="Cash Flow Forecast" style={{ marginTop: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <div style={{ padding: '16px', background: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)' }}>
            <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Projected Inflow</p>
            <p style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-success)', margin: '0 0 2px', fontFamily: 'monospace' }}>
              USD {usd(cashflow.projectedInflow)}
            </p>
            <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>~{idr(cashflow.projectedInflow, fxRate)}</p>
            <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              {cashflow.invoiceCount.sent} sent · {cashflow.invoiceCount.partial} partial
            </p>
          </div>

          <div style={{ padding: '16px', background: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)' }}>
            <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Overdue</p>
            <p style={{ fontSize: '1.125rem', fontWeight: 700, color: cashflow.overdueAmount > 0 ? 'var(--color-danger)' : 'var(--color-text-muted)', margin: '0 0 2px', fontFamily: 'monospace' }}>
              USD {usd(cashflow.overdueAmount)}
            </p>
            <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>~{idr(cashflow.overdueAmount, fxRate)}</p>
            <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              {cashflow.invoiceCount.overdue} invoice overdue
            </p>
          </div>

          <div style={{ padding: '16px', background: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)' }}>
            <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Total Pipeline</p>
            <p style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 2px', fontFamily: 'monospace' }}>
              USD {usd(cashflow.projectedInflow + cashflow.overdueAmount)}
            </p>
            <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>~{idr(cashflow.projectedInflow + cashflow.overdueAmount, fxRate)}</p>
            <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              Termasuk invoice yang terlambat
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
```

---

## Step 3 — Tambah Nav Link di Finance Layout

Baca file `app/(protected)/finance/layout.tsx`. Temukan daftar nav links dan tambahkan entry untuk Reports.

Cari pola yang mirip dengan entry untuk "Invoices" atau "Payslips". Tambahkan:
```
{ href: '/finance/reports', label: 'Reports' }
```

Posisikan **setelah** semua entry yang sudah ada, atau di urutan pertama jika lebih logis sebagai overview.

---

## Step 4 — Verifikasi TypeScript

```bash
npx tsc --noEmit
```

---

## Verifikasi Manual

1. Buka `/finance/reports`
2. Harus muncul P&L cards untuk "This Month" secara default
3. Klik "This Quarter" → angka harus berubah, URL menjadi `?period=this_quarter`
4. Klik "This Year" → angka berubah lagi
5. Cards Projected Inflow harus menampilkan jumlah invoice `sent` + `partial`
6. Overdue harus menampilkan invoice `overdue`
7. Nav link "Reports" di sidebar/topbar finance harus aktif saat di halaman ini

---

## Struktur File Setelah Stage 7

```
lib/
  finance/
    reports-queries.ts           ← BARU
app/(protected)/finance/
  layout.tsx                     ← DIMODIFIKASI (tambah nav link)
  reports/
    page.tsx                     ← BARU
```
