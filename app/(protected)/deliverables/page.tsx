import Link from 'next/link'
import type { CSSProperties } from 'react'
import { getSessionProfile } from '@/lib/auth/session'
import { canAccessTasksDeliverablesFilesNewRoute, effectiveRole } from '@/lib/auth/permissions'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { FilterBar } from '@/components/shared/FilterBar'
import { DeliverableStatusBadge } from '@/components/modules/deliverables/DeliverableStatusBadge'
import { getDeliverables, type DeliverableWithRelations } from '@/lib/deliverables/queries'
import { formatDate } from '@/lib/utils/formatters'
import { FileText, Plus, ExternalLink } from 'lucide-react'

const FI: CSSProperties = { padding: '7px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', fontSize: '0.8125rem', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)', outline: 'none', minWidth: '200px' }
const FS: CSSProperties = { padding: '7px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', fontSize: '0.8125rem', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)', cursor: 'pointer' }
const FB: CSSProperties = { padding: '7px 14px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' as const }
const FC: CSSProperties = { padding: '7px 10px', fontSize: '0.8125rem', color: 'var(--color-text-muted)', textDecoration: 'none', fontWeight: 500, whiteSpace: 'nowrap' as const }

export const metadata = { title: 'Deliverables — Engineering Agency OS' }

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string; type?: string; project_id?: string }>
}

export default async function DeliverablesPage({ searchParams }: PageProps) {
  const profile = await getSessionProfile()
  const role = effectiveRole(profile.system_role)
  const params = await searchParams

  const scopeOpts =
    role === 'member'      ? { scopePreparerId: profile.id } :
    role === 'reviewer'    ? { scopeReviewerId: profile.id } :
    role === 'coordinator' ? { scopeProjectUserId: profile.id } :
    {}

  const deliverables = await getDeliverables({
    search: params.search,
    status: params.status,
    type: params.type,
    project_id: params.project_id,
    ...scopeOpts,
  }).catch(() => [] as DeliverableWithRelations[])

  const pageTitle = role === 'member' ? 'My Deliverables' : 'Deliverables'
  const pageSubtitle = role === 'member'
    ? 'Deliverables you prepared.'
    : role === 'reviewer'
      ? 'Deliverables assigned to you for review.'
      : role === 'coordinator'
        ? 'Deliverables in your assigned projects.'
        : 'Project outputs tracked through review, revision, and final issuance.'
  const canCreate = canAccessTasksDeliverablesFilesNewRoute(profile.system_role)

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

      {/* Filters */}
      <form method="GET">
        <FilterBar>
          <input name="search" type="search" defaultValue={params.search ?? ''} placeholder="Search deliverables…" style={FI} />
          <select name="status" defaultValue={params.status ?? ''} style={FS}>
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="internal_review">Internal Review</option>
            <option value="ready_to_submit">Ready to Submit</option>
            <option value="sent_to_client">Sent to Client</option>
            <option value="revision_requested">Revision Requested</option>
            <option value="approved">Approved</option>
            <option value="final_issued">Final Issued</option>
          </select>
          <select name="type" defaultValue={params.type ?? ''} style={FS}>
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
          <button type="submit" style={FB}>Filter</button>
          {(params.search || params.status || params.type || params.project_id) && (
            <Link href="/deliverables" style={FC}>Clear filters</Link>
          )}
        </FilterBar>
      </form>

      {/* Table */}
      <SectionCard noPadding>
        <DeliverablesTable deliverables={deliverables} />
      </SectionCard>
    </div>
  )
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

function DeliverablesTable({ deliverables }: { deliverables: DeliverableWithRelations[] }) {
  if (deliverables.length === 0) {
    return (
      <EmptyState
        emphasis
        icon={<FileText size={24} strokeWidth={1.5} />}
        title="No deliverables yet"
        description="Create your first deliverable to start tracking project outputs, revisions, and client submissions."
        action={
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
        }
      />
    )
  }

  const headers = ['Deliverable', 'Project', 'Type', 'Rev', 'Prepared By', 'Status', 'Submitted', 'File']

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
          {deliverables.map((d, idx) => {
            const isRevisionRequested = d.status === 'revision_requested'

            return (
              <tr
                key={d.id}
                style={{
                  borderBottom: idx < deliverables.length - 1 ? '1px solid var(--color-border)' : undefined,
                  backgroundColor: 'var(--color-surface)',
                  boxShadow: isRevisionRequested ? 'inset 3px 0 0 var(--color-danger)' : undefined,
                  cursor: 'pointer',
                }}
              >
                {/* Name */}
                <td style={{ padding: '10px 14px', maxWidth: '260px' }}>
                  <Link href={`/deliverables/${d.id}`} style={{ textDecoration: 'none' }}>
                    <span style={{
                      fontWeight: 500,
                      color: 'var(--color-text-primary)',
                      fontSize: '0.8125rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'block',
                    }}>
                      {d.name}
                    </span>
                  </Link>
                </td>
                {/* Project */}
                <td style={{ padding: '10px 14px' }}>
                  {d.projects ? (
                    <Link href={`/projects/${d.projects.id}`} style={{ textDecoration: 'none', color: 'var(--color-primary)', fontWeight: 500, fontSize: '0.75rem' }}>
                      {d.projects.project_code}
                    </Link>
                  ) : '—'}
                </td>
                {/* Type */}
                <td style={{ padding: '10px 14px', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                  {typeLabels[d.type] ?? d.type}
                </td>
                {/* Rev */}
                <td style={{ padding: '10px 14px' }}>
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
                </td>
                {/* Prepared By */}
                <td style={{ padding: '10px 14px', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                  {d.preparer?.full_name ?? '—'}
                </td>
                {/* Status */}
                <td style={{ padding: '10px 14px' }}>
                  <DeliverableStatusBadge status={d.status} />
                </td>
                {/* Submitted */}
                <td style={{ padding: '10px 14px', fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                  {formatDate(d.submitted_to_client_date)}
                </td>
                {/* File */}
                <td style={{ padding: '10px 14px' }}>
                  {d.file_link ? (
                    <a
                      href={d.file_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink size={13} />
                    </a>
                  ) : (
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>—</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
