import type { CSSProperties } from 'react'
import Link from 'next/link'
import { getSessionProfile, requireRole } from '@/lib/auth/session'
import { getPnlSummary, parsePnlPeriodParam } from '@/lib/dashboard/pnl-queries'
import { getCashFlowForecast, getInvoiceStatusCounts, getProjectMargins } from '@/lib/finance/reports-queries'
import { getUsdToIdrRate } from '@/lib/fx/queries'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import type { InvoiceStatus } from '@/types/database'

export const metadata = { title: 'Finance Reports — ReKa Engineering OS' }

interface PageProps {
  searchParams: Promise<{ period?: string }>
}

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  partial: 'Partial',
  paid: 'Paid',
  overdue: 'Overdue',
  void: 'Void',
}

function usd(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function idr(n: number, rate: number) {
  return (n * rate).toLocaleString('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

export default async function FinanceReportsPage({ searchParams }: PageProps) {
  const profile = await getSessionProfile()
  requireRole(profile.system_role, ['direktur', 'finance'])

  const params = await searchParams
  const period = parsePnlPeriodParam(params.period)

  const [pnl, cashflow, fxRate, statusCounts, projectMargins] = await Promise.all([
    getPnlSummary(profile.id, period),
    getCashFlowForecast(),
    getUsdToIdrRate(),
    getInvoiceStatusCounts(),
    getProjectMargins(),
  ])

  const periods: { value: string; label: string }[] = [
    { value: 'this_month', label: 'This Month' },
    { value: 'this_quarter', label: 'This Quarter' },
    { value: 'this_year', label: 'This Year' },
  ]

  const marginColor =
    pnl.profitMarginPct >= 30
      ? 'var(--color-success)'
      : pnl.profitMarginPct >= 10
        ? 'var(--color-warning)'
        : 'var(--color-danger)'

  const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '12px',
  }

  const cashGridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
  }

  const cardShellStyle: CSSProperties = {
    padding: '16px',
    background: 'var(--color-surface-subtle)',
    borderRadius: 'var(--radius-card)',
    border: '1px solid var(--color-border)',
  }

  return (
    <div>
      <PageHeader
        title="Finance Reports"
        subtitle="P&L ringkasan, cash flow, dan proyeksi pendapatan."
        actions={
          <form method="GET" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
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

      <SectionCard title={`P&L — ${pnl.periodLabel}`}>
        <div style={gridStyle}>
          {(
            [
              {
                label: 'Revenue',
                amount: pnl.revenue,
                note: 'Paid invoices',
                color: 'var(--color-success)',
              },
              {
                label: 'Platform Fees',
                amount: pnl.platformFees,
                note: 'Deducted from gross',
                color: 'var(--color-warning)',
              },
              {
                label: 'Expenses',
                amount: pnl.expenses,
                note: 'Compensation + payments',
                color: 'var(--color-danger)',
              },
              {
                label: 'Gross Profit',
                amount: pnl.grossProfit,
                note: 'Revenue − Expenses',
                color: pnl.grossProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
              },
              {
                label: 'Margin',
                amount: null as number | null,
                note: 'Gross profit %',
                color: marginColor,
              },
            ] as const
          ).map((card) => (
            <div key={card.label} style={cardShellStyle}>
              <p
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '6px',
                }}
              >
                {card.label}
              </p>
              {card.amount !== null ? (
                <>
                  <p
                    style={{
                      fontSize: '1.125rem',
                      fontWeight: 700,
                      color: card.color,
                      margin: '0 0 2px',
                      fontFamily: 'monospace',
                    }}
                  >
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
              <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                {card.note}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="mt-4">
        <SectionCard title="Cash Flow Forecast">
          <div style={cashGridStyle}>
            <div style={cardShellStyle}>
              <p
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '6px',
                }}
              >
                Projected Inflow
              </p>
              <p
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  color: 'var(--color-success)',
                  margin: '0 0 2px',
                  fontFamily: 'monospace',
                }}
              >
                USD {usd(cashflow.projectedInflow)}
              </p>
              <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                ~{idr(cashflow.projectedInflow, fxRate)}
              </p>
              <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                {cashflow.invoiceCount.sent} sent · {cashflow.invoiceCount.partial} partial
              </p>
            </div>

            <div style={cardShellStyle}>
              <p
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '6px',
                }}
              >
                Overdue
              </p>
              <p
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  color: cashflow.overdueAmount > 0 ? 'var(--color-danger)' : 'var(--color-text-muted)',
                  margin: '0 0 2px',
                  fontFamily: 'monospace',
                }}
              >
                USD {usd(cashflow.overdueAmount)}
              </p>
              <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                ~{idr(cashflow.overdueAmount, fxRate)}
              </p>
              <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                {cashflow.invoiceCount.overdue} invoice overdue
              </p>
            </div>

            <div style={cardShellStyle}>
              <p
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '6px',
                }}
              >
                Total Pipeline
              </p>
              <p
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                  margin: '0 0 2px',
                  fontFamily: 'monospace',
                }}
              >
                USD {usd(cashflow.projectedInflow + cashflow.overdueAmount)}
              </p>
              <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                ~{idr(cashflow.projectedInflow + cashflow.overdueAmount, fxRate)}
              </p>
              <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                Termasuk invoice yang terlambat
              </p>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="mt-4">
        <SectionCard title="Margin per Project">
          {projectMargins.rows.length === 0 ? (
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', padding: '16px' }}>
              Belum ada data project dengan invoice atau kompensasi.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {['Project', 'Client', 'Status', 'Revenue', 'Expenses', 'Profit', 'Margin'].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '10px 12px',
                          textAlign:
                            h === 'Project' || h === 'Client' || h === 'Status' ? 'left' : 'right',
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          color: 'var(--color-text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {projectMargins.rows.map((row) => {
                    const marginColor =
                      row.revenue === 0
                        ? 'var(--color-text-muted)'
                        : row.marginPct >= 30
                          ? 'var(--color-success)'
                          : row.marginPct >= 10
                            ? 'var(--color-warning)'
                            : 'var(--color-danger)'

                    return (
                      <tr key={row.projectId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '10px 12px' }}>
                          <Link
                            href={`/projects/${row.projectId}`}
                            style={{
                              fontWeight: 500,
                              color: 'var(--color-primary)',
                              textDecoration: 'none',
                              fontFamily: 'monospace',
                              fontSize: '0.75rem',
                            }}
                          >
                            {row.projectCode}
                          </Link>
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--color-text-muted)',
                              marginTop: '2px',
                              maxWidth: '200px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {row.projectName}
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--color-text-secondary)' }}>
                          {row.clientName ?? '—'}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              padding: '2px 7px',
                              borderRadius: '999px',
                              backgroundColor: 'var(--color-surface-subtle)',
                              border: '1px solid var(--color-border)',
                              color: 'var(--color-text-muted)',
                              textTransform: 'capitalize',
                            }}
                          >
                            {row.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: '10px 12px',
                            textAlign: 'right',
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                            color: 'var(--color-success)',
                          }}
                        >
                          {row.revenue > 0 ? `$${usd(row.revenue)}` : '—'}
                        </td>
                        <td
                          style={{
                            padding: '10px 12px',
                            textAlign: 'right',
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                            color: 'var(--color-danger)',
                          }}
                        >
                          {row.expenses > 0 ? `$${usd(row.expenses)}` : '—'}
                        </td>
                        <td
                          style={{
                            padding: '10px 12px',
                            textAlign: 'right',
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                            color: row.grossProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
                          }}
                        >
                          {row.revenue > 0 ? `$${usd(row.grossProfit)}` : '—'}
                        </td>
                        <td
                          style={{
                            padding: '10px 12px',
                            textAlign: 'right',
                            fontWeight: 700,
                            color: marginColor,
                          }}
                        >
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
      </div>

      <div className="mt-4">
        <SectionCard title="Invoice status breakdown">
          <div style={gridStyle}>
            {(Object.keys(STATUS_LABELS) as InvoiceStatus[]).map((status) => (
              <div key={status} style={cardShellStyle}>
                <p
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '6px',
                  }}
                >
                  {STATUS_LABELS[status]}
                </p>
                <p
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: 'var(--color-text-primary)',
                    margin: 0,
                    fontFamily: 'monospace',
                  }}
                >
                  {statusCounts[status]}
                </p>
                <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  invoice{statusCounts[status] === 1 ? '' : 's'}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  )
}
