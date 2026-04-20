import Link from 'next/link'
import type { CSSProperties } from 'react'
import { getSessionProfile } from '@/lib/auth/session'
import { canAccessTasksDeliverablesFilesNewRoute, effectiveRole } from '@/lib/auth/permissions'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { FilterBar } from '@/components/shared/FilterBar'
import { DataTable } from '@/components/shared/DataTable'
import type { Column } from '@/components/shared/DataTable'
import { TaskStatusBadge } from '@/components/modules/tasks/TaskStatusBadge'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { getViewableProjectIdsForUser } from '@/lib/projects/queries'
import { getTasks } from '@/lib/tasks/queries'
import type { TaskWithRelations } from '@/lib/tasks/queries'
import { formatDate } from '@/lib/utils/formatters'
import { CheckSquare, Plus, AlertTriangle } from 'lucide-react'

const FI: CSSProperties = { padding: '7px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', fontSize: '0.8125rem', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)', outline: 'none', minWidth: '200px' }
const FS: CSSProperties = { padding: '7px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', fontSize: '0.8125rem', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)', cursor: 'pointer' }
const FB: CSSProperties = { padding: '7px 14px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' as const }
const FC: CSSProperties = { padding: '7px 10px', fontSize: '0.8125rem', color: 'var(--color-text-muted)', textDecoration: 'none', fontWeight: 500, whiteSpace: 'nowrap' as const }

export const metadata = { title: 'Tasks — ReKa Engineering OS' }

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string; priority?: string; project_id?: string }>
}

function taskColumns(today: string): Column<TaskWithRelations>[] {
  return [
    {
      key: 'title',
      header: 'Task',
      render: (task) => {
        const isOverdue = task.due_date && task.due_date < today && task.status !== 'done'
        return (
          <Link href={`/tasks/${task.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isOverdue && <AlertTriangle size={13} style={{ color: 'var(--color-warning)', flexShrink: 0 }} aria-hidden="true" />}
            <span style={{
              fontWeight: 500,
              color: 'var(--color-text-primary)',
              fontSize: '0.8125rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {task.title}
            </span>
          </Link>
        )
      },
    },
    {
      key: 'project',
      header: 'Project',
      render: (task) => (
        task.projects ? (
          <Link href={`/projects/${task.projects.id}`} style={{ textDecoration: 'none', color: 'var(--color-primary)', fontWeight: 500, fontSize: '0.75rem' }}>
            {task.projects.project_code}
          </Link>
        ) : '—'
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (task) => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>
          {task.category?.replace(/_/g, ' ') ?? '—'}
        </span>
      ),
    },
    {
      key: 'assignee',
      header: 'Assigned To',
      render: (task) => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
          {task.assignee?.full_name ?? '—'}
        </span>
      ),
    },
    {
      key: 'due_date',
      header: 'Due Date',
      render: (task) => {
        const isOverdue = task.due_date && task.due_date < today && task.status !== 'done'
        return (
          <span style={{
            fontSize: '0.75rem',
            color: isOverdue ? 'var(--color-warning)' : 'var(--color-text-muted)',
            fontWeight: isOverdue ? 600 : 400,
            whiteSpace: 'nowrap',
          }}>
            {formatDate(task.due_date)}
          </span>
        )
      },
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (task) => (
        <PriorityBadge priority={task.priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'} />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (task) => <TaskStatusBadge status={task.status} />,
    },
    {
      key: 'progress',
      header: 'Progress',
      render: (task) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '90px' }}>
          <ProgressBar value={task.progress_percent} height={5} />
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
            {task.progress_percent}%
          </span>
        </div>
      ),
    },
  ]
}

function taskRowStyle(task: TaskWithRelations, today: string): CSSProperties | undefined {
  const isOverdue = task.due_date && task.due_date < today && task.status !== 'done'
  const isBlocked = task.status === 'blocked'
  if (isBlocked) return { boxShadow: 'inset 3px 0 0 var(--color-danger)' }
  if (isOverdue) return { boxShadow: 'inset 3px 0 0 var(--color-warning)' }
  return undefined
}

export default async function TasksPage({ searchParams }: PageProps) {
  const profile = await getSessionProfile()
  const role = effectiveRole(profile.system_role)
  const params = await searchParams

  const scopeOpts =
    role === 'member' ? { scopeAssignedTo: profile.id } :
    role === 'reviewer' ? { scopeReviewerId: profile.id } :
    role === 'coordinator'
      ? { scopeProjectIds: (await getViewableProjectIdsForUser(profile.id, profile.system_role)) ?? [] }
      : {}

  const tasks = await getTasks({
    search: params.search,
    status: params.status,
    priority: params.priority,
    project_id: params.project_id,
    ...scopeOpts,
  }).catch(() => [] as TaskWithRelations[])

  const pageTitle = role === 'member' ? 'My Tasks' : 'Tasks'
  const pageSubtitle = role === 'member'
    ? 'Tasks assigned to you.'
    : role === 'reviewer'
      ? 'Tasks where you are the reviewer.'
      : role === 'coordinator'
        ? 'Tasks in your assigned projects.'
        : 'Executable work items assigned to team members across all projects.'
  const canCreate = canAccessTasksDeliverablesFilesNewRoute(profile.system_role)
  const hasActiveFilters = Boolean(params.search || params.status || params.priority || params.project_id)
  const today = new Date().toISOString().split('T')[0]

  return (
    <div>
      <PageHeader
        title={pageTitle}
        subtitle={pageSubtitle}
        actions={
          canCreate ? <Link
            href="/tasks/new"
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
            New Task
          </Link> : undefined
        }
      />

      <form method="GET">
        <FilterBar>
          <input name="search" type="search" defaultValue={params.search ?? ''} placeholder="Search tasks…" style={FI} />
          <select name="status" defaultValue={params.status ?? ''} style={FS}>
            <option value="">All Statuses</option>
            <option value="to_do">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="revision">Revision</option>
            <option value="blocked">Blocked</option>
            <option value="done">Done</option>
          </select>
          <select name="priority" defaultValue={params.priority ?? ''} style={FS}>
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <button type="submit" style={FB}>Filter</button>
          {hasActiveFilters && (
            <Link href="/tasks" style={FC}>Clear filters</Link>
          )}
        </FilterBar>
      </form>

      <SectionCard noPadding>
        <TasksTable
          tasks={tasks}
          today={today}
          hasActiveFilters={hasActiveFilters}
          canCreate={canCreate}
        />
      </SectionCard>
    </div>
  )
}

function TasksTable({
  tasks,
  today,
  hasActiveFilters,
  canCreate,
}: {
  tasks: TaskWithRelations[]
  today: string
  hasActiveFilters: boolean
  canCreate: boolean
}) {
  if (tasks.length === 0) {
    if (hasActiveFilters) {
      return (
        <EmptyState
          compact
          icon={<CheckSquare size={16} aria-hidden="true" />}
          title="No tasks match your filters"
          description="Try different criteria or clear filters to see all tasks in scope."
          action={<Link href="/tasks" style={{ ...FC, display: 'inline-flex', alignItems: 'center' }}>Clear filters</Link>}
        />
      )
    }
    return (
      <EmptyState
        icon={<CheckSquare size={22} />}
        title="No tasks yet"
        description="Create your first task to start tracking work items, assignments, and progress."
        action={
          canCreate ? (
            <Link
              href="/tasks/new"
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
              Create first task
            </Link>
          ) : undefined
        }
      />
    )
  }

  return (
    <DataTable
      columns={taskColumns(today)}
      data={tasks}
      getRowStyle={(task) => taskRowStyle(task, today)}
    />
  )
}
