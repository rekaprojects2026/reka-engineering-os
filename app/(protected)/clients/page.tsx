import Link from 'next/link'
import { getSessionProfile, requireRole } from '@/lib/auth/session'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { FilterBar } from '@/components/shared/FilterBar'
import { DataTable } from '@/components/shared/DataTable'
import type { Column } from '@/components/shared/DataTable'
import { ClientStatusBadge } from '@/components/modules/clients/ClientStatusBadge'
import { getClients } from '@/lib/clients/queries'
import { formatDate } from '@/lib/utils/formatters'
import { Users, Plus } from 'lucide-react'
import type { Client } from '@/types/database'

export const metadata = { title: 'Clients — ReKa Engineering OS' }

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string; source?: string }>
}

const clientColumns: Column<Client>[] = [
  {
    key: 'client_name',
    header: 'Client Name',
    render: (row) => (
      <div>
        <Link href={`/clients/${row.id}`} style={{ textDecoration: 'none' }}>
          <p style={{ fontWeight: 500, color: 'var(--color-text-primary)', fontSize: '0.8125rem' }}>{row.client_name}</p>
        </Link>
        {row.company_name && (
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{row.company_name}</p>
        )}
      </div>
    ),
  },
  {
    key: 'client_code',
    header: 'Code',
    width: '130px',
    render: (row) => (
      <Link href={`/clients/${row.id}`} style={{ textDecoration: 'none' }}>
        <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          {row.client_code}
        </span>
      </Link>
    ),
  },
  {
    key: 'client_type',
    header: 'Type',
    width: '120px',
    render: (row) => (
      <span style={{ color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>
        {row.client_type}
      </span>
    ),
  },
  {
    key: 'primary_contact',
    header: 'Primary Contact',
    render: (row) => (
      <div>
        <p>{row.primary_contact_name ?? <span style={{ color: 'var(--color-text-muted)' }}>—</span>}</p>
        {row.primary_contact_email && (
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{row.primary_contact_email}</p>
        )}
      </div>
    ),
  },
  {
    key: 'source_default',
    header: 'Source',
    width: '110px',
    render: (row) => (
      <span style={{ color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>
        {row.source_default}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    width: '110px',
    render: (row) => <ClientStatusBadge status={row.status} />,
  },
  {
    key: 'created_at',
    header: 'Added',
    width: '120px',
    render: (row) => (
      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
        {formatDate(row.created_at)}
      </span>
    ),
  },
]

export default async function ClientsPage({ searchParams }: PageProps) {
  const _sp = await getSessionProfile()
  requireRole(_sp.system_role, ['admin', 'coordinator'])

  const params = await searchParams
  const clients = await getClients({
    search: params.search,
    status: params.status,
    source: params.source,
  }).catch(() => [] as Client[])

  const hasActiveFilters = Boolean(params.search || params.status || params.source)

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle="Companies and individuals commissioning engineering work."
        actions={
          <Link
            href="/clients/new"
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
            New Client
          </Link>
        }
      />

      <form method="GET">
        <FilterBar>
          <input name="search" type="search" defaultValue={params.search ?? ''} placeholder="Search clients…" className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-colors min-w-[200px]" />
          <select name="status" defaultValue={params.status ?? ''} className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] cursor-pointer transition-colors">
            <option value="">All Statuses</option>
            <option value="lead">Lead</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
          <select name="source" defaultValue={params.source ?? ''} className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] cursor-pointer transition-colors">
            <option value="">All Sources</option>
            <option value="upwork">Upwork</option>
            <option value="fiverr">Fiverr</option>
            <option value="direct">Direct</option>
            <option value="referral">Referral</option>
            <option value="other">Other</option>
          </select>
          <button type="submit" className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] transition-colors whitespace-nowrap cursor-pointer">Filter</button>
          {hasActiveFilters && (
            <Link href="/clients" className="px-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] font-medium transition-colors whitespace-nowrap no-underline">Clear filters</Link>
          )}
        </FilterBar>
      </form>

      <SectionCard noPadding>
        <ClientsTable clients={clients} hasActiveFilters={hasActiveFilters} />
      </SectionCard>
    </div>
  )
}

function ClientsTable({ clients, hasActiveFilters }: { clients: Client[]; hasActiveFilters: boolean }) {
  if (clients.length === 0) {
    if (hasActiveFilters) {
      return (
        <EmptyState
          compact
          icon={<Users size={16} aria-hidden="true" />}
          title="No clients match your filters"
          description="Try different criteria or clear filters to see all clients."
          action={<Link href="/clients" className="inline-flex items-center px-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] font-medium transition-colors whitespace-nowrap no-underline">Clear filters</Link>}
        />
      )
    }
    return (
      <EmptyState
        icon={<Users size={22} />}
        title="No clients yet"
        description="Add your first client to start tracking leads, contacts, and linked projects."
        action={
          <Link
            href="/clients/new"
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
            Add first client
          </Link>
        }
      />
    )
  }

  return <DataTable columns={clientColumns} data={clients} />
}
