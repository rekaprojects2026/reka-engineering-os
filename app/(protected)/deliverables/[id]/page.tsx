import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getSessionProfile } from '@/lib/auth/session'
import { requireDeliverableView, userCanEditDeliverable } from '@/lib/auth/access-surface'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { EntityStatusStrip } from '@/components/shared/EntityStatusStrip'
import { DeliverableStatusBadge } from '@/components/modules/deliverables/DeliverableStatusBadge'
import { getDeliverableById } from '@/lib/deliverables/queries'
import { formatDate } from '@/lib/utils/formatters'
import {
  Pencil,
  ExternalLink,
} from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const d = await getDeliverableById(id)
  return { title: d ? `${d.name} — Engineering Agency OS` : 'Deliverable Not Found' }
}

const typeLabels: Record<string, string> = {
  drawing: 'Drawing',
  '3d_model': '3D Model',
  report: 'Report',
  boq: 'BOQ',
  calculation_sheet: 'Calculation Sheet',
  presentation: 'Presentation',
  specification: 'Specification',
  revision_package: 'Revision Package',
  submission_package: 'Submission Package',
}

export default async function DeliverableDetailPage({ params }: PageProps) {
  const { id } = await params
  const profile = await getSessionProfile()
  const d = await getDeliverableById(id)
  if (!d) notFound()

  await requireDeliverableView(profile, d)
  const showEditDeliverable = await userCanEditDeliverable(profile, d)

  const isRevisionRequested = d.status === 'revision_requested'

  return (
    <div>
      {/* Header */}
      <PageHeader
        title={d.name}
        subtitle={d.projects ? `${d.projects.project_code} · ${d.projects.name}` : 'No project'}
        actions={
          showEditDeliverable ? (
            <Link
              href={`/deliverables/${d.id}/edit`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-control)',
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: 'var(--color-text-secondary)',
                textDecoration: 'none',
              }}
            >
              <Pencil size={13} aria-hidden="true" />
              Edit Deliverable
            </Link>
          ) : undefined
        }
      />

      <EntityStatusStrip
        statusBadge={<DeliverableStatusBadge status={d.status} />}
        extraBadge={
          <>
            <span style={{
              fontFamily: 'monospace',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              backgroundColor: 'var(--color-surface-subtle)',
              padding: '2px 10px',
              borderRadius: '4px',
            }}>
              Rev {d.revision_number}
            </span>
            {d.version_label && (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {d.version_label}
              </span>
            )}
            {isRevisionRequested && (
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--color-danger)',
                backgroundColor: 'var(--color-danger-subtle)',
                padding: '2px 10px',
                borderRadius: 'var(--radius-pill)',
              }}>
                Revision Requested
              </span>
            )}
          </>
        }
      />

      {/* Two-column detail */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Overview */}
          <SectionCard title="Overview">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <DetailRow label="Project">
                {d.projects ? (
                  <Link href={`/projects/${d.projects.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500, fontSize: '0.8125rem' }}>
                    {d.projects.name}
                  </Link>
                ) : '—'}
              </DetailRow>
              <DetailRow label="Type">
                {typeLabels[d.type] ?? d.type}
              </DetailRow>
              <DetailRow label="Prepared By">{d.preparer?.full_name ?? '—'}</DetailRow>
              <DetailRow label="Reviewed By">
                {d.reviewer_profile?.full_name ?? <span style={{ color: 'var(--color-text-muted)' }}>Not assigned</span>}
              </DetailRow>
              {d.linked_task && (
                <DetailRow label="Linked Task">
                  <Link href={`/tasks/${d.linked_task.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500, fontSize: '0.8125rem' }}>
                    {d.linked_task.title}
                  </Link>
                </DetailRow>
              )}
            </div>
          </SectionCard>

          {/* Description */}
          {d.description && (
            <SectionCard title="Description">
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                {d.description}
              </p>
            </SectionCard>
          )}

          {/* Client Feedback */}
          {d.client_feedback_summary && (
            <SectionCard title="Client Feedback">
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                {d.client_feedback_summary}
              </p>
            </SectionCard>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Timeline */}
          <SectionCard title="Timeline">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <DetailRow label="Submitted to Client">{formatDate(d.submitted_to_client_date)}</DetailRow>
              <DetailRow label="Approved">{formatDate(d.approved_date)}</DetailRow>
            </div>
          </SectionCard>

          {/* File */}
          {d.file_link && (
            <SectionCard title="File Link">
              <a
                href={d.file_link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--color-primary)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  wordBreak: 'break-all',
                }}
              >
                <ExternalLink size={13} aria-hidden="true" />
                Open file
              </a>
            </SectionCard>
          )}

          {/* Record Info */}
          <SectionCard title="Record Info">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <DetailRow label="Created">{formatDate(d.created_at)}</DetailRow>
              <DetailRow label="Last Updated">{formatDate(d.updated_at)}</DetailRow>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '3px', fontWeight: 500 }}>
        {label}
      </p>
      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>{children}</div>
    </div>
  )
}
