import Link from 'next/link'
import type { CSSProperties } from 'react'
import { Suspense } from 'react'
import { Receipt, Plus } from 'lucide-react'

import { getSessionProfile, requireRole } from '@/lib/auth/session'
import { isFinance, isManajer } from '@/lib/auth/permissions'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { DataTable } from '@/components/shared/DataTable'
import type { Column } from '@/components/shared/DataTable'
import { CompensationStatusBadge } from '@/components/modules/compensation/CompensationStatusBadge'
import {
  countDraftCompensationRecords,
  getCompensationRecords,
  type CompensationListFilter,
  type CompensationRow,
} from '@/lib/compensation/queries'
import { formatDate, formatIDR } from '@/lib/utils/formatters'
import { RATE_TYPE_OPTIONS, WORK_BASIS_OPTIONS } from '@/lib/constants/options'
import { parsePagination, totalPages } from '@/lib/utils/pagination'
import { Pagination } from '@/components/shared/Pagination'

export const metadata = { title: 'Compensation — ReKa Engineering OS' }

const RATE_LABEL: Record<string, string> = {
  ...Object.fromEntries(WORK_BASIS_OPTIONS.map((o) => [o.value, o.label])),
  ...Object.fromEntries(RATE_TYPE_OPTIONS.map((o) => [o.value, o.label])),
}

const tabStyle = (active: boolean): CSSProperties => ({
  padding: '8px 14px',
  fontSize: '0.8125rem',
  fontWeight: 500,
  borderRadius: 'var(--radius-control)',
  textDecoration: 'none',
  border: '1px solid',
  borderColor: active ? 'var(--color-primary)' : 'var(--color-border)',
  backgroundColor: active ? 'var(--color-primary-subtle)' : 'transparent',
  color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
})

function compensationColumns(showProposer: boolean): Column<CompensationRow>[] {
  const cols: Column<CompensationRow>[] = [
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
      key: 'project',
      header: 'Project',
      render: (r) => <span>{r.project?.name ?? '—'}</span>,
    },
  ]

  if (showProposer) {
    cols.push({
      key: 'proposer',
      header: 'Proposed by',
      render: (r) => <span>{r.proposer?.full_name ?? '—'}</span>,
    })
  }

  cols.push(
    {
      key: 'rate_type',
      header: 'Rate Type',
      render: (r) => <span>{RATE_LABEL[r.rate_type] ?? r.rate_type}</span>,
    },
    {
      key: 'qty',
      header: 'Qty',
      render: (r) => <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{Number(r.qty)}</span>,
    },
    {
      key: 'rate',
      header: 'Rate',
      render: (r) => <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{formatIDR(r.rate_amount)}</span>,
    },
    {
      key: 'subtotal',
      header: 'Subtotal',
      render: (r) => (
        <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          {formatIDR(r.subtotal_amount)}
        </span>
      ),
    },
    {
      key: 'period',
      header: 'Period',
      render: (r) => <span>{r.period_label ?? (r.work_date ? formatDate(r.work_date) : '—')}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <CompensationStatusBadge status={r.status} />,
    },
    {
      key: 'view',
      header: '',
      width: '64px',
      align: 'right',
      render: (r) => (
        <Link
          href={`/compensation/${r.id}`}
          style={{ fontSize: '0.75rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}
        >
          View
        </Link>
      ),
    },
  )

  return cols
}

interface PageProps {
  searchParams: Promise<{ view?: string; page?: string; pageSize?: string }>
}

export default async function CompensationListPage({ searchParams }: PageProps) {
  const _sp = await getSessionProfile()
  requireRole(_sp.system_role, ['direktur', 'technical_director', 'finance', 'manajer'])

  const sp = await searchParams
  const view = sp.view
  const { page, pageSize } = parsePagination(sp)
  const filter: CompensationListFilter =
    view === 'pending' ? 'draft' : view === 'confirmed' ? 'confirmed' : 'all'

  const [compList, pendingCount] = await Promise.all([
    getCompensationRecords(_sp, filter, { page, pageSize }),
    isFinance(_sp.system_role) ? countDraftCompensationRecords() : Promise.resolve(0),
  ])

  const records = compList.rows
  const compensationTotalCount = compList.count

  const canPropose = _sp.system_role === 'technical_director' || _sp.system_role === 'manajer'
  const showProposerCol = !isManajer(_sp.system_role)

  return (
    <div>
      <PageHeader
        title="Compensation"
        subtitle="Work-based compensation records for team members and freelancers."
        actions={
          canPropose ? (
            <Link
              href="/compensation/new"
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
              Add Record
            </Link>
          ) : null
        }
      />

      {isFinance(_sp.system_role) && pendingCount > 0 && (
        <div
          style={{
            marginBottom: '16px',
            padding: '14px 18px',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Receipt size={20} strokeWidth={1.5} aria-hidden="true" />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {pendingCount} kompensasi menunggu konfirmasi Anda
            </span>
          </div>
          <Link
            href="/compensation?view=pending"
            style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--color-primary)',
              textDecoration: 'none',
            }}
          >
            Review dan konfirmasi →
          </Link>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <Link href="/compensation" style={tabStyle(view !== 'pending' && view !== 'confirmed')}>
          Semua
        </Link>
        <Link href="/compensation?view=pending" style={tabStyle(view === 'pending')}>
          Menunggu konfirmasi
        </Link>
        <Link href="/compensation?view=confirmed" style={tabStyle(view === 'confirmed')}>
          Sudah dikonfirmasi
        </Link>
      </div>

      <SectionCard noPadding>
        {records.length === 0 ? (
          <EmptyState
            emphasis
            icon={<Receipt size={24} strokeWidth={1.5} />}
            title="No compensation records in this view"
            description={
              filter === 'all'
                ? 'Create a compensation record to track what is owed for work done.'
                : 'Try another tab or create a new proposal.'
            }
            action={
              canPropose && filter === 'all' ? (
                <Link
                  href="/compensation/new"
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
                  Add record
                </Link>
              ) : undefined
            }
          />
        ) : (
          <DataTable columns={compensationColumns(showProposerCol)} data={records} />
        )}
      </SectionCard>
      <Suspense fallback={null}>
        <Pagination
          currentPage={page}
          totalPages={totalPages(compensationTotalCount, pageSize)}
          pageSize={pageSize}
          totalCount={compensationTotalCount}
        />
      </Suspense>
    </div>
  )
}
