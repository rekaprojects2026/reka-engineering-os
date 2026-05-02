import Link from 'next/link'
import { Suspense } from 'react'
import { getSessionProfile, requireRole } from '@/lib/auth/session'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { FilterBar } from '@/components/shared/FilterBar'
import { DataTable } from '@/components/shared/DataTable'
import type { Column } from '@/components/shared/DataTable'
import { ClientStatusBadge } from '@/components/modules/clients/ClientStatusBadge'
import { getClients } from '@/lib/clients/queries'
import { getRevenueByClient } from '@/lib/invoices/queries'
import { getUsdToIdrRate } from '@/lib/fx/queries'
import { formatDate } from '@/lib/utils/formatters'
import { Users, Plus } from 'lucide-react'
import { parsePagination, totalPages } from '@/lib/utils/pagination'
import { Pagination } from '@/components/shared/Pagination'
import type { Client } from '@/types/database'

export const metadata = { title: 'Clients — ReKa Engineering OS' }

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string; source?: string; page?: string; pageSize?: string }>
}

type ClientWithRevenue = Client & { _revenue?: { total_net: number; invoice_count: number; currency: string } }

function clientColumns(revenueMap: Record<string, { total_gross: number; total_net: number; currency: string; invoice_count: number }>, fxRate: number): Column<ClientWithRevenue>[] {
  return [
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
    key: 'revenue',
    header: 'Revenue',
    width: '140px',
    render: (row) => {
      const rev = revenueMap[row.id]
      if (!rev || rev.invoice_count === 0) return <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>—</span>
      return (
        <div>
          <p style={{ fontSize: '0.8125rem', fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {rev.currency} {rev.total_net.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
          {rev.currency === 'USD' && (
            <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
              ≈ {(rev.total_net * fxRate).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          )}
          <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>{rev.invoice_count} invoice{rev.invoice_count !== 1 ? 's' : ''}</p>
        </div>
      )
    },
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
}

export default async function ClientsPage({ searchParams }: PageProps) {
  const _sp = await getSessionProfile()
  requireRole(_sp.system_role, ['direktur', 'technical_director', 'finance', 'manajer', 'bd'])

  const params = await searchParams
  const { page, pageSize } = parsePagination(params)
  const [clientList, revenueMap, fxRate] = await Promise.all([
    getClients({
      search: params.search,
      status: params.status,
      source: params.source,
      page,
      pageSize,
    }).catch(() => ({ rows: [] as Client[], count: 0 })),
    getRevenueByClient().catch(() => ({} as Record<string, { total_gross: number; total_net: number; currency: string; invoice_count: number }>)),
    getUsdToIdrRate().catch(() => 16400),
  ])

  const clients = clientList.rows
  const clientTotalCount = clientList.count

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
          <input name="search" type="search" defaultValue={params.search ?? ''} placeholder="Search clients…" className="h-9 min-w-[200px] rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary-neutral)] outline-none transition-[border-color,background-color,box-shadow] placeholder:text-[var(--input-placeholder)] focus:border-[var(--input-focus-border)] focus:bg-[var(--input-bg-focus)] focus:ring-[3px] focus:ring-[color:var(--input-focus-ring)]" />
          <select name="status" defaultValue={params.status ?? ''} className="h-9 cursor-pointer rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary-neutral)] outline-none transition-[border-color,background-color,box-shadow] focus:border-[var(--input-focus-border)] focus:bg-[var(--input-bg-focus)] focus:ring-[3px] focus:ring-[color:var(--input-focus-ring)]">
            <option value="">All Statuses</option>
            <option value="lead">Lead</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
          <select name="source" defaultValue={params.source ?? ''} className="h-9 cursor-pointer rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary-neutral)] outline-none transition-[border-color,background-color,box-shadow] focus:border-[var(--input-focus-border)] focus:bg-[var(--input-bg-focus)] focus:ring-[3px] focus:ring-[color:var(--input-focus-ring)]">
            <option value="">All Sources</option>
            <option value="upwork">Upwork</option>
            <option value="fiverr">Fiverr</option>
            <option value="direct">Direct</option>
            <option value="referral">Referral</option>
            <option value="other">Other</option>
          </select>
          <button type="submit" className="h-9 cursor-pointer whitespace-nowrap rounded-md border border-[var(--input-border)] bg-[var(--surface-card)] px-3 text-sm font-medium text-[var(--text-secondary-neutral)] transition-colors hover:bg-[var(--surface-neutral)]">Filter</button>
          {hasActiveFilters && (
            <Link href="/clients" className="px-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] font-medium transition-colors whitespace-nowrap no-underline">Clear filters</Link>
          )}
        </FilterBar>
      </form>

      <SectionCard noPadding>
        <ClientsTable clients={clients} hasActiveFilters={hasActiveFilters} revenueMap={revenueMap} fxRate={fxRate} />
      </SectionCard>
      <Suspense fallback={null}>
        <Pagination
          currentPage={page}
          totalPages={totalPages(clientTotalCount, pageSize)}
          pageSize={pageSize}
          totalCount={clientTotalCount}
        />
      </Suspense>
    </div>
  )
}

function ClientsTable({ clients, hasActiveFilters, revenueMap, fxRate }: { clients: Client[]; hasActiveFilters: boolean; revenueMap: Record<string, { total_gross: number; total_net: number; currency: string; invoice_count: number }>; fxRate: number }) {
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

  return <DataTable columns={clientColumns(revenueMap, fxRate)} data={clients as ClientWithRevenue[]} />
}
