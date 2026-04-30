import { Wallet } from 'lucide-react'

import { getSessionProfile } from '@/lib/auth/session'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { DataTable } from '@/components/shared/DataTable'
import type { Column } from '@/components/shared/DataTable'
import { PaymentStatusBadge } from '@/components/modules/payments/PaymentStatusBadge'
import { getPaymentsByMember, type PaymentRow } from '@/lib/payments/queries'
import { getSettingOptions } from '@/lib/settings/queries'
import { formatDate, formatIDR } from '@/lib/utils/formatters'

export const metadata = { title: 'My Payments — ReKa Engineering OS' }

function myPaymentColumns(METHOD_LABEL: Record<string, string>): Column<PaymentRow>[] {
  return [
    {
      key: 'period',
      header: 'Period',
      render: (r) => (
        <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
          {r.period_label ?? '—'}
        </span>
      ),
    },
    {
      key: 'due',
      header: 'Due',
      align: 'right',
      render: (r) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatIDR(r.total_due)}</span>,
    },
    {
      key: 'paid',
      header: 'Paid',
      align: 'right',
      render: (r) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatIDR(r.total_paid)}</span>,
    },
    {
      key: 'balance',
      header: 'Balance',
      align: 'right',
      render: (r) => (
        <span style={{
          fontVariantNumeric: 'tabular-nums',
          fontWeight: Number(r.balance) > 0 ? 600 : 400,
          color: Number(r.balance) > 0 ? 'var(--color-warning)' : 'var(--color-text-secondary)',
        }}>
          {formatIDR(r.balance)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <PaymentStatusBadge status={r.payment_status} />,
    },
    {
      key: 'payment_date',
      header: 'Payment Date',
      render: (r) => (
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          {r.payment_date ? formatDate(r.payment_date) : '—'}
        </span>
      ),
    },
    {
      key: 'method',
      header: 'Method',
      render: (r) => (
        <span style={{ fontSize: '0.75rem' }}>
          {r.payment_method ? METHOD_LABEL[r.payment_method] ?? r.payment_method : '—'}
        </span>
      ),
    },
  ]
}

export default async function MyPaymentsPage() {
  const profile = await getSessionProfile()
  const [records, pmOpts] = await Promise.all([
    getPaymentsByMember(profile.id),
    getSettingOptions('payment_method'),
  ])
  const METHOD_LABEL = Object.fromEntries(pmOpts.map((o) => [o.value, o.label]))

  const sumInt = (rows: typeof records, key: 'total_due' | 'total_paid' | 'balance') =>
    Math.round(rows.reduce((s, row) => s + Number(row[key]), 0))
  const totalDue = sumInt(records, 'total_due')
  const totalPaid = sumInt(records, 'total_paid')
  const totalBal = sumInt(records, 'balance')

  return (
    <div>
      <PageHeader
        title="My Payments"
        subtitle="Payment records created for you by an admin."
      />

      {records.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
          <SummaryCard label="Total Due" value={formatIDR(totalDue)} />
          <SummaryCard label="Total Paid" value={formatIDR(totalPaid)} color="var(--color-success)" />
          <SummaryCard label="Outstanding Balance" value={formatIDR(totalBal)} color={totalBal > 0 ? 'var(--color-warning)' : 'var(--color-success)'} />
        </div>
      )}

      <SectionCard noPadding={records.length > 0}>
        {records.length === 0 ? (
          <EmptyState
            icon={<Wallet size={22} />}
            title="No payment records"
            description="Your payment records will appear here once they are created by the admin."
            className="py-12"
          />
        ) : (
          <DataTable columns={myPaymentColumns(METHOD_LABEL)} data={records} />
        )}
      </SectionCard>
    </div>
  )
}

function SummaryCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-card)',
        padding: '16px 20px',
      }}
    >
      <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
        {label}
      </p>
      <p style={{ fontSize: '1.25rem', fontWeight: 700, color: color ?? 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </p>
    </div>
  )
}
