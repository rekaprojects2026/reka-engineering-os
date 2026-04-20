import Link from 'next/link'
import { getSessionProfile } from '@/lib/auth/session'
import { canShowFilesAddButton, effectiveRole } from '@/lib/auth/permissions'
import { getViewableProjectIdsForUser } from '@/lib/projects/queries'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { FilterBar } from '@/components/shared/FilterBar'
import { DataTable } from '@/components/shared/DataTable'
import type { Column } from '@/components/shared/DataTable'
import { getFiles, type FileWithRelations } from '@/lib/files/queries'
import { formatDate } from '@/lib/utils/formatters'
import { FolderOpen, Plus, ExternalLink, HardDrive } from 'lucide-react'

export const metadata = { title: 'Files — ReKa Engineering OS' }

interface PageProps {
  searchParams: Promise<{ search?: string; file_category?: string; provider?: string; project_id?: string }>
}

const categoryLabels: Record<string, string> = {
  reference: 'Reference', draft: 'Draft', working_file: 'Working File',
  review_copy: 'Review Copy', final: 'Final', submission: 'Submission',
  supporting_document: 'Supporting Doc',
}

function fileColumns(): Column<FileWithRelations>[] {
  return [
    {
      key: 'file_name',
      header: 'File Name',
      render: (f) => (
        <Link href={`/files/${f.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', maxWidth: '260px' }}>
          <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', fontSize: '0.8125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {f.file_name}
          </span>
          {f.extension && (
            <span style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-surface-subtle)', padding: '0 4px', borderRadius: '3px', fontWeight: 600, textTransform: 'uppercase', flexShrink: 0 }}>
              {f.extension}
            </span>
          )}
        </Link>
      ),
    },
    {
      key: 'project',
      header: 'Project',
      render: (f) => (
        f.projects ? (
          <Link href={`/projects/${f.projects.id}`} style={{ textDecoration: 'none', color: 'var(--color-primary)', fontWeight: 500, fontSize: '0.75rem' }}>
            {f.projects.project_code}
          </Link>
        ) : '—'
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (f) => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
          {categoryLabels[f.file_category] ?? f.file_category}
        </span>
      ),
    },
    {
      key: 'provider',
      header: 'Provider',
      render: (f) => (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '3px',
          fontSize: '0.6875rem', fontWeight: 500,
          color: f.provider === 'google_drive' ? 'var(--color-primary)' : 'var(--color-neutral)',
          backgroundColor: f.provider === 'google_drive' ? 'var(--color-primary-subtle)' : 'var(--color-neutral-subtle)',
          padding: '2px 8px', borderRadius: 'var(--radius-pill)',
        }}>
          {f.provider === 'google_drive' ? <HardDrive size={10} aria-hidden="true" /> : null}
          {f.provider === 'google_drive' ? 'Drive' : 'Manual'}
        </span>
      ),
    },
    {
      key: 'rev',
      header: 'Rev',
      render: (f) => (
        f.revision_number != null ? (
          <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-primary)', backgroundColor: 'var(--color-surface-subtle)', padding: '1px 6px', borderRadius: '4px' }}>
            R{f.revision_number}
          </span>
        ) : <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>—</span>
      ),
    },
    {
      key: 'uploader',
      header: 'Uploaded By',
      render: (f) => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
          {f.uploader?.full_name ?? '—'}
        </span>
      ),
    },
    {
      key: 'created',
      header: 'Added',
      render: (f) => (
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
          {formatDate(f.created_at)}
        </span>
      ),
    },
    {
      key: 'link',
      header: 'Link',
      render: (f) => {
        const link = f.manual_link || f.google_web_view_link
        return link ? (
          <a href={link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>
            <ExternalLink size={13} aria-hidden="true" />
          </a>
        ) : <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>—</span>
      },
    },
  ]
}

export default async function FilesPage({ searchParams }: PageProps) {
  const profile = await getSessionProfile()
  const params = await searchParams
  const role = effectiveRole(profile.system_role)
  const viewableIds = await getViewableProjectIdsForUser(profile.id, profile.system_role)
  const restrict =
    role === 'admin' || viewableIds === null
      ? undefined
      : { userId: profile.id, projectIds: viewableIds }

  const files = await getFiles({
    search: params.search,
    file_category: params.file_category,
    provider: params.provider,
    project_id: params.project_id,
    restrictToUserPortfolio: restrict,
  }).catch(() => [] as FileWithRelations[])

  const hasActiveFilters = Boolean(params.search || params.file_category || params.provider || params.project_id)
  const showAdd = canShowFilesAddButton(profile.system_role)

  return (
    <div>
      <PageHeader
        title="Files"
        subtitle="File metadata and links attached to projects, tasks, and deliverables."
        actions={
          showAdd ? (
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

      <form method="GET">
        <FilterBar>
          <input name="search" type="search" defaultValue={params.search ?? ''} placeholder="Search files…" className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-colors min-w-[200px]" />
          <select name="file_category" defaultValue={params.file_category ?? ''} className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] cursor-pointer transition-colors">
            <option value="">All Categories</option>
            <option value="reference">Reference</option>
            <option value="draft">Draft</option>
            <option value="working_file">Working File</option>
            <option value="review_copy">Review Copy</option>
            <option value="final">Final</option>
            <option value="submission">Submission</option>
            <option value="supporting_document">Supporting Doc</option>
          </select>
          <select name="provider" defaultValue={params.provider ?? ''} className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] cursor-pointer transition-colors">
            <option value="">All Providers</option>
            <option value="manual">Manual</option>
            <option value="google_drive">Google Drive</option>
          </select>
          <button type="submit" className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] transition-colors whitespace-nowrap cursor-pointer">Filter</button>
          {hasActiveFilters && (
            <Link href="/files" className="px-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] font-medium transition-colors whitespace-nowrap no-underline">Clear filters</Link>
          )}
        </FilterBar>
      </form>

      <SectionCard noPadding>
        <FilesTable files={files} hasActiveFilters={hasActiveFilters} showAdd={showAdd} />
      </SectionCard>
    </div>
  )
}

function FilesTable({
  files,
  hasActiveFilters,
  showAdd,
}: {
  files: FileWithRelations[]
  hasActiveFilters: boolean
  showAdd: boolean
}) {
  if (files.length === 0) {
    if (hasActiveFilters) {
      return (
        <EmptyState
          compact
          icon={<FolderOpen size={16} strokeWidth={1.5} aria-hidden="true" />}
          title="No files match your filters"
          description="Try different criteria or clear filters to see all files you can access."
          action={<Link href="/files" className="inline-flex items-center px-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] font-medium transition-colors whitespace-nowrap no-underline">Clear filters</Link>}
        />
      )
    }
    return (
      <EmptyState
        emphasis
        icon={<FolderOpen size={24} strokeWidth={1.5} />}
        title="No files yet"
        description="Add file metadata to track project files, working documents, and deliverable attachments."
        action={
          showAdd ? (
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
          ) : undefined
        }
      />
    )
  }

  return <DataTable columns={fileColumns()} data={files} />
}
