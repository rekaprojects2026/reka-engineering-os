import Link from 'next/link'
import { getSessionProfile, requireRole } from '@/lib/auth/session'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { FilterBar } from '@/components/shared/FilterBar'
import { DataTable } from '@/components/shared/DataTable'
import type { Column } from '@/components/shared/DataTable'
import { getOutreachCompanies } from '@/lib/outreach/queries'
import type { OutreachWithIntake } from '@/lib/outreach/queries'
import { updateOutreachStatus, deleteOutreachCompany, convertOutreachToLead } from '@/lib/outreach/actions'
import { formatDate } from '@/lib/utils/formatters'
import { Megaphone, Plus } from 'lucide-react'
import { OutreachActions } from '@/components/modules/outreach/OutreachActions'

export const metadata = { title: 'Outreach — ReKa Engineering OS' }

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string; channel?: string }>
}

const OUTREACH_STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  to_contact:    { bg: '#f1f5f9', color: '#64748b', label: 'To Contact' },
  contacted:     { bg: '#eff6ff', color: '#2563eb', label: 'Contacted' },
  replied:       { bg: '#f0fdf4', color: '#16a34a', label: 'Replied' },
  in_discussion: { bg: '#fefce8', color: '#ca8a04', label: 'In Discussion' },
  converted:     { bg: '#f0fdf4', color: '#059669', label: 'Converted' },
  declined:      { bg: '#fef2f2', color: '#dc2626', label: 'Declined' },
}

function OutreachStatusBadge({ status }: { status: string }) {
  const s = OUTREACH_STATUS_STYLES[status] ?? OUTREACH_STATUS_STYLES.to_contact
  return (
    <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

function outreachColumns(
  onStatusChange: (id: string, status: string) => Promise<void>,
  onDelete: (id: string) => Promise<void>,
  onConvert: (id: string) => Promise<void>,
): Column<OutreachWithIntake>[] {
  return [
    {
      key: 'company',
      header: 'Company',
      render: (o) => (
        <div>
          <p style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>{o.company_name}</p>
          {o.contact_person && <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{o.contact_person}</p>}
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (o) => (
        <div>
          {o.contact_channel && (
            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>{o.contact_channel}</span>
          )}
          {o.contact_value && <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{o.contact_value}</p>}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (o) => <OutreachStatusBadge status={o.status} />,
    },
    {
      key: 'last_contact',
      header: 'Last Contact',
      render: (o) => <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{formatDate(o.last_contact_date)}</span>,
    },
    {
      key: 'followup',
      header: 'Follow Up',
      render: (o) => {
        if (!o.next_followup_date) return <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>—</span>
        const isOverdue = o.next_followup_date < new Date().toISOString().split('T')[0]
        return (
          <span style={{ fontSize: '0.75rem', color: isOverdue ? 'var(--color-warning)' : 'var(--color-text-muted)', fontWeight: isOverdue ? 600 : 400, whiteSpace: 'nowrap' }}>
            {formatDate(o.next_followup_date)}
          </span>
        )
      },
    },
    {
      key: 'lead_link',
      header: 'Lead',
      render: (o) => o.converted_intake_id && o.intakes ? (
        <Link href={`/leads/${o.converted_intake_id}`} style={{ fontSize: '0.75rem', color: 'var(--color-primary)', textDecoration: 'none' }}>
          {o.intakes.intake_code}
        </Link>
      ) : <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>—</span>,
    },
    {
      key: 'notes',
      header: 'Notes',
      render: (o) => (
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
          {o.notes ?? '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (o) => (
        <OutreachActions
          company={o}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
          onConvert={onConvert}
        />
      ),
    },
  ]
}

export default async function OutreachPage({ searchParams }: PageProps) {
  const sp = await getSessionProfile()
  requireRole(sp.system_role, ['bd', 'direktur', 'technical_director'])

  const params = await searchParams
  const companies = await getOutreachCompanies({
    search: params.search,
    status: params.status,
    channel: params.channel,
  }).catch(() => [] as OutreachWithIntake[])

  const hasActiveFilters = Boolean(params.search || params.status || params.channel)

  // Status summary
  const summary = companies.reduce((acc, c) => { acc[c.status] = (acc[c.status] ?? 0) + 1; return acc }, {} as Record<string, number>)

  async function handleStatusChange(id: string, status: string) { 'use server'; await updateOutreachStatus(id, status) }
  async function handleDelete(id: string) { 'use server'; await deleteOutreachCompany(id) }
  async function handleConvert(id: string) { 'use server'; await convertOutreachToLead(id) }

  return (
    <div>
      <PageHeader
        title="Outreach"
        subtitle="Track companies to reach out to for new business before they become leads."
        actions={
          <Link
            href="/outreach/new"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-fg)', borderRadius: 'var(--radius-control)', fontSize: '0.8125rem', fontWeight: 500, textDecoration: 'none' }}
          >
            <Plus size={14} /> Add Company
          </Link>
        }
      />

      {/* Status overview chips */}
      {companies.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          {Object.entries(OUTREACH_STATUS_STYLES).map(([key, style]) => {
            const count = summary[key] ?? 0
            if (count === 0) return null
            return (
              <span key={key} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: style.bg, color: style.color }}>
                {style.label}
                <span style={{ backgroundColor: style.color, color: style.bg, borderRadius: '999px', padding: '0 5px', fontSize: '0.625rem' }}>{count}</span>
              </span>
            )
          })}
        </div>
      )}

      <form method="GET">
        <FilterBar>
          <input name="search" type="search" defaultValue={params.search ?? ''} placeholder="Search companies…"
            className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm placeholder:text-[var(--color-text-muted)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] min-w-[200px]" />
          <select name="status" defaultValue={params.status ?? ''}
            className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)] cursor-pointer">
            <option value="">All Statuses</option>
            <option value="to_contact">To Contact</option>
            <option value="contacted">Contacted</option>
            <option value="replied">Replied</option>
            <option value="in_discussion">In Discussion</option>
            <option value="converted">Converted</option>
            <option value="declined">Declined</option>
          </select>
          <select name="channel" defaultValue={params.channel ?? ''}
            className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)] cursor-pointer">
            <option value="">All Channels</option>
            <option value="upwork">Upwork</option>
            <option value="linkedin">LinkedIn</option>
            <option value="email">Email</option>
            <option value="instagram">Instagram</option>
            <option value="direct">Direct</option>
            <option value="other">Other</option>
          </select>
          <button type="submit" className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-medium hover:bg-[var(--color-surface-muted)] cursor-pointer">Filter</button>
          {hasActiveFilters && <Link href="/outreach" className="px-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] font-medium no-underline">Clear</Link>}
        </FilterBar>
      </form>

      <SectionCard noPadding>
        {companies.length === 0 ? (
          <EmptyState
            compact={hasActiveFilters}
            icon={<Megaphone size={hasActiveFilters ? 16 : 22} />}
            title={hasActiveFilters ? 'No companies match' : 'No outreach tracked yet'}
            description={hasActiveFilters ? 'Try different filters.' : 'Add companies you want to reach out to for new business opportunities.'}
            action={!hasActiveFilters ? (
              <Link href="/outreach/new" style={{ padding: '9px 18px', backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-fg)', borderRadius: 'var(--radius-control)', fontSize: '0.8125rem', fontWeight: 600, textDecoration: 'none' }}>Add First Company</Link>
            ) : undefined}
          />
        ) : (
          <DataTable columns={outreachColumns(handleStatusChange, handleDelete, handleConvert)} data={companies} />
        )}
      </SectionCard>
    </div>
  )
}
