import Link from 'next/link'
import { getSessionProfile, requireRole } from '@/lib/auth/session'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { FilterBar } from '@/components/shared/FilterBar'
import { DataTable } from '@/components/shared/DataTable'
import type { Column } from '@/components/shared/DataTable'
import { getPayslips, type PayslipWithProfile } from '@/lib/payslips/queries'
import { MoneyDisplay } from '@/components/shared/MoneyDisplay'
import { getUsdToIdrRate } from '@/lib/fx/queries'
import { PayslipDraftDeleteButton } from '@/components/modules/payslips/PayslipDraftDeleteButton'
import { deletePayslip } from '@/lib/payslips/actions'
import { FileText, Plus } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils/formatters'

export const metadata = { title: 'Payslips — ReKa Engineering OS' }

interface PageProps {
  searchParams: Promise<{ search?: string; month?: string; year?: string; status?: string }>
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  draft: { bg: 'var(--color-surface-muted)', color: 'var(--color-text-muted)', label: 'Draft' },
  sent: { bg: 'var(--color-primary-subtle)', color: 'var(--color-primary)', label: 'Sent' },
  paid: { bg: 'var(--color-success-subtle)', color: 'var(--color-success)', label: 'Paid' },
}

function PayslipStatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.draft
  return (
    <span
      style={{
        padding: '2px 8px',
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        backgroundColor: s.bg,
        color: s.color,
      }}
    >
      {s.label}
    </span>
  )
}

function periodLabel(month: number, year: number) {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1))
}

function payslipColumns(fxRate: number): Column<PayslipWithProfile>[] {
  return [
    {
      key: 'code',
      header: 'Code',
      render: p => (
        <Link href={`/finance/payslips/${p.id}`} style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>
            {p.payslip_code}
          </span>
        </Link>
      ),
    },
    {
      key: 'member',
      header: 'Member',
      render: p => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Avatar className="h-7 w-7 shrink-0">
            {p.profile?.photo_url && <AvatarImage src={p.profile.photo_url} alt={p.profile.full_name} />}
            <AvatarFallback
              className="text-[0.625rem] font-semibold"
              style={{ backgroundColor: 'var(--color-surface-muted)', color: 'var(--color-text-secondary)' }}
            >
              {getInitials(p.profile?.full_name ?? '?')}
            </AvatarFallback>
          </Avatar>
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>
            {p.profile?.full_name ?? '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'period',
      header: 'Period',
      render: p => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
          {periodLabel(p.period_month, p.period_year)}
        </span>
      ),
    },
    {
      key: 'net',
      header: 'Net amount',
      render: p => (
        <MoneyDisplay
          amount={p.net_amount}
          currency={p.currency}
          fxRateToIDR={fxRate}
          showConversion={p.currency === 'USD'}
        />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: p => <PayslipStatusBadge status={p.status} />,
    },
    {
      key: 'actions',
      header: '',
      render: p => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
          <Link href={`/finance/payslips/${p.id}`} style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary)' }}>
            View
          </Link>
          {p.status === 'draft' && (
            <PayslipDraftDeleteButton payslipId={p.id} deletePayslip={deletePayslip} />
          )}
        </div>
      ),
    },
  ]
}

export default async function PayslipsPage({ searchParams }: PageProps) {
  const sp = await getSessionProfile()
  requireRole(sp.system_role, ['direktur', 'finance'])

  const params = await searchParams
  const month = params.month ? parseInt(params.month, 10) : undefined
  const year = params.year ? parseInt(params.year, 10) : undefined

  const [rows, fxRate] = await Promise.all([
    getPayslips({
      search: params.search,
      status: params.status,
      month: month && !isNaN(month) ? month : undefined,
      year: year && !isNaN(year) ? year : undefined,
    }).catch(() => [] as PayslipWithProfile[]),
    getUsdToIdrRate(),
  ])

  const hasActiveFilters = Boolean(params.search || params.status || params.month || params.year)

  return (
    <div>
      <PageHeader
        title="Payslips"
        subtitle="Slip gaji karyawan per periode"
        actions={
          <Link
            href="/finance/payslips/new"
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
            <Plus size={14} /> Generate payslip
          </Link>
        }
      />

      <form method="GET">
        <FilterBar>
          <input
            name="search"
            type="search"
            defaultValue={params.search ?? ''}
            placeholder="Search by member name…"
            className="h-9 min-w-[200px] rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary-neutral)] outline-none transition-[border-color,background-color,box-shadow] placeholder:text-[var(--input-placeholder)] focus:border-[var(--input-focus-border)] focus:bg-[var(--input-bg-focus)] focus:ring-[3px] focus:ring-[color:var(--input-focus-ring)]"
          />
          <select
            name="month"
            defaultValue={params.month ?? ''}
            className="h-9 cursor-pointer rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary-neutral)] outline-none transition-[border-color,background-color,box-shadow] focus:border-[var(--input-focus-border)] focus:bg-[var(--input-bg-focus)] focus:ring-[3px] focus:ring-[color:var(--input-focus-ring)]"
          >
            <option value="">All months</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>
                {new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(2000, m - 1, 1))}
              </option>
            ))}
          </select>
          <select
            name="year"
            defaultValue={params.year ?? ''}
            className="h-9 cursor-pointer rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary-neutral)] outline-none transition-[border-color,background-color,box-shadow] focus:border-[var(--input-focus-border)] focus:bg-[var(--input-bg-focus)] focus:ring-[3px] focus:ring-[color:var(--input-focus-ring)]"
          >
            <option value="">All years</option>
            {[2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            name="status"
            defaultValue={params.status ?? ''}
            className="h-9 cursor-pointer rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary-neutral)] outline-none transition-[border-color,background-color,box-shadow] focus:border-[var(--input-focus-border)] focus:bg-[var(--input-bg-focus)] focus:ring-[3px] focus:ring-[color:var(--input-focus-ring)]"
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
          </select>
          <button
            type="submit"
            className="h-9 cursor-pointer rounded-md border border-[var(--input-border)] bg-[var(--surface-card)] px-3 text-sm font-medium text-[var(--text-secondary-neutral)] transition-colors hover:bg-[var(--surface-neutral)]"
          >
            Filter
          </button>
          {hasActiveFilters && (
            <Link
              href="/finance/payslips"
              className="px-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] font-medium no-underline"
            >
              Clear
            </Link>
          )}
        </FilterBar>
      </form>

      <SectionCard noPadding>
        {rows.length === 0 ? (
          <EmptyState
            compact={hasActiveFilters}
            icon={<FileText size={hasActiveFilters ? 16 : 22} />}
            title={hasActiveFilters ? 'No payslips match' : 'No payslips yet'}
            description={hasActiveFilters ? 'Try different filters.' : 'Generate a payslip to record employee payroll for a period.'}
            action={!hasActiveFilters ? (
              <Link
                href="/finance/payslips/new"
                style={{
                  padding: '9px 18px',
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-primary-fg)',
                  borderRadius: 'var(--radius-control)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Generate payslip
              </Link>
            ) : undefined}
          />
        ) : (
          <DataTable columns={payslipColumns(fxRate)} data={rows} />
        )}
      </SectionCard>
    </div>
  )
}
