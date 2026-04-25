# Stage 8 — Finance: Per-Project Margin

## Prerequisite

Stage 7 harus selesai (atau boleh dikerjakan paralel — tidak ada dependency langsung).

---

## Rules

- **JANGAN** ubah `lib/dashboard/pnl-queries.ts` — buat query baru yang terpisah
- **JANGAN** ubah tabel/migration apapun
- **JANGAN** ubah halaman direktur dashboard
- Tambahkan ke halaman `/finance/reports` yang dibuat di Stage 7
- Semua kode **TypeScript strict** — tidak ada `any`
- Query harus di-cache dengan `unstable_cache` (revalidate: 300)
- Ikuti pola multi-currency yang sama dengan `pnl-queries.ts`

---

## Context

### Schema yang relevan

**`client_invoices`** (revenue per project):
```sql
project_id uuid FK → projects
net_amount numeric
currency text           -- 'USD' | 'IDR'
fx_rate_snapshot numeric -- USD→IDR rate saat invoice dibuat
status text             -- 'paid' = masuk revenue
```

**`compensation_records`** (expense per project):
```sql
project_id uuid FK → projects
subtotal_amount numeric
currency_code text
status text             -- 'paid' = masuk expense
```

**`projects`**:
```sql
id uuid
project_code text
name text
status text
client_id uuid FK → clients
```

**`clients`**:
```sql
id uuid
client_name text
```

### Logika margin per project (sama dengan pnl-queries.ts):
- Revenue = sum `net_amount` dari `client_invoices` WHERE `status = 'paid'` GROUP BY `project_id`
- Expenses = sum `subtotal_amount` dari `compensation_records` WHERE `status = 'paid'` GROUP BY `project_id`
- Gross profit = revenue − expenses
- Margin % = (gross profit / revenue) × 100 (jika revenue = 0, margin = 0)
- Konversi ke USD: pakai `fx_rate_snapshot` kalau ada, fallback ke live rate

---

## Step 1 — Tambah Query Per-Project Margin

Tambahkan ke file `lib/finance/reports-queries.ts` (dibuat di Stage 7):

```typescript
import { getUsdToIdrWithClient } from '@/lib/fx/queries'
// (pastikan import ini sudah ada dari Step sebelumnya)

export type ProjectMarginRow = {
  projectId: string
  projectCode: string
  projectName: string
  clientName: string | null
  status: string
  revenue: number        // USD
  expenses: number       // USD
  grossProfit: number    // USD
  marginPct: number
}

export type ProjectMarginSummary = {
  rows: ProjectMarginRow[]
  currency: 'USD'
}

async function _getProjectMargins(): Promise<ProjectMarginSummary> {
  const supabase = await createServerClient()
  const usdToIdr = await getUsdToIdrWithClient(supabase)

  function toUsd(amount: number, currency: string | null, snap: number | null): number {
    const cur = (currency ?? 'USD').toUpperCase()
    if (cur === 'USD') return amount
    const rate = snap && snap > 0 ? snap : usdToIdr
    return rate > 0 ? amount / rate : amount
  }

  const [projRes, invRes, compRes] = await Promise.all([
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
  ])

  const projects = (projRes.data ?? []) as {
    id: string
    project_code: string
    name: string
    status: string
    clients: { client_name: string } | { client_name: string }[] | null
  }[]

  // Build revenue map
  const revenueMap = new Map<string, number>()
  for (const inv of invRes.data ?? []) {
    if (!inv.project_id) continue
    const usd = toUsd(Number(inv.net_amount ?? 0), inv.currency as string, inv.fx_rate_snapshot as number | null)
    revenueMap.set(inv.project_id, (revenueMap.get(inv.project_id) ?? 0) + usd)
  }

  // Build expense map
  const expenseMap = new Map<string, number>()
  for (const comp of compRes.data ?? []) {
    if (!comp.project_id) continue
    const usd = toUsd(Number(comp.subtotal_amount ?? 0), comp.currency_code as string, null)
    expenseMap.set(comp.project_id, (expenseMap.get(comp.project_id) ?? 0) + usd)
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

  // Sort: projects dengan revenue terbesar duluan
  rows.sort((a, b) => b.revenue - a.revenue)

  return { rows, currency: 'USD' }
}

export function getProjectMargins(): Promise<ProjectMarginSummary> {
  return unstable_cache(
    _getProjectMargins,
    ['finance-project-margins'],
    { revalidate: 300, tags: ['invoices', 'dashboard', 'projects'] },
  )()
}
```

---

## Step 2 — Tambahkan Tabel ke Halaman /finance/reports

Buka `app/(protected)/finance/reports/page.tsx` (dibuat di Stage 7).

**Tambah import:**
```typescript
import { getProjectMargins } from '@/lib/finance/reports-queries'
import Link from 'next/link'
```

**Tambah ke Promise.all:**
```typescript
const [pnl, cashflow, fxRate, projectMargins] = await Promise.all([
  getPnlSummary(profile.id, period),
  getCashFlowForecast(),
  getUsdToIdrRate(),
  getProjectMargins(),
])
```

**Tambah section baru setelah Cash Flow card** (sebelum closing `</div>`):

```tsx
{/* Per-Project Margin */}
<SectionCard title="Margin per Project" style={{ marginTop: '16px' }}>
  {projectMargins.rows.length === 0 ? (
    <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', padding: '16px' }}>
      Belum ada data project dengan invoice atau kompensasi.
    </p>
  ) : (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            {['Project', 'Client', 'Status', 'Revenue', 'Expenses', 'Profit', 'Margin'].map(h => (
              <th key={h} style={{ padding: '10px 12px', textAlign: h === 'Project' || h === 'Client' || h === 'Status' ? 'left' : 'right', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {projectMargins.rows.map((row) => {
            const marginColor =
              row.revenue === 0 ? 'var(--color-text-muted)' :
              row.marginPct >= 30 ? 'var(--color-success)' :
              row.marginPct >= 10 ? 'var(--color-warning)' :
              'var(--color-danger)'

            return (
              <tr key={row.projectId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '10px 12px' }}>
                  <Link href={`/projects/${row.projectId}`} style={{ fontWeight: 500, color: 'var(--color-primary)', textDecoration: 'none', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {row.projectCode}
                  </Link>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.projectName}
                  </div>
                </td>
                <td style={{ padding: '10px 12px', color: 'var(--color-text-secondary)' }}>
                  {row.clientName ?? '—'}
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ fontSize: '0.6875rem', padding: '2px 7px', borderRadius: '999px', backgroundColor: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                    {row.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-success)' }}>
                  {row.revenue > 0 ? `$${usd(row.revenue)}` : '—'}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-danger)' }}>
                  {row.expenses > 0 ? `$${usd(row.expenses)}` : '—'}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', fontSize: '0.75rem', color: row.grossProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                  {row.revenue > 0 ? `$${usd(row.grossProfit)}` : '—'}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: marginColor }}>
                  {row.revenue > 0 ? `${row.marginPct.toFixed(1)}%` : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )}
</SectionCard>
```

---

## Step 3 — Verifikasi TypeScript

```bash
npx tsc --noEmit
```

---

## Verifikasi Manual

1. Buka `/finance/reports`
2. Scroll ke bawah → tabel "Margin per Project" harus muncul
3. Project dengan paid invoice harus menampilkan Revenue > 0
4. Project dengan paid compensation harus menampilkan Expenses > 0
5. Margin % harus hijau (≥30%), kuning (10-30%), merah (<10%)
6. Project tanpa invoice dan kompensasi sama sekali tetap muncul tapi kolom Revenue, Expenses, Profit, Margin menampilkan "—"
7. Klik project code → harus navigasi ke `/projects/[id]`

---

## Catatan Penting

**Team utilization tidak dibuat di stage ini** karena blocked by Time Tracking (Stage 12). `teamUtilizationPct` yang ada sekarang di `direktur-queries.ts` hanya proxy kasar (berapa member yang punya open task), bukan jam kerja aktual.
