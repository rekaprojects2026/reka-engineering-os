import Link from 'next/link'
import { getSessionProfile, requireRole } from '@/lib/auth/session'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { FilterBar } from '@/components/shared/FilterBar'
import { DataTable } from '@/components/shared/DataTable'
import type { Column } from '@/components/shared/DataTable'
import { IntakeStatusBadge } from '@/components/modules/intakes/IntakeStatusBadge'
import { getIntakes } from '@/lib/intakes/queries'
import type { IntakeWithClient } from '@/lib/intakes/queries'
import { formatDate } from '@/lib/utils/formatters'
import { ClipboardList, Plus } from 'lucide-react'

export const metadata = { title: 'Intakes — ReKa Engineering OS' }

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string; source?: string; discipline?: string }>
}

function intakeColumns(): Column<IntakeWithClient>[] {
  return [
    {
      key: 'intake_code',
      header: 'Intake Code',
      render: (intake) => (
        <Link href={`/intakes/${intake.id}`} style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            {intake.intake_code}
          </span>
        </Link>
      ),
    },
    {
      key: 'client',
      header: 'Client / Prospect',
      render: (intake) => {
        const clientDisplay = intake.clients
          ? intake.clients.client_name
          : intake.temp_client_name ?? '—'
        const clientSub = intake.clients?.client_code ?? null
        return (
          <Link href={`/intakes/${intake.id}`} style={{ textDecoration: 'none', display: 'block' }}>
            <p style={{ fontWeight: 500, color: 'var(--color-text-primary)', fontSize: '0.8125rem' }}>
              {clientDisplay}
            </p>
            {clientSub && (
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{clientSub}</p>
            )}
          </Link>
        )
      },
    },
    {
      key: 'title',
      header: 'Title',
      render: (intake) => (
        <Link href={`/intakes/${intake.id}`} style={{ textDecoration: 'none', display: 'block' }}>
          <p style={{
            fontWeight: 500,
            color: 'var(--color-text-primary)',
            fontSize: '0.8125rem',
            maxWidth: '280px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {intake.title}
          </p>
        </Link>
      ),
    },
    {
      key: 'source',
      header: 'Source',
      render: (intake) => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>
          {intake.source}
        </span>
      ),
    },
    {
      key: 'discipline',
      header: 'Discipline',
      render: (intake) => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>
          {intake.discipline}
        </span>
      ),
    },
    {
      key: 'deadline',
      header: 'Proposed Deadline',
      render: (intake) => (
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
          {formatDate(intake.proposed_deadline)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (intake) => <IntakeStatusBadge status={intake.status} />,
    },
    {
      key: 'received',
      header: 'Received',
      render: (intake) => (
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
          {formatDate(intake.received_date)}
        </span>
      ),
    },
  ]
}

export default async function IntakesPage({ searchParams }: PageProps) {
  const _sp = await getSessionProfile()
  requireRole(_sp.system_role, ['admin', 'coordinator'])

  const params = await searchParams
  const intakes = await getIntakes({
    search: params.search,
    status: params.status,
    source: params.source,
    discipline: params.discipline,
  }).catch(() => [] as IntakeWithClient[])

  const hasActiveFilters = Boolean(params.search || params.status || params.source || params.discipline)

  return (
    <div>
      <PageHeader
        title="Intakes"
        subtitle="Incoming leads and project opportunities before conversion."
        actions={
          <Link
            href="/intakes/new"
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
            New Intake
          </Link>
        }
      />

      <form method="GET">
        <FilterBar>
          <input name="search" type="search" defaultValue={params.search ?? ''} placeholder="Search intakes…" className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-colors min-w-[200px]" />
          <select name="status" defaultValue={params.status ?? ''} className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] cursor-pointer transition-colors">
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="awaiting_info">Awaiting Info</option>
            <option value="qualified">Qualified</option>
            <option value="rejected">Rejected</option>
            <option value="converted">Converted</option>
          </select>
          <select name="source" defaultValue={params.source ?? ''} className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] cursor-pointer transition-colors">
            <option value="">All Sources</option>
            <option value="upwork">Upwork</option>
            <option value="fiverr">Fiverr</option>
            <option value="direct">Direct</option>
            <option value="referral">Referral</option>
            <option value="other">Other</option>
          </select>
          <select name="discipline" defaultValue={params.discipline ?? ''} className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] cursor-pointer transition-colors">
            <option value="">All Disciplines</option>
            <option value="mechanical">Mechanical</option>
            <option value="civil">Civil</option>
            <option value="structural">Structural</option>
            <option value="electrical">Electrical</option>
            <option value="other">Other</option>
          </select>
          <button type="submit" className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] transition-colors whitespace-nowrap cursor-pointer">Filter</button>
          {hasActiveFilters && (
            <Link href="/intakes" className="px-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] font-medium transition-colors whitespace-nowrap no-underline">Clear filters</Link>
          )}
        </FilterBar>
      </form>

      <SectionCard noPadding>
        <IntakesTable intakes={intakes} hasActiveFilters={hasActiveFilters} />
      </SectionCard>
    </div>
  )
}

function IntakesTable({ intakes, hasActiveFilters }: { intakes: IntakeWithClient[]; hasActiveFilters: boolean }) {
  if (intakes.length === 0) {
    if (hasActiveFilters) {
      return (
        <EmptyState
          compact
          icon={<ClipboardList size={16} aria-hidden="true" />}
          title="No intakes match your filters"
          description="Try different criteria or clear filters to see all intakes."
          action={<Link href="/intakes" className="inline-flex items-center px-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] font-medium transition-colors whitespace-nowrap no-underline">Clear filters</Link>}
        />
      )
    }
    return (
      <EmptyState
        icon={<ClipboardList size={22} />}
        title="No intakes yet"
        description="Log your first incoming lead from Upwork, Fiverr, or a direct inquiry to start tracking opportunities."
        action={
          <Link
            href="/intakes/new"
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
            Log first intake
          </Link>
        }
      />
    )
  }

  return <DataTable columns={intakeColumns()} data={intakes} />
}
