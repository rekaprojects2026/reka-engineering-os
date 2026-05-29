import Link from 'next/link'
import { Suspense } from 'react'
import { Wallet, Plus } from 'lucide-react'

import { getSessionProfile, requireRole } from '@/lib/auth/session'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { FilterBar } from '@/components/shared/FilterBar'
import { DataTable } from '@/components/shared/DataTable'
import type { Column } from '@/components/shared/DataTable'
import { Pagination } from '@/components/shared/Pagination'
import { PaymentStatusBadge } from '@/components/modules/payments/PaymentStatusBadge'
import { getPaymentRecords, type PaymentRow } from '@/lib/payments/queries'
import { formatDate, formatIDR, formatUSD } from '@/lib/utils/formatters'
import { getSettingOptions } from '@/lib/settings/queries'
import { parsePagination, totalPages } from '@/lib/utils/pagination'

export const metadata = { title: 'Payments — ReKa Engineering OS' }

interface PageProps {
  searchParams: Promise<{
    status?: string
    member?: string
    page?: string
    pageSize?: string
  }>
}

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
      render: (r) => (
        <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
          {r.currency_code === 'USD' ? formatUSD(r.total_due) : formatIDR(r.total_due)}
        </span>
      ),
    },
    {
      key: 'paid',
      header: 'Paid',
      render: (r) => (
        <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
          {r.currency_code === 'USD' ? formatUSD(r.total_paid) : formatIDR(r.total_paid)}
        </span>
      ),
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
          {r.currency_code === 'USD' ? formatUSD(r.balance) : formatIDR(r.balance)}
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

export default async function PaymentsListPage({ searchParams }: PageProps) {
  const _sp = await getSessionProfile()
  requireRole(_sp.system_role, ['direktur', 'finance'])

  const params = await searchParams
  const { page, pageSize } = parsePagination(params)
  const hasActiveFilters = Boolean(params.status || params.member)

  const [result, pmOpts] = await Promise.all([
    getPaymentRecords({
      status: params.status,
      memberName: params.member,
      page,
      pageSize,
    }),
    getSettingOptions('payment_method'),
  ])

  const records = result.rows
  const totalCount = result.count
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

      <form method="GET">
        <FilterBar>
          <input
            name="member"
            type="search"
            defaultValue={params.member ?? ''}
            placeholder="Search by name…"
            className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm placeholder:text-[var(--color-text-muted)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] min-w-[180px]"
          />
          <select
            name="status"
            defaultValue={params.status ?? ''}
            className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)] cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
          </select>
          <button
            type="submit"
            className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-medium hover:bg-[var(--color-surface-muted)] cursor-pointer"
          >
            Filter
          </button>
          {hasActiveFilters && (
            <Link
              href="/payments"
              className="px-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] font-medium no-underline"
            >
              Clear filters
            </Link>
          )}
        </FilterBar>
      </form>

      <SectionCard noPadding>
        {records.length === 0 ? (
          <EmptyState
            emphasis={!hasActiveFilters}
            compact={hasActiveFilters}
            icon={<Wallet size={hasActiveFilters ? 16 : 24} strokeWidth={1.5} />}
            title={hasActiveFilters ? 'No payments match your filters' : 'No payment records yet'}
            description={
              hasActiveFilters
                ? 'Try different criteria or clear filters.'
                : 'Create a payment record to track what has been paid to members.'
            }
            action={
              hasActiveFilters ? (
                <Link
                  href="/payments"
                  className="px-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] font-medium no-underline"
                >
                  Clear filters
                </Link>
              ) : (
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
              )
            }
          />
        ) : (
          <DataTable columns={paymentColumns(METHOD_LABEL)} data={records} />
        )}
      </SectionCard>
      <Suspense fallback={null}>
        <Pagination
          currentPage={page}
          totalPages={totalPages(totalCount, pageSize)}
          pageSize={pageSize}
          totalCount={totalCount}
        />
      </Suspense>
    </div>
  )
}
