'use client'

import Link from 'next/link'
import { KanbanBoard, type KanbanColumn, type KanbanCard } from '@/components/shared/KanbanBoard'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { AlertTriangle } from 'lucide-react'
import type { ProjectWithRelations } from '@/lib/projects/queries'
import { normalizeProjectDisciplines } from '@/lib/projects/helpers'

const WORKFLOW_STATUSES = new Set(['pending_approval', 'rejected'])

const PROJECT_KANBAN_COLUMNS: KanbanColumn[] = [
  { id: 'pending_approval', label: 'Pending Approval', color: '#f59e0b' },
  { id: 'rejected',         label: 'Rejected',         color: '#ef4444' },
  { id: 'new',             label: 'New',             color: '#94a3b8' },
  { id: 'ready_to_start',  label: 'Ready to Start',  color: '#60a5fa' },
  { id: 'ongoing',         label: 'Ongoing',         color: '#34d399' },
  { id: 'internal_review', label: 'Internal Review', color: '#a78bfa' },
  { id: 'waiting_client',  label: 'Waiting Client',  color: '#fb923c' },
  { id: 'in_revision',     label: 'In Revision',     color: '#f59e0b' },
  { id: 'on_hold',         label: 'On Hold',         color: '#6b7280' },
  { id: 'completed',       label: 'Completed',       color: '#10b981' },
]

interface ProjectsKanbanProps {
  projects: ProjectWithRelations[]
  onStatusChange: (projectId: string, newStatus: string) => Promise<void>
}

export function ProjectsKanban({ projects, onStatusChange }: ProjectsKanbanProps) {
  async function guardedStatusChange(cardId: string, newColumnId: string) {
    const proj = projects.find((p) => p.id === cardId)
    if (!proj) return
    if (WORKFLOW_STATUSES.has(proj.status) || WORKFLOW_STATUSES.has(newColumnId)) {
      throw new Error('Cannot change workflow status from the board.')
    }
    await onStatusChange(cardId, newColumnId)
  }

  const cards: KanbanCard[] = projects.map(p => ({
    id: p.id,
    columnId: p.status,
    content: null,
    dragData: { status: p.status },
  }))

  function renderCard(card: KanbanCard, isDragging?: boolean) {
    const project = projects.find(p => p.id === card.id)
    if (!project) return null

    return (
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: `1px solid ${project.is_problematic ? 'var(--color-danger)' : 'var(--color-border)'}`,
          borderRadius: 'var(--radius-card)',
          padding: '10px 12px',
          boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.06)',
          cursor: 'grab',
        }}
      >
        {/* Problem flag */}
        {project.is_problematic && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-danger)' }}>
            <AlertTriangle size={11} />
            Problem
          </div>
        )}

        {/* Project name */}
        <Link
          href={`/projects/${project.id}`}
          style={{ textDecoration: 'none' }}
          onClick={e => e.stopPropagation()}
        >
          <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px', lineHeight: 1.3 }}>
            {project.name}
          </p>
        </Link>

        {/* Client */}
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
          {project.clients?.client_name ?? '—'}
        </p>

        {normalizeProjectDisciplines(project).length > 0 && (
          <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)', marginBottom: '8px', lineHeight: 1.35 }}>
            {normalizeProjectDisciplines(project)
              .map((d) => d.replace(/_/g, ' '))
              .join(' · ')}
          </p>
        )}

        {/* Progress */}
        <div style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>Progress</span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>{project.progress_percent}%</span>
          </div>
          <ProgressBar value={project.progress_percent} height={4} />
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <PriorityBadge priority={project.priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'} />
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
            {project.lead?.full_name?.split(' ')[0] ?? '—'}
          </span>
        </div>
      </div>
    )
  }

  return (
    <KanbanBoard
      columns={PROJECT_KANBAN_COLUMNS}
      cards={cards}
      onCardMove={guardedStatusChange}
      renderCard={renderCard}
    />
  )
}
