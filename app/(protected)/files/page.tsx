import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { getFiles, type FileWithRelations } from '@/lib/files/queries'
import { formatDate } from '@/lib/utils/formatters'
import { FolderOpen, Plus, ExternalLink, HardDrive } from 'lucide-react'

export const metadata = { title: 'Files — Engineering Agency OS' }

interface PageProps {
  searchParams: Promise<{ search?: string; file_category?: string; provider?: string; project_id?: string }>
}

const categoryLabels: Record<string, string> = {
  reference: 'Reference', draft: 'Draft', working_file: 'Working File',
  review_copy: 'Review Copy', final: 'Final', submission: 'Submission',
  supporting_document: 'Supporting Doc',
}

export default async function FilesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const files = await getFiles({
    search: params.search,
    file_category: params.file_category,
    provider: params.provider,
    project_id: params.project_id,
  }).catch(() => [] as FileWithRelations[])

  return (
    <div>
      <PageHeader
        title="Files"
        subtitle="File metadata and links attached to projects, tasks, and deliverables."
        actions={
          <Link
            href="/files/new"
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
            Add File
          </Link>
        }
      />

      {/* Filters */}
      <form method="GET" style={{ marginBottom: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <input
          name="search"
          type="search"
          defaultValue={params.search ?? ''}
          placeholder="Search files…"
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
          name="file_category"
          defaultValue={params.file_category ?? ''}
          style={{
            padding: '7px 11px',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            fontSize: '0.8125rem',
            backgroundColor: 'var(--color-surface)',
          }}
        >
          <option value="">All Categories</option>
          <option value="reference">Reference</option>
          <option value="draft">Draft</option>
          <option value="working_file">Working File</option>
          <option value="review_copy">Review Copy</option>
          <option value="final">Final</option>
          <option value="submission">Submission</option>
          <option value="supporting_document">Supporting Doc</option>
        </select>
        <select
          name="provider"
          defaultValue={params.provider ?? ''}
          style={{
            padding: '7px 11px',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            fontSize: '0.8125rem',
            backgroundColor: 'var(--color-surface)',
          }}
        >
          <option value="">All Providers</option>
          <option value="manual">Manual</option>
          <option value="google_drive">Google Drive</option>
        </select>
        <button type="submit" style={{
          padding: '7px 14px',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '6px',
          fontSize: '0.8125rem',
          cursor: 'pointer',
          color: 'var(--color-text-secondary)',
        }}>
          Filter
        </button>
        {(params.search || params.file_category || params.provider || params.project_id) && (
          <Link href="/files" style={{ padding: '7px 14px', fontSize: '0.8125rem', color: 'var(--color-text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            Clear
          </Link>
        )}
      </form>

      <SectionCard noPadding>
        {files.length === 0 ? (
          <EmptyState
            icon={<FolderOpen size={22} />}
            title="No files yet"
            description="Add file metadata to track project files, working documents, and deliverable attachments."
            action={
              <Link href="/files/new" style={{ padding: '8px 16px', backgroundColor: 'var(--color-primary)', color: '#fff', borderRadius: '6px', fontSize: '0.8125rem', fontWeight: 500, textDecoration: 'none' }}>
                Add First File
              </Link>
            }
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['File Name', 'Project', 'Category', 'Provider', 'Rev', 'Uploaded By', 'Added', 'Link'].map(h => (
                    <th key={h} style={{
                      padding: '10px 14px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600,
                      color: 'var(--color-text-muted)', backgroundColor: 'var(--color-surface-subtle)',
                      letterSpacing: '0.02em', textTransform: 'uppercase', whiteSpace: 'nowrap',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {files.map((f, idx) => {
                  const link = f.manual_link || f.google_web_view_link
                  return (
                    <tr key={f.id} style={{ borderBottom: idx < files.length - 1 ? '1px solid var(--color-border)' : undefined, cursor: 'pointer' }}>
                      <td style={{ padding: '10px 14px', maxWidth: '260px' }}>
                        <Link href={`/files/${f.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', fontSize: '0.8125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {f.file_name}
                          </span>
                          {f.extension && (
                            <span style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-surface-subtle)', padding: '0 4px', borderRadius: '3px', fontWeight: 600, textTransform: 'uppercase', flexShrink: 0 }}>
                              {f.extension}
                            </span>
                          )}
                        </Link>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        {f.projects ? (
                          <Link href={`/projects/${f.projects.id}`} style={{ textDecoration: 'none', color: 'var(--color-primary)', fontWeight: 500, fontSize: '0.75rem' }}>
                            {f.projects.project_code}
                          </Link>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                        {categoryLabels[f.file_category] ?? f.file_category}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '3px',
                          fontSize: '0.6875rem', fontWeight: 500,
                          color: f.provider === 'google_drive' ? '#2563EB' : '#94A3B8',
                          backgroundColor: f.provider === 'google_drive' ? '#DBEAFE' : '#F1F5F9',
                          padding: '2px 8px', borderRadius: '10px',
                        }}>
                          {f.provider === 'google_drive' ? <HardDrive size={10} /> : null}
                          {f.provider === 'google_drive' ? 'Drive' : 'Manual'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        {f.revision_number != null ? (
                          <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-primary)', backgroundColor: 'var(--color-surface-subtle)', padding: '1px 6px', borderRadius: '4px' }}>
                            R{f.revision_number}
                          </span>
                        ) : <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>—</span>}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                        {f.uploader?.full_name ?? '—'}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                        {formatDate(f.created_at)}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        {link ? (
                          <a href={link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>
                            <ExternalLink size={13} />
                          </a>
                        ) : <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  )
}
