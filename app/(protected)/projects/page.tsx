import Link from 'next/link'
import { getSessionProfile } from '@/lib/auth/session'
import { canAccessProjectsNewRoute, effectiveRole } from '@/lib/auth/permissions'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { FilterBar } from '@/components/shared/FilterBar'
import { DataTable } from '@/components/shared/DataTable'
import type { Column } from '@/components/shared/DataTable'
import { ProjectStatusBadge } from '@/components/modules/projects/ProjectStatusBadge'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { getProjects } from '@/lib/projects/queries'
import type { ProjectWithRelations } from '@/lib/projects/queries'
import { formatDate } from '@/lib/utils/formatters'
import { FolderKanban, Plus } from 'lucide-react'

export const metadata = { title: 'Projects — ReKa Engineering OS' }

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string; discipline?: string; priority?: string }>
}

function projectColumns(): Column<ProjectWithRelations>[] {
  return [
    {
      key: 'project_code',
      header: 'Project Code',
      render: (project) => (
        <Link href={`/projects/${project.id}`} style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            {project.project_code}
          </span>
        </Link>
      ),
    },
    {
      key: 'name',
      header: 'Project Name',
      render: (project) => (
        <Link href={`/projects/${project.id}`} style={{ textDecoration: 'none' }}>
          <p style={{
            fontWeight: 500,
            color: 'var(--color-text-primary)',
            fontSize: '0.8125rem',
            maxWidth: '260px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {project.name}
          </p>
        </Link>
      ),
    },
    {
      key: 'client',
      header: 'Client',
      render: (project) => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
          {project.clients?.client_name ?? '—'}
        </span>
      ),
    },
    {
      key: 'discipline',
      header: 'Discipline',
      render: (project) => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>
          {project.discipline}
        </span>
      ),
    },
    {
      key: 'lead',
      header: 'Lead',
      render: (project) => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
          {project.lead?.full_name ?? '—'}
        </span>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (project) => (
        <PriorityBadge priority={project.priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'} />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (project) => <ProjectStatusBadge status={project.status} />,
    },
    {
      key: 'due',
      header: 'Due Date',
      render: (project) => (
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
          {formatDate(project.target_due_date)}
        </span>
      ),
    },
    {
      key: 'progress',
      header: 'Progress',
      render: (project) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '90px' }}>
          <ProgressBar value={project.progress_percent} height={5} />
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
            {project.progress_percent}%
          </span>
        </div>
      ),
    },
    {
      key: 'waiting_on',
      header: 'Waiting On',
      render: (project) => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>
          {project.waiting_on === 'none' ? '—' : project.waiting_on}
        </span>
      ),
    },
  ]
}

export default async function ProjectsPage({ searchParams }: PageProps) {
  const profile = await getSessionProfile()
  const role = effectiveRole(profile.system_role)
  const params = await searchParams

  const scopeOpts =
    role === 'member'      ? { assignedUserId: profile.id } :
    role === 'coordinator' ? { assignedUserId: profile.id } :
    role === 'reviewer'    ? { reviewerUserId: profile.id } :
    {}

  const projects = await getProjects({
    search: params.search,
    status: params.status,
    discipline: params.discipline,
    priority: params.priority,
    ...scopeOpts,
  }).catch(() => [] as ProjectWithRelations[])

  const pageTitle = role === 'member' ? 'My Projects' : 'Projects'
  const pageSubtitle = role === 'member'
    ? 'Projects you are assigned to.'
    : role === 'reviewer'
      ? 'Projects where you are assigned as reviewer.'
      : role === 'coordinator'
        ? 'Projects in your operational scope.'
        : 'Active and historical engineering project work.'

  const hasActiveFilters = Boolean(params.search || params.status || params.discipline || params.priority)
  const canCreate = canAccessProjectsNewRoute(profile.system_role)

  return (
    <div>
      <PageHeader
        title={pageTitle}
        subtitle={pageSubtitle}
        actions={
          canCreate ? <Link
            href="/projects/new"
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
            New Project
          </Link> : undefined
        }
      />

      <form method="GET">
        <FilterBar>
          <input name="search" type="search" defaultValue={params.search ?? ''} placeholder="Search projects…" className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-colors min-w-[200px]" />
          <select name="status" defaultValue={params.status ?? ''} className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] cursor-pointer transition-colors">
            <option value="">All Statuses</option>
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
          <select name="discipline" defaultValue={params.discipline ?? ''} className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] cursor-pointer transition-colors">
            <option value="">All Disciplines</option>
            <option value="mechanical">Mechanical</option>
            <option value="civil">Civil</option>
            <option value="structural">Structural</option>
            <option value="electrical">Electrical</option>
            <option value="other">Other</option>
          </select>
          <select name="priority" defaultValue={params.priority ?? ''} className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] cursor-pointer transition-colors">
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <button type="submit" className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] transition-colors whitespace-nowrap cursor-pointer">Filter</button>
          {hasActiveFilters && (
            <Link href="/projects" className="px-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] font-medium transition-colors whitespace-nowrap no-underline">Clear filters</Link>
          )}
        </FilterBar>
      </form>

      <SectionCard noPadding>
        <ProjectsTable
          projects={projects}
          hasActiveFilters={hasActiveFilters}
          canCreate={canCreate}
        />
      </SectionCard>
    </div>
  )
}

function ProjectsTable({
  projects,
  hasActiveFilters,
  canCreate,
}: {
  projects: ProjectWithRelations[]
  hasActiveFilters: boolean
  canCreate: boolean
}) {
  if (projects.length === 0) {
    if (hasActiveFilters) {
      return (
        <EmptyState
          compact
          icon={<FolderKanban size={16} aria-hidden="true" />}
          title="No projects match your filters"
          description="Try different criteria or clear filters to see all projects in scope."
          action={<Link href="/projects" className="inline-flex items-center px-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] font-medium transition-colors whitespace-nowrap no-underline">Clear filters</Link>}
        />
      )
    }
    return (
      <EmptyState
        icon={<FolderKanban size={22} />}
        title="No projects yet"
        description="Create your first project to start tracking engineering work, deadlines, and team assignments."
        action={
          canCreate ? (
            <Link
              href="/projects/new"
              style={{
                padding: '9px 18px',
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-primary-fg)',
                borderRadius: 'var(--radius-control)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Create first project
            </Link>
          ) : undefined
        }
      />
    )
  }

  return <DataTable columns={projectColumns()} data={projects} />
}
