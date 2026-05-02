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
import { getClientsForSelect } from '@/lib/clients/queries'
import { getUsersForSelect } from '@/lib/users/queries'
import type { ConvertLeadClientOption, ConvertLeadUserOption } from '@/components/modules/leads/ConvertLeadButton'
import { formatDate, formatMoney } from '@/lib/utils/formatters'
import { getUsdToIdrRate } from '@/lib/fx/queries'
import { Target, Plus, AlertCircle } from 'lucide-react'
import { ConvertLeadButton } from '@/components/modules/leads/ConvertLeadButton'

export const metadata = { title: 'Leads — ReKa Engineering OS' }

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string; source?: string; discipline?: string }>
}

const COMPLEXITY_COLORS: Record<string, string> = {
  low:       'var(--color-success)',
  medium:    'var(--color-warning)',
  high:      '#f97316',
  very_high: 'var(--color-danger)',
}

function complexityLabel(score: number | null | undefined): { label: string; color: string } | null {
  if (!score) return null
  if (score <= 3) return { label: `${score} · Low`,       color: COMPLEXITY_COLORS.low }
  if (score <= 6) return { label: `${score} · Medium`,    color: COMPLEXITY_COLORS.medium }
  if (score <= 8) return { label: `${score} · High`,      color: COMPLEXITY_COLORS.high }
  return              { label: `${score} · Very High`,    color: COMPLEXITY_COLORS.very_high }
}

function leadsColumns(
  fxRate: number,
  clients: ConvertLeadClientOption[],
  users: ConvertLeadUserOption[],
): Column<IntakeWithClient>[] {
  return [
    {
      key: 'code',
      header: 'Code',
      render: (lead) => (
        <Link href={`/leads/${lead.id}`} style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            {lead.intake_code}
          </span>
        </Link>
      ),
    },
    {
      key: 'client',
      header: 'Client / Prospect',
      render: (lead) => {
        const name = lead.clients ? lead.clients.client_name : lead.temp_client_name ?? '—'
        const sub  = lead.clients?.client_code ?? null
        return (
          <Link href={`/leads/${lead.id}`} style={{ textDecoration: 'none', display: 'block' }}>
            <p style={{ fontWeight: 500, fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>{name}</p>
            {sub && <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{sub}</p>}
          </Link>
        )
      },
    },
    {
      key: 'title',
      header: 'Title',
      render: (lead) => (
        <Link href={`/leads/${lead.id}`} style={{ textDecoration: 'none', display: 'block', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500, fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>
          {lead.title}
        </Link>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (lead) => {
        if (!lead.contact_channel && !lead.contact_value) {
          return <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>—</span>
        }
        return (
          <div>
            {lead.contact_channel && (
              <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>
                {lead.contact_channel}
              </span>
            )}
            {lead.contact_value && (
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{lead.contact_value}</p>
            )}
          </div>
        )
      },
    },
    {
      key: 'budget',
      header: 'Budget',
      render: (lead) => {
        if (!lead.budget_estimate) return <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>—</span>
        const currency = lead.budget_currency ?? 'IDR'
        const primary = formatMoney(lead.budget_estimate, currency)
        const showConv = currency === 'USD' && fxRate
        return (
          <div>
            <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>{primary}</span>
            {showConv && (
              <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                ~{formatMoney(lead.budget_estimate * fxRate, 'IDR')}
              </p>
            )}
          </div>
        )
      },
    },
    {
      key: 'complexity',
      header: 'Complexity',
      render: (lead) => {
        const cx = complexityLabel(lead.complexity_score)
        if (!cx) return <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>—</span>
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            fontSize: '0.75rem', fontWeight: 600, color: cx.color,
            border: `1px solid ${cx.color}30`,
            backgroundColor: `${cx.color}10`,
            borderRadius: '6px', padding: '2px 7px',
          }}>
            {cx.label}
          </span>
        )
      },
    },
    {
      key: 'deadline',
      header: 'Deadline',
      render: (lead) => (
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
          {formatDate(lead.proposed_deadline)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (lead) => <IntakeStatusBadge status={lead.status} />,
    },
    {
      key: 'actions',
      header: '',
      render: (lead) => {
        if (lead.status === 'converted' || lead.converted_project_id) {
          return (
            <Link
              href={`/projects/${lead.converted_project_id}`}
              style={{ fontSize: '0.75rem', color: 'var(--color-primary)', textDecoration: 'none', whiteSpace: 'nowrap' }}
            >
              → Project
            </Link>
          )
        }
        if (lead.status === 'qualified' || lead.status === 'closed') {
          return (
            <ConvertLeadButton
              leadId={lead.id}
              leadTitle={lead.title}
              leadClientName={lead.clients?.client_name ?? lead.temp_client_name ?? ''}
              clients={clients}
              users={users}
              linkedClientId={lead.clients?.id ?? null}
            />
          )
        }
        return null
      },
    },
  ]
}

export default async function LeadsPage({ searchParams }: PageProps) {
  const sp = await getSessionProfile()
  requireRole(sp.system_role, ['direktur', 'technical_director', 'manajer', 'bd'])

  const params = await searchParams
  const [leads, fxRate, clients, users] = await Promise.all([
    getIntakes({
      search: params.search,
      status: params.status,
      source: params.source,
      discipline: params.discipline,
    }).catch(() => [] as IntakeWithClient[]),
    getUsdToIdrRate(),
    getClientsForSelect(),
    getUsersForSelect(),
  ])

  const hasActiveFilters = Boolean(params.search || params.status || params.source || params.discipline)

  return (
    <div>
      <PageHeader
        title="Leads"
        subtitle="Incoming opportunities before they become projects."
        actions={
          <Link
            href="/leads/new"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-fg)', borderRadius: 'var(--radius-control)', fontSize: '0.8125rem', fontWeight: 500, textDecoration: 'none' }}
          >
            <Plus size={14} /> New Lead
          </Link>
        }
      />

      <form method="GET">
        <FilterBar>
          <input name="search" type="search" defaultValue={params.search ?? ''} placeholder="Search leads…"
            className="h-9 min-w-[200px] rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary-neutral)] outline-none transition-[border-color,background-color,box-shadow] placeholder:text-[var(--input-placeholder)] focus:border-[var(--input-focus-border)] focus:bg-[var(--input-bg-focus)] focus:ring-[3px] focus:ring-[color:var(--input-focus-ring)]" />
          <select name="status" defaultValue={params.status ?? ''}
            className="h-9 cursor-pointer rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary-neutral)] outline-none transition-[border-color,background-color,box-shadow] focus:border-[var(--input-focus-border)] focus:bg-[var(--input-bg-focus)] focus:ring-[3px] focus:ring-[color:var(--input-focus-ring)]">
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="awaiting_info">Awaiting Info</option>
            <option value="qualified">Qualified</option>
            <option value="rejected">Rejected</option>
            <option value="closed">Closed</option>
            <option value="converted">Converted</option>
          </select>
          <select name="source" defaultValue={params.source ?? ''}
            className="h-9 cursor-pointer rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary-neutral)] outline-none transition-[border-color,background-color,box-shadow] focus:border-[var(--input-focus-border)] focus:bg-[var(--input-bg-focus)] focus:ring-[3px] focus:ring-[color:var(--input-focus-ring)]">
            <option value="">All Sources</option>
            <option value="upwork">Upwork</option>
            <option value="fiverr">Fiverr</option>
            <option value="direct">Direct</option>
            <option value="referral">Referral</option>
            <option value="other">Other</option>
          </select>
          <select name="discipline" defaultValue={params.discipline ?? ''}
            className="h-9 cursor-pointer rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary-neutral)] outline-none transition-[border-color,background-color,box-shadow] focus:border-[var(--input-focus-border)] focus:bg-[var(--input-bg-focus)] focus:ring-[3px] focus:ring-[color:var(--input-focus-ring)]">
            <option value="">All Disciplines</option>
            <option value="mechanical">Mechanical</option>
            <option value="civil">Civil</option>
            <option value="structural">Structural</option>
            <option value="electrical">Electrical</option>
            <option value="other">Other</option>
          </select>
          <button type="submit" className="h-9 cursor-pointer rounded-md border border-[var(--input-border)] bg-[var(--surface-card)] px-3 text-sm font-medium text-[var(--text-secondary-neutral)] transition-colors hover:bg-[var(--surface-neutral)]">
            Filter
          </button>
          {hasActiveFilters && (
            <Link href="/leads" className="px-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] font-medium no-underline">
              Clear filters
            </Link>
          )}
        </FilterBar>
      </form>

      <SectionCard noPadding>
        {leads.length === 0 ? (
          <EmptyState
            compact={hasActiveFilters}
            icon={<Target size={hasActiveFilters ? 16 : 22} />}
            title={hasActiveFilters ? 'No leads match your filters' : 'No leads yet'}
            description={hasActiveFilters ? 'Try different criteria or clear filters.' : 'Log your first lead from Upwork, Fiverr, or a direct inquiry.'}
            action={
              hasActiveFilters
                ? <Link href="/leads" className="px-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] font-medium no-underline">Clear filters</Link>
                : <Link href="/leads/new" style={{ padding: '9px 18px', backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-fg)', borderRadius: 'var(--radius-control)', fontSize: '0.8125rem', fontWeight: 600, textDecoration: 'none' }}>New Lead</Link>
            }
          />
        ) : (
          <DataTable columns={leadsColumns(fxRate, clients, users)} data={leads} />
        )}
      </SectionCard>
    </div>
  )
}
