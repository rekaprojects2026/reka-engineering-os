'use client'

import { useMemo, useState, useTransition, type ReactNode } from 'react'
import Link from 'next/link'
import { AlertTriangle, CheckSquare, ChevronDown, ChevronRight, Plus } from 'lucide-react'
import { buildTaskTree, type TaskNode, type TaskWithRelations } from '@/lib/tasks/task-tree'
import { createTask } from '@/lib/tasks/actions'
import { formatDate } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils/cn'
import { SectionHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/EmptyState'
import { TaskStatusBadge } from '@/components/modules/tasks/TaskStatusBadge'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { ProblemToggle } from '@/components/shared/ProblemToggle'

type MarkTaskProblematic = (taskId: string, isProblematic: boolean, note?: string | null) => Promise<void>

interface ProjectTasksTableProps {
  projectId: string
  tasks: TaskWithRelations[]
  showAddTask: boolean
  canFlagProblems: boolean
  markTaskProblematic: MarkTaskProblematic
}

const thClass =
  'whitespace-nowrap bg-[var(--color-surface-subtle)] px-3.5 py-2 text-left text-[0.6875rem] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]'
const tdClass = 'px-3.5 py-2 text-[0.8125rem]'

export function ProjectTasksTable({
  projectId,
  tasks,
  showAddTask,
  canFlagProblems,
  markTaskProblematic,
}: ProjectTasksTableProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set())
  const [addingSubToId, setAddingSubToId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const tree = useMemo(() => buildTaskTree(tasks), [tasks])
  const today = new Date().toISOString().split('T')[0]
  const headers = ['Task', 'Category', 'Assigned To', 'Due Date', 'Priority', 'Status', 'Progress', 'Problem']

  function toggleCollapsed(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function renderTaskRows(
    node: TaskNode,
    depth: number,
  ): ReactNode[] {
    const isOverdue = node.due_date && node.due_date < today && node.status !== 'done'
    const isBlocked = node.status === 'blocked'
    const hasChildren = node.children.length > 0
    const isCollapsed = collapsed.has(node.id)
    const out: React.ReactNode[] = []

    out.push(
      <tr
        key={node.id}
        className={cn(
          'border-b border-[var(--color-border)] last:border-b-0',
          isBlocked && 'bg-[var(--color-danger-subtle)]',
          isOverdue && !isBlocked && 'bg-[var(--color-warning-subtle)]',
        )}
      >
        <td className={cn(tdClass, 'max-w-[250px]')}>
          <div
            className="flex min-w-0 items-start gap-1"
            style={{ paddingLeft: depth * 24 }}
          >
            {hasChildren ? (
              <button
                type="button"
                className="mt-0.5 shrink-0 rounded p-0.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text-primary)]"
                onClick={() => toggleCollapsed(node.id)}
                aria-expanded={!isCollapsed}
                title={isCollapsed ? 'Expand subtasks' : 'Collapse subtasks'}
              >
                {isCollapsed ? <ChevronRight size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
              </button>
            ) : (
              <span className="w-[22px] shrink-0" aria-hidden="true" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <Link href={`/tasks/${node.id}`} className="flex min-w-0 items-center gap-1 no-underline">
                  {isOverdue && <AlertTriangle size={12} className="shrink-0 text-[var(--color-warning)]" aria-hidden="true" />}
                  <span className="truncate font-medium text-[var(--color-text-primary)]">{node.title}</span>
                </Link>
                {showAddTask ? (
                  <button
                    type="button"
                    className="shrink-0 rounded border border-[var(--color-border)] bg-transparent px-1.5 py-0.5 text-[0.6875rem] font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary-subtle)]"
                    onClick={() => {
                      setFormError(null)
                      setAddingSubToId((cur) => (cur === node.id ? null : node.id))
                    }}
                  >
                    + Sub
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </td>
        <td className={cn(tdClass, 'capitalize text-[var(--color-text-secondary)]')}>
          {node.category?.replace(/_/g, ' ') ?? '—'}
        </td>
        <td className={cn(tdClass, 'text-[var(--color-text-secondary)]')}>{node.assignee?.full_name ?? '—'}</td>
        <td
          className={cn(
            tdClass,
            'whitespace-nowrap text-[0.75rem]',
            isOverdue ? 'font-semibold text-[var(--color-warning)]' : 'text-[var(--color-text-muted)]',
          )}
        >
          {formatDate(node.due_date)}
        </td>
        <td className={tdClass}>
          <PriorityBadge priority={node.priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'} />
        </td>
        <td className={tdClass}>
          <TaskStatusBadge status={node.status} />
        </td>
        <td className={cn(tdClass, 'min-w-[5rem]')}>
          <div className="flex items-center gap-1">
            <ProgressBar value={node.progress_percent} height={5} />
            <span className="text-[0.6875rem] text-[var(--color-text-muted)]">{node.progress_percent}%</span>
          </div>
        </td>
        <td className={cn(tdClass, 'align-top')}>
          {canFlagProblems ? (
            <ProblemToggle
              entityId={node.id}
              entityType="task"
              isProblematic={node.is_problematic}
              problemNote={node.problem_note}
              onMark={markTaskProblematic}
            />
          ) : node.is_problematic ? (
            <span
              className="text-[0.6875rem] font-medium text-[var(--color-danger)]"
              title={node.problem_note ?? undefined}
            >
              Problem
            </span>
          ) : (
            <span className="text-[0.75rem] text-[var(--color-text-muted)]">—</span>
          )}
        </td>
      </tr>,
    )

    if (addingSubToId === node.id && showAddTask) {
      out.push(
        <tr key={`${node.id}-subform`} className="border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)]">
          <td colSpan={8} className="px-3.5 py-3">
            <form
              className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end"
              onSubmit={(e) => {
                e.preventDefault()
                setFormError(null)
                const fd = new FormData(e.currentTarget)
                startTransition(async () => {
                  const result = await createTask(fd)
                  if (result && 'error' in result) setFormError(result.error)
                })
              }}
            >
              <input type="hidden" name="project_id" value={projectId} />
              <input type="hidden" name="parent_task_id" value={node.id} />
              <input type="hidden" name="assigned_to_user_id" value={node.assigned_to_user_id} />
              <input type="hidden" name="return_to" value="project" />
              {node.reviewer_user_id ? <input type="hidden" name="reviewer_user_id" value={node.reviewer_user_id} /> : null}
              <input type="hidden" name="status" value="to_do" />
              <input type="hidden" name="priority" value="medium" />
              <input type="hidden" name="progress_percent" value="0" />
              <div className="min-w-0 flex-1">
                <label className="mb-1 block text-[0.75rem] font-medium text-[var(--color-text-secondary)]" htmlFor={`subtask-title-${node.id}`}>
                  Subtask title
                </label>
                <input
                  id={`subtask-title-${node.id}`}
                  name="title"
                  type="text"
                  required
                  className="w-full max-w-md rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-2.5 py-1.5 text-[0.8125rem] text-[var(--text-primary-neutral)] outline-none transition-[border-color,background-color,box-shadow] placeholder:text-[var(--input-placeholder)] focus:border-[var(--input-focus-border)] focus:bg-[var(--input-bg-focus)] focus:ring-[3px] focus:ring-[color:var(--input-focus-ring)]"
                  placeholder="e.g. Wireframe"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-md bg-[var(--color-primary)] px-3 py-1.5 text-[0.8125rem] font-medium text-[var(--color-primary-fg)] disabled:opacity-60"
                >
                  {isPending ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddingSubToId(null)
                    setFormError(null)
                  }}
                  className="rounded-md border border-[var(--input-border)] bg-[var(--surface-card)] px-3 py-1.5 text-[0.8125rem] text-[var(--text-secondary-neutral)] transition-colors hover:bg-[var(--surface-neutral)]"
                >
                  Cancel
                </button>
              </div>
            </form>
            {formError ? (
              <p className="mt-2 text-[0.75rem] text-[var(--color-danger)]" role="alert">
                {formError}
              </p>
            ) : null}
          </td>
        </tr>,
      )
    }

    if (!isCollapsed) {
      for (const c of node.children) {
        out.push(...renderTaskRows(c, depth + 1))
      }
    }

    return out
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] p-6 pb-4">
        <SectionHeader title="Project tasks" className="mb-0" />
        {showAddTask ? (
          <Link
            href={`/tasks/new?project_id=${projectId}`}
            className="inline-flex shrink-0 items-center gap-1 text-[0.75rem] font-medium text-[var(--color-primary)] no-underline hover:underline"
          >
            <Plus size={12} aria-hidden="true" />
            Add task
          </Link>
        ) : null}
      </div>
      {tree.length === 0 ? (
        <div className="p-4">
          <EmptyState compact icon={<CheckSquare size={16} aria-hidden="true" />} title="No tasks created for this project yet." />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                {headers.map((h) => (
                  <th key={h} className={thClass}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tree.flatMap((n) => renderTaskRows(n, 0))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
