'use client'

import { useState } from 'react'
import { List, LayoutGrid, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { DataTable } from '@/components/shared/DataTable'
import { TasksKanban } from '@/components/modules/tasks/TasksKanban'
import { TaskStatusBadge } from '@/components/modules/tasks/TaskStatusBadge'
import { InlineStatusSelect } from '@/components/shared/InlineStatusSelect'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { ProgressBar } from '@/components/shared/ProgressBar'
import type { Column } from '@/components/shared/DataTable'
import type { TaskWithRelations } from '@/lib/tasks/queries'
import { formatDate } from '@/lib/utils/formatters'

const TASK_STATUS_OPTIONS = [
  { value: 'to_do',       label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review',      label: 'Review' },
  { value: 'revision',    label: 'Revision' },
  { value: 'blocked',     label: 'Blocked' },
  { value: 'done',        label: 'Done' },
]

interface TasksViewWrapperProps {
  tasks: TaskWithRelations[]
  today: string
  onStatusUpdate: (taskId: string, newStatus: string) => Promise<void>
}

export function TasksViewWrapper({ tasks, today, onStatusUpdate }: TasksViewWrapperProps) {
  const [view, setView] = useState<'list' | 'kanban'>('list')

  const columns: Column<TaskWithRelations>[] = [
    {
      key: 'title',
      header: 'Task',
      render: (task) => {
        const isOverdue = task.due_date && task.due_date < today && task.status !== 'done'
        return (
          <Link href={`/tasks/${task.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {task.is_problematic && (
              <span title={task.problem_note ?? 'Problem flagged'}>
                <AlertTriangle size={13} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
              </span>
            )}
            {!task.is_problematic && isOverdue && <AlertTriangle size={13} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />}
            <span style={{ fontWeight: 500, fontSize: '0.8125rem', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px' }}>
              {task.title}
            </span>
          </Link>
        )
      },
    },
    {
      key: 'project',
      header: 'Project',
      render: (task) => task.projects ? (
        <Link href={`/projects/${task.projects.id}`} style={{ textDecoration: 'none', color: 'var(--color-primary)', fontWeight: 500, fontSize: '0.75rem' }}>
          {task.projects.project_code}
        </Link>
      ) : <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>—</span>,
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
      header: 'Due',
      render: (task) => {
        const isOverdue = task.due_date && task.due_date < today && task.status !== 'done'
        return (
          <span style={{ fontSize: '0.75rem', color: isOverdue ? 'var(--color-warning)' : 'var(--color-text-muted)', fontWeight: isOverdue ? 600 : 400, whiteSpace: 'nowrap' }}>
            {formatDate(task.due_date)}
          </span>
        )
      },
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (task) => <PriorityBadge priority={task.priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (task) => (
        <InlineStatusSelect
          currentStatus={task.status}
          options={TASK_STATUS_OPTIONS}
          onUpdate={(newStatus) => onStatusUpdate(task.id, newStatus)}
          renderBadge={(s) => <TaskStatusBadge status={s} />}
        />
      ),
    },
    {
      key: 'progress',
      header: 'Progress',
      render: (task) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '80px' }}>
          <ProgressBar value={task.progress_percent} height={5} />
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{task.progress_percent}%</span>
        </div>
      ),
    },
  ]

  return (
    <div>
      {/* View toggle */}
      <div style={{ display: 'flex', gap: '4px', padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
        <button
          onClick={() => setView('list')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 10px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500, backgroundColor: view === 'list' ? 'var(--color-primary)' : 'transparent', color: view === 'list' ? 'var(--color-primary-fg)' : 'var(--color-text-muted)' }}
        >
          <List size={14} /> List
        </button>
        <button
          onClick={() => setView('kanban')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 10px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500, backgroundColor: view === 'kanban' ? 'var(--color-primary)' : 'transparent', color: view === 'kanban' ? 'var(--color-primary-fg)' : 'var(--color-text-muted)' }}
        >
          <LayoutGrid size={14} /> Kanban
        </button>
      </div>

      {view === 'list' && (
        <DataTable
          columns={columns}
          data={tasks}
          getRowStyle={(task) => {
            const isOverdue = task.due_date && task.due_date < today && task.status !== 'done'
            if (task.is_problematic || task.status === 'blocked') return { boxShadow: 'inset 3px 0 0 var(--color-danger)' }
            if (isOverdue) return { boxShadow: 'inset 3px 0 0 var(--color-warning)' }
            return undefined
          }}
        />
      )}
      {view === 'kanban' && (
        <div style={{ padding: '16px', overflowX: 'auto' }}>
          <TasksKanban tasks={tasks} onStatusChange={onStatusUpdate} />
        </div>
      )}
    </div>
  )
}
