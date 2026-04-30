import Link from 'next/link'
import { Suspense } from 'react'
import { getSessionProfile } from '@/lib/auth/session'
import {
  canAccessProjectsNewRoute,
  effectiveRole,
  isDirektur,
  isFreelancer,
  isSenior,
} from '@/lib/auth/permissions'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { FilterBar } from '@/components/shared/FilterBar'
import { ProjectsViewToggle } from '@/components/modules/projects/ProjectsViewToggle'
import { getProjects, getPendingApprovalProjectsForList } from '@/lib/projects/queries'
import { getSettingOptions } from '@/lib/settings/queries'
import { updateProjectStatus } from '@/lib/projects/actions'
import type { ProjectWithRelations } from '@/lib/projects/queries'
import { FolderKanban, Plus } from 'lucide-react'
import { parsePagination, totalPages } from '@/lib/utils/pagination'
import { Pagination } from '@/components/shared/Pagination'

export const metadata = { title: 'Projects — ReKa Engineering OS' }

interface PageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    discipline?: string
    priority?: string
    page?: string
    pageSize?: string
  }>
}

export default async function ProjectsPage({ searchParams }: PageProps) {
  const profile = await getSessionProfile()
  const role    = effectiveRole(profile.system_role)
  const params  = await searchParams
  const { page, pageSize } = parsePagination(params)

  const scopeOpts =
    role === 'member' || role === 'freelancer' ? { assignedUserId: profile.id } :
    role === 'manajer' ? { assignedUserId: profile.id } :
    role === 'senior' ? { reviewerUserId: profile.id } :
    {}

  const [projectList, disciplineFilterOptions] = await Promise.all([
    getProjects({
      search: params.search,
      status: params.status,
      discipline: params.discipline,
      priority: params.priority,
      page,
      pageSize,
      ...scopeOpts,
    }).catch(() => ({ rows: [] as ProjectWithRelations[], count: 0 })),
    getSettingOptions('discipline'),
  ])

  const projects = projectList.rows
  const projectTotalCount = projectList.count

  const pendingApproval = isDirektur(profile.system_role)
    ? await getPendingApprovalProjectsForList().catch(() => [])
    : []

  const pageTitle = role === 'member' ? 'My Projects' : 'Projects'
  const pageSubtitle =
    role === 'member' || isFreelancer(role) ? 'Projects you are assigned to.' :
    isSenior(role) ? 'Projects where you are assigned as reviewer.' :
    role === 'manajer' ? 'Projects in your operational scope.' :
    'Active and historical engineering project work.'

  const hasActiveFilters = Boolean(params.search || params.status || params.discipline || params.priority)
  const canCreate = canAccessProjectsNewRoute(profile.system_role)

  async function handleStatusUpdate(projectId: string, newStatus: string) {
    'use server'
    await updateProjectStatus(projectId, newStatus)
  }

  return (
    <div>
      <PageHeader
        title={pageTitle}
        subtitle={pageSubtitle}
        actions={
          canCreate ? (
            <Link
              href="/projects/new"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-fg)', borderRadius: 'var(--radius-control)', fontSize: '0.8125rem', fontWeight: 500, textDecoration: 'none' }}
            >
              <Plus size={14} /> New Project
            </Link>
          ) : undefined
        }
      />

      {pendingApproval.length > 0 ? (
        <div
          className="mb-4 rounded-lg border px-4 py-3"
          style={{
            borderColor: 'var(--color-border-strong)',
            backgroundColor: 'var(--color-warning-subtle)',
          }}
        >
          <p className="m-0 text-[0.8125rem] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Perlu perhatian: {pendingApproval.length} project menunggu persetujuan Anda
          </p>
          <ul className="mt-2 mb-0 list-none space-y-1 p-0">
            {pendingApproval.slice(0, 5).map((p) => (
              <li key={p.id}>
                <Link
                  href={`/projects/${p.id}`}
                  className="text-[0.8125rem] font-medium text-[var(--color-primary)] no-underline hover:underline"
                >
                  {p.project_code ? `${p.project_code} · ` : ''}
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
          {pendingApproval.length > 5 ? (
            <p className="mt-2 mb-0 text-[0.75rem]" style={{ color: 'var(--color-text-muted)' }}>
              Dan {pendingApproval.length - 5} lainnya — saring status &quot;Pending Approval&quot; untuk daftar penuh.
            </p>
          ) : null}
        </div>
      ) : null}

      <form method="GET">
        <FilterBar>
          <input name="search" type="search" defaultValue={params.search ?? ''} placeholder="Search projects…"
            className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm placeholder:text-[var(--color-text-muted)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] min-w-[200px]" />
          <select name="status" defaultValue={params.status ?? ''}
            className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)] cursor-pointer">
            <option value="">All Statuses</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="rejected">Rejected</option>
            <option value="new">New</option>
            <option value="ready_to_start">Ready to Start</option>
            <option value="ongoing">Ongoing</option>
            <option value="internal_review">Internal Review</option>
            <option value="waiting_client">Waiting Client</option>
            <option value="in_revision">In Revision</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select name="discipline" defaultValue={params.discipline ?? ''}
            className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)] cursor-pointer">
            <option value="">All Disciplines</option>
            {disciplineFilterOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select name="priority" defaultValue={params.priority ?? ''}
            className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)] cursor-pointer">
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <button type="submit" className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-medium hover:bg-[var(--color-surface-muted)] cursor-pointer">
            Filter
          </button>
          {hasActiveFilters && (
            <Link href="/projects" className="px-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] font-medium no-underline">
              Clear filters
            </Link>
          )}
        </FilterBar>
      </form>

      <SectionCard noPadding>
        {projects.length === 0 ? (
          <EmptyState
            compact={hasActiveFilters}
            icon={<FolderKanban size={hasActiveFilters ? 16 : 22} />}
            title={hasActiveFilters ? 'No projects match your filters' : 'No projects yet'}
            description={hasActiveFilters ? 'Try different criteria or clear filters.' : 'Create your first project to start tracking engineering work.'}
            action={
              hasActiveFilters
                ? <Link href="/projects" className="px-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] font-medium no-underline">Clear filters</Link>
                : canCreate
                  ? <Link href="/projects/new" style={{ padding: '9px 18px', backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-fg)', borderRadius: 'var(--radius-control)', fontSize: '0.8125rem', fontWeight: 600, textDecoration: 'none' }}>Create first project</Link>
                  : undefined
            }
          />
        ) : (
          <ProjectsViewToggle projects={projects} onStatusUpdate={handleStatusUpdate} />
        )}
      </SectionCard>
      <Suspense fallback={null}>
        <Pagination
          currentPage={page}
          totalPages={totalPages(projectTotalCount, pageSize)}
          pageSize={pageSize}
          totalCount={projectTotalCount}
        />
      </Suspense>
    </div>
  )
}
