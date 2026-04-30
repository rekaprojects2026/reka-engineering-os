'use client'

import Link from 'next/link'
import { KanbanBoard, type KanbanColumn, type KanbanCard } from '@/components/shared/KanbanBoard'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { AlertTriangle } from 'lucide-react'
import { formatDate } from '@/lib/utils/formatters'
import type { TaskWithRelations } from '@/lib/tasks/queries'

const TASK_KANBAN_COLUMNS: KanbanColumn[] = [
  { id: 'to_do',      label: 'To Do',      color: '#94a3b8' },
  { id: 'in_progress', label: 'In Progress', color: '#60a5fa' },
  { id: 'review',     label: 'Review',     color: '#a78bfa' },
  { id: 'revision',   label: 'Revision',   color: '#f59e0b' },
  { id: 'blocked',    label: 'Blocked',    color: '#ef4444' },
  { id: 'done',       label: 'Done',       color: '#10b981' },
]

interface TasksKanbanProps {
  tasks: TaskWithRelations[]
  onStatusChange: (taskId: string, newStatus: string) => Promise<void>
}

export function TasksKanban({ tasks, onStatusChange }: TasksKanbanProps) {
  const today = new Date().toISOString().split('T')[0]

  const cards: KanbanCard[] = tasks.map(t => ({
    id: t.id,
    columnId: t.status,
    content: null,
  }))

  function renderCard(card: KanbanCard, isDragging?: boolean) {
    const task = tasks.find(t => t.id === card.id)
    if (!task) return null

    const isOverdue = task.due_date && task.due_date < today && task.status !== 'done'

    return (
      <div style={{
        backgroundColor: 'var(--color-surface)',
        border: `1px solid ${task.is_problematic ? 'var(--color-danger)' : isOverdue ? 'var(--color-warning)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-card)',
        padding: '10px 12px',
        boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.06)',
        cursor: 'grab',
      }}>
        {/* Problem / overdue flag */}
        {(task.is_problematic || isOverdue) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px', fontSize: '0.6875rem', fontWeight: 600, color: task.is_problematic ? 'var(--color-danger)' : 'var(--color-warning)' }}>
            <AlertTriangle size={11} />
            {task.is_problematic ? 'Problem' : 'Overdue'}
          </div>
        )}

        {/* Title */}
        <Link href={`/tasks/${task.id}`} style={{ textDecoration: 'none' }} onClick={e => e.stopPropagation()}>
          <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px', lineHeight: 1.3 }}>
            {task.title}
          </p>
        </Link>

        {/* Project */}
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
          {task.projects?.name ?? '—'}
        </p>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <PriorityBadge priority={task.priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
            {task.assignee && (
              <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                {task.assignee.full_name.split(' ')[0]}
              </span>
            )}
            {task.due_date && (
              <span style={{ fontSize: '0.6875rem', color: isOverdue ? 'var(--color-warning)' : 'var(--color-text-muted)' }}>
                {formatDate(task.due_date)}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <KanbanBoard
      columns={TASK_KANBAN_COLUMNS}
      cards={cards}
      onCardMove={onStatusChange}
      renderCard={renderCard}
    />
  )
}
