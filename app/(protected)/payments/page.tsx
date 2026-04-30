import Link from 'next/link'
import { Wallet, Plus } from 'lucide-react'

import { getSessionProfile, requireRole } from '@/lib/auth/session'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { DataTable } from '@/components/shared/DataTable'
import type { Column } from '@/components/shared/DataTable'
import { PaymentStatusBadge } from '@/components/modules/payments/PaymentStatusBadge'
import { getPaymentRecords, type PaymentRow } from '@/lib/payments/queries'
import { formatDate, formatIDR } from '@/lib/utils/formatters'
import { getSettingOptions } from '@/lib/settings/queries'

export const metadata = { title: 'Payments — ReKa Engineering OS' }

function paymentColumns(METHOD_LABEL: Record<string, string>): Column<PaymentRow>[] {
  return [
    {
      key: 'member',
      header: 'Member',
      render: (r) => (
        <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
          {r.member?.full_name ?? '—'}
        </span>
      ),
    },
    {
      key: 'period',
      header: 'Period',
      render: (r) => <span>{r.period_label ?? '—'}</span>,
    },
    {
      key: 'due',
      header: 'Due',
      render: (r) => <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{formatIDR(r.total_due)}</span>,
    },
    {
      key: 'paid',
      header: 'Paid',
      render: (r) => <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{formatIDR(r.total_paid)}</span>,
    },
    {
      key: 'balance',
      header: 'Balance',
      render: (r) => (
        <span style={{
          fontFamily: 'monospace',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: Number(r.balance) > 0 ? 'var(--color-warning)' : 'var(--color-text-primary)',
        }}>
          {formatIDR(r.balance)}
        </span>
      ),
    },
    {
      key: 'method',
      header: 'Method',
      render: (r) => <span>{r.payment_method ? METHOD_LABEL[r.payment_method] ?? r.payment_method : '—'}</span>,
    },
    {
      key: 'date',
      header: 'Date',
      render: (r) => <span>{formatDate(r.payment_date)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <PaymentStatusBadge status={r.payment_status} />,
    },
    {
      key: 'view',
      header: '',
      width: '64px',
      align: 'right',
      render: (r) => (
        <Link
          href={`/payments/${r.id}`}
          style={{ fontSize: '0.75rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}
        >
          View
        </Link>
      ),
    },
  ]
}

export default async function PaymentsListPage() {
  const _sp = await getSessionProfile()
  requireRole(_sp.system_role, ['direktur', 'finance'])

  const [records, pmOpts] = await Promise.all([
    getPaymentRecords(),
    getSettingOptions('payment_method'),
  ])
  const METHOD_LABEL = Object.fromEntries(pmOpts.map((o) => [o.value, o.label]))

  return (
    <div>
      <PageHeader
        title="Payments"
        subtitle="Payment tracking for team members and freelancers."
        actions={
          <Link
            href="/payments/new"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-primary-fg)',
              borderRadius: 'var(--radius-control)',
              fontSize: '0.8125rem',
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            <Plus size={14} aria-hidden="true" />
            Add Payment
          </Link>
        }
      />

      <SectionCard noPadding>
        {records.length === 0 ? (
          <EmptyState
            emphasis
            icon={<Wallet size={24} strokeWidth={1.5} />}
            title="No payment records yet"
            description="Create a payment record to track what has been paid to members."
            action={
              <Link
                href="/payments/new"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 18px',
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-primary-fg)',
                  borderRadius: 'var(--radius-control)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <Plus size={14} aria-hidden="true" />
                Add payment
              </Link>
            }
          />
        ) : (
          <DataTable columns={paymentColumns(METHOD_LABEL)} data={records} />
        )}
      </SectionCard>
    </div>
  )
}
