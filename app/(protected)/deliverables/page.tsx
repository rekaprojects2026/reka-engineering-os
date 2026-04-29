import Link from 'next/link'
import { getSessionProfile } from '@/lib/auth/session'
import {
  canAccessTasksDeliverablesFilesNewRoute,
  effectiveRole,
  isFreelancer,
  isManajer,
  isSenior,
} from '@/lib/auth/permissions'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { FilterBar } from '@/components/shared/FilterBar'
import { DataTable } from '@/components/shared/DataTable'
import type { Column } from '@/components/shared/DataTable'
import { DeliverableStatusBadge } from '@/components/modules/deliverables/DeliverableStatusBadge'
import { getViewableProjectIdsForUser } from '@/lib/projects/queries'
import { getDeliverables, type DeliverableWithRelations } from '@/lib/deliverables/queries'
import { formatDate } from '@/lib/utils/formatters'
import { FileText, Plus, ExternalLink } from 'lucide-react'

export const metadata = { title: 'Deliverables — ReKa Engineering OS' }

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string; type?: string; project_id?: string }>
}

const typeLabels: Record<string, string> = {
  drawing: 'Drawing',
  '3d_model': '3D Model',
  report: 'Report',
  boq: 'BOQ',
  calculation_sheet: 'Calc Sheet',
  presentation: 'Presentation',
  specification: 'Specification',
  revision_package: 'Rev Package',
  submission_package: 'Sub Package',
}

function deliverableColumns(): Column<DeliverableWithRelations>[] {
  return [
    {
      key: 'name',
      header: 'Deliverable',
      render: (d) => (
        <Link href={`/deliverables/${d.id}`} style={{ textDecoration: 'none' }}>
          <span style={{
            fontWeight: 500,
            color: 'var(--color-text-primary)',
            fontSize: '0.8125rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'block',
            maxWidth: '260px',
          }}>
            {d.name}
          </span>
        </Link>
      ),
    },
    {
      key: 'project',
      header: 'Project',
      render: (d) => (
        d.projects ? (
          <Link href={`/projects/${d.projects.id}`} style={{ textDecoration: 'none', color: 'var(--color-primary)', fontWeight: 500, fontSize: '0.75rem' }}>
            {d.projects.project_code}
          </Link>
        ) : '—'
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (d) => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
          {typeLabels[d.type] ?? d.type}
        </span>
      ),
    },
    {
      key: 'rev',
      header: 'Rev',
      render: (d) => (
        <span>
          <span style={{
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            backgroundColor: 'var(--color-surface-subtle)',
            padding: '1px 6px',
            borderRadius: '4px',
          }}>
            R{d.revision_number}
          </span>
          {d.version_label && (
            <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginLeft: '4px' }}>
              {d.version_label}
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'preparer',
      header: 'Prepared By',
      render: (d) => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
          {d.preparer?.full_name ?? '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (d) => <DeliverableStatusBadge status={d.status} />,
    },
    {
      key: 'submitted',
      header: 'Submitted',
      render: (d) => (
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
          {formatDate(d.submitted_to_client_date)}
        </span>
      ),
    },
    {
      key: 'file',
      header: 'File',
      render: (d) => (
        d.file_link ? (
          <a
            href={d.file_link}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center' }}
          >
            <ExternalLink size={13} aria-hidden="true" />
          </a>
        ) : (
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>—</span>
        )
      ),
    },
  ]
}

export default async function DeliverablesPage({ searchParams }: PageProps) {
  const profile = await getSessionProfile()
  const role = effectiveRole(profile.system_role)
  const params = await searchParams

  const scopeOpts =
    role === 'member' || isFreelancer(role)
      ? { scopePreparerId: profile.id }
      : isSenior(role)
        ? { scopeReviewerId: profile.id }
        : role === 'manajer'
          ? { scopeProjectIds: (await getViewableProjectIdsForUser(profile.id, profile.system_role)) ?? [] }
          : {}

  const deliverables = await getDeliverables({
    search: params.search,
    status: params.status,
    type: params.type,
    project_id: params.project_id,
    ...scopeOpts,
  }).catch(() => [] as DeliverableWithRelations[])

  const pageTitle = role === 'member' || isFreelancer(role) ? 'My Deliverables' : 'Deliverables'
  const pageSubtitle =
    role === 'member' || isFreelancer(role)
      ? 'Deliverables you prepared.'
      : isSenior(role)
        ? 'Deliverables assigned to you for review.'
        : role === 'manajer'
          ? 'Deliverables in your assigned projects.'
          : 'Project outputs tracked through review, revision, and final issuance.'
  const canCreate = canAccessTasksDeliverablesFilesNewRoute(profile.system_role)
  const hasActiveFilters = Boolean(params.search || params.status || params.type || params.project_id)

  return (
    <div>
      <PageHeader
        title={pageTitle}
        subtitle={pageSubtitle}
        actions={
          canCreate ? <Link
            href="/deliverables/new"
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
            New Deliverable
          </Link> : undefined
        }
      />

      <form method="GET">
        <FilterBar>
          <input name="search" type="search" defaultValue={params.search ?? ''} placeholder="Search deliverables…" className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-colors min-w-[200px]" />
          <select name="status" defaultValue={params.status ?? ''} className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] cursor-pointer transition-colors">
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="internal_review">Internal Review</option>
            <option value="ready_to_submit">Ready to Submit</option>
            <option value="sent_to_client">Sent to Client</option>
            <option value="revision_requested">Revision Requested</option>
            <option value="approved">Approved</option>
            <option value="final_issued">Final Issued</option>
          </select>
          <select name="type" defaultValue={params.type ?? ''} className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] cursor-pointer transition-colors">
            <option value="">All Types</option>
            <option value="drawing">Drawing</option>
            <option value="3d_model">3D Model</option>
            <option value="report">Report</option>
            <option value="boq">BOQ</option>
            <option value="calculation_sheet">Calculation Sheet</option>
            <option value="presentation">Presentation</option>
            <option value="specification">Specification</option>
            <option value="revision_package">Revision Package</option>
            <option value="submission_package">Submission Package</option>
          </select>
          <button type="submit" className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] transition-colors whitespace-nowrap cursor-pointer">Filter</button>
          {hasActiveFilters && (
            <Link href="/deliverables" className="px-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] font-medium transition-colors whitespace-nowrap no-underline">Clear filters</Link>
          )}
        </FilterBar>
      </form>

      <SectionCard noPadding>
        <DeliverablesTable
          deliverables={deliverables}
          hasActiveFilters={hasActiveFilters}
          canCreate={canCreate}
        />
      </SectionCard>
    </div>
  )
}

function DeliverablesTable({
  deliverables,
  hasActiveFilters,
  canCreate,
}: {
  deliverables: DeliverableWithRelations[]
  hasActiveFilters: boolean
  canCreate: boolean
}) {
  if (deliverables.length === 0) {
    if (hasActiveFilters) {
      return (
        <EmptyState
          compact
          icon={<FileText size={16} strokeWidth={1.5} aria-hidden="true" />}
          title="No deliverables match your filters"
          description="Try different criteria or clear filters to see all deliverables in scope."
          action={<Link href="/deliverables" className="inline-flex items-center px-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] font-medium transition-colors whitespace-nowrap no-underline">Clear filters</Link>}
        />
      )
    }
    return (
      <EmptyState
        emphasis
        icon={<FileText size={24} strokeWidth={1.5} />}
        title="No deliverables yet"
        description="Create your first deliverable to start tracking project outputs, revisions, and client submissions."
        action={
          canCreate ? (
            <Link
              href="/deliverables/new"
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
              Create first deliverable
            </Link>
          ) : undefined
        }
      />
    )
  }

  return (
    <DataTable
      columns={deliverableColumns()}
      data={deliverables}
      getRowStyle={(d) => (d.status === 'revision_requested' ? { boxShadow: 'inset 3px 0 0 var(--color-danger)' } : undefined)}
    />
  )
}
