import Link from 'next/link'
import { Receipt, Plus } from 'lucide-react'

import { getSessionProfile, requireRole } from '@/lib/auth/session'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { DataTable } from '@/components/shared/DataTable'
import type { Column } from '@/components/shared/DataTable'
import { CompensationStatusBadge } from '@/components/modules/compensation/CompensationStatusBadge'
import { getCompensationRecords, type CompensationRow } from '@/lib/compensation/queries'
import { formatDate, formatIDR } from '@/lib/utils/formatters'
import { WORK_BASIS_OPTIONS } from '@/lib/constants/options'

export const metadata = { title: 'Compensation — ReKa Engineering OS' }

const RATE_LABEL = Object.fromEntries(WORK_BASIS_OPTIONS.map((o) => [o.value, o.label]))

function compensationColumns(): Column<CompensationRow>[] {
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
      key: 'project',
      header: 'Project',
      render: (r) => <span>{r.project?.name ?? '—'}</span>,
    },
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
  ]
}

export default async function CompensationListPage() {
  const _sp = await getSessionProfile()
  requireRole(_sp.system_role, ['admin'])

  const records = await getCompensationRecords()

  return (
    <div>
      <PageHeader
        title="Compensation"
        subtitle="Work-based compensation records for team members and freelancers."
        actions={
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
        }
      />

      <SectionCard noPadding>
        {records.length === 0 ? (
          <EmptyState
            emphasis
            icon={<Receipt size={24} strokeWidth={1.5} />}
            title="No compensation records yet"
            description="Create a compensation record to track what is owed for work done."
            action={
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
            }
          />
        ) : (
          <DataTable columns={compensationColumns()} data={records} />
        )}
      </SectionCard>
    </div>
  )
}
