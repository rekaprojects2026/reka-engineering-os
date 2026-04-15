import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { DataTable } from '@/components/shared/DataTable'
import { ClientStatusBadge } from '@/components/modules/clients/ClientStatusBadge'
import { getClients } from '@/lib/clients/queries'
import { formatDate } from '@/lib/utils/formatters'
import { Users, Plus } from 'lucide-react'
import type { Client } from '@/types/database'

export const metadata = { title: 'Clients — Engineering Agency OS' }

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string; source?: string }>
}

export default async function ClientsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const clients = await getClients({
    search: params.search,
    status: params.status,
    source: params.source,
  }).catch(() => [] as Client[])

  const columns = [
    {
      key: 'client_name',
      header: 'Client Name',
      render: (row: Client) => (
        <div>
          <p style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{row.client_name}</p>
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
      render: (row: Client) => (
        <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          {row.client_code}
        </span>
      ),
    },
    {
      key: 'client_type',
      header: 'Type',
      width: '120px',
      render: (row: Client) => (
        <span style={{ color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>
          {row.client_type}
        </span>
      ),
    },
    {
      key: 'primary_contact',
      header: 'Primary Contact',
      render: (row: Client) => (
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
      render: (row: Client) => (
        <span style={{ color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>
          {row.source_default}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '110px',
      render: (row: Client) => <ClientStatusBadge status={row.status} />,
    },
    {
      key: 'created_at',
      header: 'Added',
      width: '120px',
      render: (row: Client) => (
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
          {formatDate(row.created_at)}
        </span>
      ),
    },
  ]

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
              color: '#fff',
              borderRadius: '6px',
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

      {/* Filters */}
      <form method="GET" style={{ marginBottom: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <input
          name="search"
          type="search"
          defaultValue={params.search ?? ''}
          placeholder="Search clients…"
          style={{
            padding: '7px 11px',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            fontSize: '0.8125rem',
            minWidth: '220px',
            backgroundColor: 'var(--color-surface)',
          }}
        />
        <select
          name="status"
          defaultValue={params.status ?? ''}
          style={{
            padding: '7px 11px',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            fontSize: '0.8125rem',
            backgroundColor: 'var(--color-surface)',
          }}
        >
          <option value="">All Statuses</option>
          <option value="lead">Lead</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="archived">Archived</option>
        </select>
        <select
          name="source"
          defaultValue={params.source ?? ''}
          style={{
            padding: '7px 11px',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            fontSize: '0.8125rem',
            backgroundColor: 'var(--color-surface)',
          }}
        >
          <option value="">All Sources</option>
          <option value="upwork">Upwork</option>
          <option value="fiverr">Fiverr</option>
          <option value="direct">Direct</option>
          <option value="referral">Referral</option>
          <option value="other">Other</option>
        </select>
        <button
          type="submit"
          style={{
            padding: '7px 14px',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            fontSize: '0.8125rem',
            cursor: 'pointer',
            color: 'var(--color-text-secondary)',
          }}
        >
          Filter
        </button>
        {(params.search || params.status || params.source) && (
          <Link
            href="/clients"
            style={{
              padding: '7px 14px',
              fontSize: '0.8125rem',
              color: 'var(--color-text-muted)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            Clear
          </Link>
        )}
      </form>

      {/* Table */}
      <SectionCard noPadding>
        <ClientsTable clients={clients} />
      </SectionCard>
    </div>
  )
}

function ClientsTable({ clients }: { clients: Client[] }) {
  if (clients.length === 0) {
    return (
      <EmptyState
        icon={<Users size={22} />}
        title="No clients yet"
        description="Add your first client to start tracking leads, contacts, and linked projects."
        action={
          <Link
            href="/clients/new"
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--color-primary)',
              color: '#fff',
              borderRadius: '6px',
              fontSize: '0.8125rem',
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            Add First Client
          </Link>
        }
      />
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            {['Client Name', 'Code', 'Type', 'Primary Contact', 'Source', 'Status', 'Added'].map(h => (
              <th
                key={h}
                style={{
                  padding: '10px 14px',
                  textAlign: 'left',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--color-text-muted)',
                  backgroundColor: 'var(--color-surface-subtle)',
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {clients.map((client, idx) => (
            <tr
              key={client.id}
              style={{
                borderBottom: idx < clients.length - 1 ? '1px solid var(--color-border)' : undefined,
                backgroundColor: 'var(--color-surface)',
                cursor: 'pointer',
              }}
              className="hover:bg-[#F8FAFC]"
            >
              <td style={{ padding: '10px 14px' }}>
                <Link href={`/clients/${client.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <p style={{ fontWeight: 500, color: 'var(--color-text-primary)', fontSize: '0.8125rem' }}>
                    {client.client_name}
                  </p>
                  {client.company_name && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{client.company_name}</p>
                  )}
                </Link>
              </td>
              <td style={{ padding: '10px 14px' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {client.client_code}
                </span>
              </td>
              <td style={{ padding: '10px 14px', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>
                {client.client_type}
              </td>
              <td style={{ padding: '10px 14px' }}>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>
                  {client.primary_contact_name ?? <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                </p>
                {client.primary_contact_email && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{client.primary_contact_email}</p>
                )}
              </td>
              <td style={{ padding: '10px 14px', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>
                {client.source_default}
              </td>
              <td style={{ padding: '10px 14px' }}>
                <ClientStatusBadge status={client.status} />
              </td>
              <td style={{ padding: '10px 14px', fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                {formatDate(client.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
