import Link from 'next/link'
import type { CSSProperties } from 'react'
import { getSessionProfile } from '@/lib/auth/session'
import { canShowFilesAddButton } from '@/lib/auth/permissions'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { FilterBar } from '@/components/shared/FilterBar'
import { getFiles, type FileWithRelations } from '@/lib/files/queries'
import { formatDate } from '@/lib/utils/formatters'
import { FolderOpen, Plus, ExternalLink, HardDrive } from 'lucide-react'

const FI: CSSProperties = { padding: '7px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', fontSize: '0.8125rem', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)', outline: 'none', minWidth: '200px' }
const FS: CSSProperties = { padding: '7px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', fontSize: '0.8125rem', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)', cursor: 'pointer' }
const FB: CSSProperties = { padding: '7px 14px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' as const }
const FC: CSSProperties = { padding: '7px 10px', fontSize: '0.8125rem', color: 'var(--color-text-muted)', textDecoration: 'none', fontWeight: 500, whiteSpace: 'nowrap' as const }

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
  const profile = await getSessionProfile()
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
          canShowFilesAddButton(profile.system_role) ? (
            <Link
              href="/files/new"
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
              Add File
            </Link>
          ) : undefined
        }
      />

      {/* Filters */}
      <form method="GET">
        <FilterBar>
          <input name="search" type="search" defaultValue={params.search ?? ''} placeholder="Search files…" style={FI} />
          <select name="file_category" defaultValue={params.file_category ?? ''} style={FS}>
            <option value="">All Categories</option>
            <option value="reference">Reference</option>
            <option value="draft">Draft</option>
            <option value="working_file">Working File</option>
            <option value="review_copy">Review Copy</option>
            <option value="final">Final</option>
            <option value="submission">Submission</option>
            <option value="supporting_document">Supporting Doc</option>
          </select>
          <select name="provider" defaultValue={params.provider ?? ''} style={FS}>
            <option value="">All Providers</option>
            <option value="manual">Manual</option>
            <option value="google_drive">Google Drive</option>
          </select>
          <button type="submit" style={FB}>Filter</button>
          {(params.search || params.file_category || params.provider || params.project_id) && (
            <Link href="/files" style={FC}>Clear filters</Link>
          )}
        </FilterBar>
      </form>

      <SectionCard noPadding>
        {files.length === 0 ? (
          <EmptyState
            emphasis
            icon={<FolderOpen size={24} strokeWidth={1.5} />}
            title="No files yet"
            description="Add file metadata to track project files, working documents, and deliverable attachments."
            action={
              <Link
                href="/files/new"
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
                Add first file
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
                          color: f.provider === 'google_drive' ? 'var(--color-primary)' : 'var(--color-neutral)',
                          backgroundColor: f.provider === 'google_drive' ? 'var(--color-primary-subtle)' : 'var(--color-neutral-subtle)',
                          padding: '2px 8px', borderRadius: 'var(--radius-pill)',
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
