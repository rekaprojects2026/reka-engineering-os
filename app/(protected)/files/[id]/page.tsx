import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getSessionProfile } from '@/lib/auth/session'
import { requireFileView, userCanEditFile } from '@/lib/auth/access-surface'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { EntityStatusStrip } from '@/components/shared/EntityStatusStrip'
import { getFileById } from '@/lib/files/queries'
import { formatDate } from '@/lib/utils/formatters'
import { Pencil, ExternalLink, HardDrive } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const f = await getFileById(id)
  return { title: f ? `${f.file_name} — ReKa Engineering OS` : 'File not found — ReKa Engineering OS' }
}

const categoryLabels: Record<string, string> = {
  reference: 'Reference', draft: 'Draft', working_file: 'Working File',
  review_copy: 'Review Copy', final: 'Final', submission: 'Submission',
  supporting_document: 'Supporting Document',
}

export default async function FileDetailPage({ params }: PageProps) {
  const { id } = await params
  const profile = await getSessionProfile()
  const f = await getFileById(id)
  if (!f) notFound()

  await requireFileView(profile, f)
  const showEditFile = await userCanEditFile(profile, f)

  const link = f.manual_link || f.google_web_view_link

  return (
    <div>
      <PageHeader
        title={f.file_name}
        subtitle={f.projects ? `${f.projects.project_code} · ${f.projects.name}` : 'No project'}
        actions={
          showEditFile ? (
            <Link
              href={`/files/${f.id}/edit`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)',
                fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)',
                textDecoration: 'none',
              }}
            >
              <Pencil size={13} aria-hidden="true" />
              Edit File
            </Link>
          ) : undefined
        }
      />

      <EntityStatusStrip
        statusBadge={(
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              fontSize: '0.6875rem', fontWeight: 600,
              color: f.provider === 'google_drive' ? 'var(--color-primary)' : 'var(--color-neutral)',
              backgroundColor: f.provider === 'google_drive' ? 'var(--color-primary-subtle)' : 'var(--color-neutral-subtle)',
              padding: '2px 10px', borderRadius: 'var(--radius-pill)',
            }}>
              {f.provider === 'google_drive' && <HardDrive size={11} aria-hidden="true" />}
              {f.provider === 'google_drive' ? 'Google Drive' : 'Manual Link'}
            </span>
            <span style={{
              fontSize: '0.6875rem', fontWeight: 600,
              color: 'var(--color-text-secondary)',
              backgroundColor: 'var(--color-surface-subtle)',
              padding: '2px 10px', borderRadius: '10px',
            }}>
              {categoryLabels[f.file_category] ?? f.file_category}
            </span>
            {f.extension && (
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-text-muted)', backgroundColor: 'var(--color-surface-subtle)', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                .{f.extension}
              </span>
            )}
            {f.revision_number != null && (
              <span style={{ fontFamily: 'monospace', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)', backgroundColor: 'var(--color-surface-subtle)', padding: '2px 10px', borderRadius: '4px' }}>
                Rev {f.revision_number}
              </span>
            )}
            {f.version_label && (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {f.version_label}
              </span>
            )}
          </span>
        )}
      />

      {/* Two-column */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <SectionCard title="Details">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <DetailRow label="Project">
                {f.projects ? (
                  <Link href={`/projects/${f.projects.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500, fontSize: '0.8125rem' }}>
                    {f.projects.name}
                  </Link>
                ) : '—'}
              </DetailRow>
              <DetailRow label="Uploaded By">{f.uploader?.full_name ?? '—'}</DetailRow>
              {f.tasks && (
                <DetailRow label="Linked Task">
                  <Link href={`/tasks/${f.tasks.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500, fontSize: '0.8125rem' }}>
                    {f.tasks.title}
                  </Link>
                </DetailRow>
              )}
              {f.deliverables && (
                <DetailRow label="Linked Deliverable">
                  <Link href={`/deliverables/${f.deliverables.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500, fontSize: '0.8125rem' }}>
                    {f.deliverables.name}
                  </Link>
                </DetailRow>
              )}
              <DetailRow label="MIME Type">{f.mime_type ?? '—'}</DetailRow>
            </div>
          </SectionCard>

          {f.notes && (
            <SectionCard title="Notes">
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                {f.notes}
              </p>
            </SectionCard>
          )}
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {link && (
            <SectionCard title="Open File">
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '0.8125rem', color: 'var(--color-primary)', textDecoration: 'none',
                  display: 'inline-flex', alignItems: 'center', gap: '4px', wordBreak: 'break-all',
                }}
              >
                <ExternalLink size={13} />
                {f.provider === 'google_drive' ? 'Open in Google Drive' : 'Open link'}
              </a>
            </SectionCard>
          )}
          <SectionCard title="Record Info">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <DetailRow label="Added">{formatDate(f.created_at)}</DetailRow>
              <DetailRow label="Last Updated">{formatDate(f.updated_at)}</DetailRow>
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
      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '3px', fontWeight: 500 }}>{label}</p>
      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>{children}</div>
    </div>
  )
}
