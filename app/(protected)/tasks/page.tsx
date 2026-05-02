import Link from 'next/link'
import type { CSSProperties } from 'react'
import { Suspense } from 'react'
import { getSessionProfile } from '@/lib/auth/session'
import {
  canAccessTasksDeliverablesFilesNewRoute,
  effectiveRole,
  isFreelancer,
  isManajer,
  isManagement,
  isSenior,
} from '@/lib/auth/permissions'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { FilterBar } from '@/components/shared/FilterBar'
import { DataTable } from '@/components/shared/DataTable'
import type { Column } from '@/components/shared/DataTable'
import { TaskStatusBadge } from '@/components/modules/tasks/TaskStatusBadge'
import { InlineStatusSelect } from '@/components/shared/InlineStatusSelect'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { TasksKanban } from '@/components/modules/tasks/TasksKanban'
import { getViewableProjectIdsForUser } from '@/lib/projects/queries'
import { getTasks } from '@/lib/tasks/queries'
import { updateTaskStatus } from '@/lib/tasks/actions'
import { getAllUsers } from '@/lib/users/queries'
import type { TaskWithRelations } from '@/lib/tasks/queries'
import { formatDate } from '@/lib/utils/formatters'
import { parsePagination, totalPages } from '@/lib/utils/pagination'
import { Pagination } from '@/components/shared/Pagination'
import { CheckSquare, Plus, AlertTriangle, List, LayoutGrid } from 'lucide-react'
import { TasksViewWrapper } from '@/components/modules/tasks/TasksViewWrapper'

export const metadata = { title: 'Tasks — ReKa Engineering OS' }

interface PageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    priority?: string
    project_id?: string
    assigned_to?: string
    view?: string
    page?: string
    pageSize?: string
  }>
}

export default async function TasksPage({ searchParams }: PageProps) {
  const profile = await getSessionProfile()
  const role    = effectiveRole(profile.system_role)
  const params  = await searchParams
  const { page, pageSize } = parsePagination(params)

  const scopeOpts =
    role === 'member' || isFreelancer(role)
      ? { scopeAssignedTo: profile.id }
      : isSenior(role)
        ? { scopeReviewerId: profile.id }
        : role === 'manajer'
          ? { scopeProjectIds: (await getViewableProjectIdsForUser(profile.id, profile.system_role)) ?? [] }
          : {}

  const [taskResult, allUsers] = await Promise.all([
    getTasks({
      search:      params.search,
      status:      params.status,
      priority:    params.priority,
      project_id:  params.project_id,
      assigned_to: params.assigned_to,
      page,
      pageSize,
      ...scopeOpts,
    }).catch(() => ({ rows: [] as TaskWithRelations[], count: 0 })),
    (isManagement(role) || isManajer(role)) ? getAllUsers().catch(() => []) : Promise.resolve([]),
  ])

  const tasks = taskResult.rows
  const taskTotalCount = taskResult.count

  const pageTitle    = role === 'member' ? 'My Tasks' : 'Tasks'
  const pageSubtitle =
    role === 'member' || isFreelancer(role) ? 'Tasks assigned to you.' :
    isSenior(role) ? 'Tasks where you are the reviewer.' :
    role === 'manajer' ? 'Tasks in your assigned projects.' :
    'All executable work items across projects.'

  const canCreate       = canAccessTasksDeliverablesFilesNewRoute(profile.system_role)
  const hasActiveFilters = Boolean(params.search || params.status || params.priority || params.project_id || params.assigned_to)
  const today           = new Date().toISOString().split('T')[0]

  async function handleStatusUpdate(taskId: string, newStatus: string) {
    'use server'
    await updateTaskStatus(taskId, newStatus)
  }

  return (
    <div>
      <PageHeader
        title={pageTitle}
        subtitle={pageSubtitle}
        actions={
          canCreate ? (
            <Link
              href="/tasks/new"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-fg)', borderRadius: 'var(--radius-control)', fontSize: '0.8125rem', fontWeight: 500, textDecoration: 'none' }}
            >
              <Plus size={14} /> New Task
            </Link>
          ) : undefined
        }
      />

      <form method="GET">
        <FilterBar>
          <input name="search" type="search" defaultValue={params.search ?? ''} placeholder="Search tasks…"
            className="h-9 min-w-[180px] rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary-neutral)] outline-none transition-[border-color,background-color,box-shadow] placeholder:text-[var(--input-placeholder)] focus:border-[var(--input-focus-border)] focus:bg-[var(--input-bg-focus)] focus:ring-[3px] focus:ring-[color:var(--input-focus-ring)]" />
          <select name="status" defaultValue={params.status ?? ''}
            className="h-9 cursor-pointer rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary-neutral)] outline-none transition-[border-color,background-color,box-shadow] focus:border-[var(--input-focus-border)] focus:bg-[var(--input-bg-focus)] focus:ring-[3px] focus:ring-[color:var(--input-focus-ring)]">
            <option value="">All Statuses</option>
            <option value="to_do">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="revision">Revision</option>
            <option value="blocked">Blocked</option>
            <option value="done">Done</option>
          </select>
          <select name="priority" defaultValue={params.priority ?? ''}
            className="h-9 cursor-pointer rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary-neutral)] outline-none transition-[border-color,background-color,box-shadow] focus:border-[var(--input-focus-border)] focus:bg-[var(--input-bg-focus)] focus:ring-[3px] focus:ring-[color:var(--input-focus-ring)]">
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          {/* Filter by person — only for admin/coordinator */}
          {(isManagement(role) || isManajer(role)) && allUsers.length > 0 && (
            <select name="assigned_to" defaultValue={params.assigned_to ?? ''}
              className="h-9 cursor-pointer rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary-neutral)] outline-none transition-[border-color,background-color,box-shadow] focus:border-[var(--input-focus-border)] focus:bg-[var(--input-bg-focus)] focus:ring-[3px] focus:ring-[color:var(--input-focus-ring)]">
              <option value="">All People</option>
              {allUsers.map(u => (
                <option key={u.id} value={u.id}>{u.full_name}</option>
              ))}
            </select>
          )}
          <button type="submit" className="h-9 cursor-pointer rounded-md border border-[var(--input-border)] bg-[var(--surface-card)] px-3 text-sm font-medium text-[var(--text-secondary-neutral)] transition-colors hover:bg-[var(--surface-neutral)]">
            Filter
          </button>
          {hasActiveFilters && (
            <Link href="/tasks" className="px-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] font-medium no-underline">
              Clear filters
            </Link>
          )}
        </FilterBar>
      </form>

      <SectionCard noPadding>
        {tasks.length === 0 ? (
          <EmptyState
            compact={hasActiveFilters}
            icon={<CheckSquare size={hasActiveFilters ? 16 : 22} />}
            title={hasActiveFilters ? 'No tasks match your filters' : 'No tasks yet'}
            description={hasActiveFilters ? 'Try different criteria or clear filters.' : 'Create your first task to start tracking work items.'}
            action={
              hasActiveFilters
                ? <Link href="/tasks" className="px-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] font-medium no-underline">Clear filters</Link>
                : canCreate
                  ? <Link href="/tasks/new" style={{ padding: '9px 18px', backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-fg)', borderRadius: 'var(--radius-control)', fontSize: '0.8125rem', fontWeight: 600, textDecoration: 'none' }}>Create first task</Link>
                  : undefined
            }
          />
        ) : (
          <TasksViewWrapper tasks={tasks} today={today} onStatusUpdate={handleStatusUpdate} />
        )}
      </SectionCard>
      <Suspense fallback={null}>
        <Pagination
          currentPage={page}
          totalPages={totalPages(taskTotalCount, pageSize)}
          pageSize={pageSize}
          totalCount={taskTotalCount}
        />
      </Suspense>
    </div>
  )
}
