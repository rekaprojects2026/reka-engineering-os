import Link from 'next/link'
import type { CSSProperties } from 'react'
import { getSessionProfile, requireRole } from '@/lib/auth/session'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { FilterBar } from '@/components/shared/FilterBar'
import { IntakeStatusBadge } from '@/components/modules/intakes/IntakeStatusBadge'
import { getIntakes } from '@/lib/intakes/queries'
import type { IntakeWithClient } from '@/lib/intakes/queries'
import { formatDate } from '@/lib/utils/formatters'
import { ClipboardList, Plus } from 'lucide-react'

const FI: CSSProperties = { padding: '7px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', fontSize: '0.8125rem', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)', outline: 'none', minWidth: '200px' }
const FS: CSSProperties = { padding: '7px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', fontSize: '0.8125rem', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)', cursor: 'pointer' }
const FB: CSSProperties = { padding: '7px 14px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' as const }
const FC: CSSProperties = { padding: '7px 10px', fontSize: '0.8125rem', color: 'var(--color-text-muted)', textDecoration: 'none', fontWeight: 500, whiteSpace: 'nowrap' as const }

export const metadata = { title: 'Intakes — Engineering Agency OS' }

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string; source?: string; discipline?: string }>
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

      {/* Filters */}
      <form method="GET">
        <FilterBar>
          <input name="search" type="search" defaultValue={params.search ?? ''} placeholder="Search intakes…" style={FI} />
          <select name="status" defaultValue={params.status ?? ''} style={FS}>
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="awaiting_info">Awaiting Info</option>
            <option value="qualified">Qualified</option>
            <option value="rejected">Rejected</option>
            <option value="converted">Converted</option>
          </select>
          <select name="source" defaultValue={params.source ?? ''} style={FS}>
            <option value="">All Sources</option>
            <option value="upwork">Upwork</option>
            <option value="fiverr">Fiverr</option>
            <option value="direct">Direct</option>
            <option value="referral">Referral</option>
            <option value="other">Other</option>
          </select>
          <select name="discipline" defaultValue={params.discipline ?? ''} style={FS}>
            <option value="">All Disciplines</option>
            <option value="mechanical">Mechanical</option>
            <option value="civil">Civil</option>
            <option value="structural">Structural</option>
            <option value="electrical">Electrical</option>
            <option value="other">Other</option>
          </select>
          <button type="submit" style={FB}>Filter</button>
          {(params.search || params.status || params.source || params.discipline) && (
            <Link href="/intakes" style={FC}>Clear filters</Link>
          )}
        </FilterBar>
      </form>

      {/* Table */}
      <SectionCard noPadding>
        <IntakesTable intakes={intakes} />
      </SectionCard>
    </div>
  )
}

function IntakesTable({ intakes }: { intakes: IntakeWithClient[] }) {
  if (intakes.length === 0) {
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

  const headers = ['Intake Code', 'Client / Prospect', 'Title', 'Source', 'Discipline', 'Proposed Deadline', 'Status', 'Received']

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            {headers.map(h => (
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
          {intakes.map((intake, idx) => {
            const clientDisplay = intake.clients
              ? intake.clients.client_name
              : intake.temp_client_name ?? '—'
            const clientSub = intake.clients?.client_code ?? null

            return (
              <tr
                key={intake.id}
                style={{
                  borderBottom: idx < intakes.length - 1 ? '1px solid var(--color-border)' : undefined,
                  backgroundColor: 'var(--color-surface)',
                  cursor: 'pointer',
                }}
                className="hover:bg-[var(--color-surface-muted)] transition-colors"
              >
                <td style={{ padding: '10px 14px' }}>
                  <Link href={`/intakes/${intake.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {intake.intake_code}
                    </span>
                  </Link>
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <Link href={`/intakes/${intake.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                    <p style={{ fontWeight: 500, color: 'var(--color-text-primary)', fontSize: '0.8125rem' }}>
                      {clientDisplay}
                    </p>
                    {clientSub && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{clientSub}</p>
                    )}
                  </Link>
                </td>
                <td style={{ padding: '10px 14px' }}>
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
                </td>
                <td style={{ padding: '10px 14px', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>
                  {intake.source}
                </td>
                <td style={{ padding: '10px 14px', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>
                  {intake.discipline}
                </td>
                <td style={{ padding: '10px 14px', fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                  {formatDate(intake.proposed_deadline)}
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <IntakeStatusBadge status={intake.status} />
                </td>
                <td style={{ padding: '10px 14px', fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                  {formatDate(intake.received_date)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
