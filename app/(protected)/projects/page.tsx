import Link from 'next/link'
import type { CSSProperties } from 'react'
import { getSessionProfile } from '@/lib/auth/session'
import { canAccessProjectsNewRoute, effectiveRole } from '@/lib/auth/permissions'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { FilterBar } from '@/components/shared/FilterBar'
import { ProjectStatusBadge } from '@/components/modules/projects/ProjectStatusBadge'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { getProjects } from '@/lib/projects/queries'
import type { ProjectWithRelations } from '@/lib/projects/queries'
import { formatDate } from '@/lib/utils/formatters'
import { FolderKanban, Plus } from 'lucide-react'

const FI: CSSProperties = { padding: '7px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', fontSize: '0.8125rem', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)', outline: 'none', minWidth: '200px' }
const FS: CSSProperties = { padding: '7px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', fontSize: '0.8125rem', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)', cursor: 'pointer' }
const FB: CSSProperties = { padding: '7px 14px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' as const }
const FC: CSSProperties = { padding: '7px 10px', fontSize: '0.8125rem', color: 'var(--color-text-muted)', textDecoration: 'none', fontWeight: 500, whiteSpace: 'nowrap' as const }

export const metadata = { title: 'Projects — Engineering Agency OS' }

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string; discipline?: string; priority?: string }>
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

  return (
    <div>
      <PageHeader
        title={pageTitle}
        subtitle={pageSubtitle}
        actions={
          canAccessProjectsNewRoute(profile.system_role) ? <Link
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

      {/* Filters */}
      <form method="GET">
        <FilterBar>
          <input name="search" type="search" defaultValue={params.search ?? ''} placeholder="Search projects…" style={FI} />
          <select name="status" defaultValue={params.status ?? ''} style={FS}>
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
          <select name="discipline" defaultValue={params.discipline ?? ''} style={FS}>
            <option value="">All Disciplines</option>
            <option value="mechanical">Mechanical</option>
            <option value="civil">Civil</option>
            <option value="structural">Structural</option>
            <option value="electrical">Electrical</option>
            <option value="other">Other</option>
          </select>
          <select name="priority" defaultValue={params.priority ?? ''} style={FS}>
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <button type="submit" style={FB}>Filter</button>
          {(params.search || params.status || params.discipline || params.priority) && (
            <Link href="/projects" style={FC}>Clear filters</Link>
          )}
        </FilterBar>
      </form>

      {/* Table */}
      <SectionCard noPadding>
        <ProjectsTable projects={projects} />
      </SectionCard>
    </div>
  )
}

function ProjectsTable({ projects }: { projects: ProjectWithRelations[] }) {
  if (projects.length === 0) {
    return (
      <EmptyState
        icon={<FolderKanban size={22} />}
        title="No projects yet"
        description="Create your first project to start tracking engineering work, deadlines, and team assignments."
        action={
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
        }
      />
    )
  }

  const headers = ['Project Code', 'Project Name', 'Client', 'Discipline', 'Lead', 'Priority', 'Status', 'Due Date', 'Progress', 'Waiting On']

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
          {projects.map((project, idx) => (
            <tr
              key={project.id}
              style={{
                borderBottom: idx < projects.length - 1 ? '1px solid var(--color-border)' : undefined,
                backgroundColor: 'var(--color-surface)',
                cursor: 'pointer',
              }}
              className="hover:bg-[var(--color-surface-muted)] transition-colors"
            >
              {/* Code */}
              <td style={{ padding: '10px 14px' }}>
                <Link href={`/projects/${project.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {project.project_code}
                  </span>
                </Link>
              </td>
              {/* Name */}
              <td style={{ padding: '10px 14px' }}>
                <Link href={`/projects/${project.id}`} style={{ textDecoration: 'none', display: 'block' }}>
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
              </td>
              {/* Client */}
              <td style={{ padding: '10px 14px', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                {project.clients?.client_name ?? '—'}
              </td>
              {/* Discipline */}
              <td style={{ padding: '10px 14px', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>
                {project.discipline}
              </td>
              {/* Lead */}
              <td style={{ padding: '10px 14px', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                {project.lead?.full_name ?? '—'}
              </td>
              {/* Priority */}
              <td style={{ padding: '10px 14px' }}>
                <PriorityBadge priority={project.priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'} />
              </td>
              {/* Status */}
              <td style={{ padding: '10px 14px' }}>
                <ProjectStatusBadge status={project.status} />
              </td>
              {/* Due Date */}
              <td style={{ padding: '10px 14px', fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                {formatDate(project.target_due_date)}
              </td>
              {/* Progress */}
              <td style={{ padding: '10px 14px', minWidth: '90px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ProgressBar value={project.progress_percent} height={5} />
                  <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                    {project.progress_percent}%
                  </span>
                </div>
              </td>
              {/* Waiting On */}
              <td style={{ padding: '10px 14px', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>
                {project.waiting_on === 'none' ? '—' : project.waiting_on}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
