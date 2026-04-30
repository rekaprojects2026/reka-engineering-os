import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getSessionProfile } from '@/lib/auth/session'
import { getPayslipById } from '@/lib/payslips/queries'
import { getUsdToIdrRate } from '@/lib/fx/queries'
import { markPayslipPaid } from '@/lib/payslips/actions'
import { MoneyDisplay } from '@/components/shared/MoneyDisplay'
import { DownloadPayslipPdfButton } from '@/components/modules/payslips/DownloadPayslipPdfButton'
import { PayslipDetailActions } from '@/components/modules/payslips/PayslipDetailActions'
import { isDirektur, isFinance } from '@/lib/auth/permissions'

export const metadata = { title: 'Payslip — ReKa Engineering OS' }

function periodLabel(month: number, year: number) {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1))
}

function roleLine(functional: string | null | undefined, system: string | null | undefined) {
  if (functional?.trim()) return functional.trim()
  if (system) return system.charAt(0).toUpperCase() + system.slice(1)
  return '—'
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PayslipDetailPage({ params }: PageProps) {
  const { id } = await params
  const sp = await getSessionProfile()
  const row = await getPayslipById(id)
  if (!row) notFound()

  const canFinance = isDirektur(sp.system_role) || isFinance(sp.system_role)
  const isOwn = row.profile_id === sp.id
  if (!canFinance && !isOwn) redirect('/access-denied')

  const fxRate = await getUsdToIdrRate()

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
        }
      `}</style>

      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '28px' }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              ReKa Engineering
            </p>
            <h1 style={{ margin: '6px 0 0', fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
              SLIP GAJI
            </h1>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-primary)' }}>
              {row.payslip_code}
            </p>
            <p style={{ margin: '6px 0 0', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              {periodLabel(row.period_month, row.period_year)}
            </p>
            <div className="no-print" style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
              <DownloadPayslipPdfButton
                payslipId={row.id}
                periodYear={row.period_year}
                periodMonth={row.period_month}
                memberName={row.profile?.full_name ?? 'member'}
              />
            </div>
          </div>
        </header>

        <section style={{ marginBottom: '24px', padding: '16px 18px', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <p style={{ margin: '0 0 4px', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recipient</p>
          <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{row.profile?.full_name ?? '—'}</p>
          <p style={{ margin: '6px 0 0', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
            {roleLine(row.profile?.functional_role, row.profile?.system_role)}
          </p>
        </section>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ textAlign: 'left', padding: '10px 8px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Item</th>
              <th style={{ textAlign: 'right', padding: '10px 8px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td style={{ padding: '12px 8px', color: 'var(--color-text-primary)' }}>Gaji pokok</td>
              <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                <MoneyDisplay amount={row.base_amount} currency={row.currency} fxRateToIDR={fxRate} showConversion={row.currency === 'USD'} />
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td style={{ padding: '12px 8px', color: 'var(--color-text-primary)' }}>Bonus</td>
              <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                <MoneyDisplay amount={row.bonus_amount} currency={row.currency} fxRateToIDR={fxRate} showConversion={row.currency === 'USD'} />
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td style={{ padding: '12px 8px', color: 'var(--color-text-primary)' }}>Potongan</td>
              <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                <MoneyDisplay amount={row.deduction_amount} currency={row.currency} fxRateToIDR={fxRate} showConversion={row.currency === 'USD'} />
              </td>
            </tr>
            <tr>
              <td style={{ padding: '14px 8px', fontWeight: 800, fontSize: '1rem', color: 'var(--color-text-primary)' }}>Net</td>
              <td style={{ padding: '14px 8px', textAlign: 'right' }}>
                <MoneyDisplay amount={row.net_amount} currency={row.currency} fxRateToIDR={fxRate} showConversion={row.currency === 'USD'} size="lg" />
              </td>
            </tr>
          </tbody>
        </table>

        <section style={{ padding: '14px 18px', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-muted)' }}>
          <p style={{ margin: '0 0 6px', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
            <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>Dibayar ke: </span>
            {row.payment_accounts?.name ?? '—'}
          </p>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>Status: </span>
            <span
              style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: row.status === 'paid' ? 'var(--color-success-subtle)' : row.status === 'sent' ? 'var(--color-primary-subtle)' : 'var(--color-surface-muted)',
                color: row.status === 'paid' ? 'var(--color-success)' : row.status === 'sent' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              }}
            >
              {row.status === 'paid' ? 'Paid' : row.status === 'sent' ? 'Sent' : 'Draft'}
            </span>
          </p>
        </section>

        {canFinance ? (
          <PayslipDetailActions payslipId={row.id} status={row.status} markPayslipPaid={markPayslipPaid} />
        ) : (
          <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '20px' }}>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') window.print()
              }}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-control)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Print
            </button>
            <Link
              href="/dashboard"
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-control)',
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: 'var(--color-primary)',
                textDecoration: 'none',
              }}
            >
              ← Back to dashboard
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
