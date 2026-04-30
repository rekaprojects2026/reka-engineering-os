'use client'

import { useState, useTransition } from 'react'
import { List, LayoutGrid, AlertTriangle } from 'lucide-react'
import { DataTable } from '@/components/shared/DataTable'
import { ProjectsKanban } from '@/components/modules/projects/ProjectsKanban'
import { ProjectStatusBadge } from '@/components/modules/projects/ProjectStatusBadge'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { InlineStatusSelect } from '@/components/shared/InlineStatusSelect'
import type { Column } from '@/components/shared/DataTable'
import type { ProjectWithRelations } from '@/lib/projects/queries'
import { normalizeProjectDisciplines } from '@/lib/projects/helpers'
import { formatDate } from '@/lib/utils/formatters'
import Link from 'next/link'

const WORKFLOW_STATUSES = new Set(['pending_approval', 'rejected'])

const PROJECT_STATUS_OPTIONS = [
  { value: 'new',             label: 'New' },
  { value: 'ready_to_start',  label: 'Ready to Start' },
  { value: 'ongoing',         label: 'Ongoing' },
  { value: 'internal_review', label: 'Internal Review' },
  { value: 'waiting_client',  label: 'Waiting Client' },
  { value: 'in_revision',     label: 'In Revision' },
  { value: 'on_hold',         label: 'On Hold' },
  { value: 'completed',       label: 'Completed' },
  { value: 'cancelled',       label: 'Cancelled' },
]

interface ProjectsViewToggleProps {
  projects: ProjectWithRelations[]
  onStatusUpdate: (projectId: string, newStatus: string) => Promise<void>
}

export function ProjectsViewToggle({ projects, onStatusUpdate }: ProjectsViewToggleProps) {
  const [view, setView] = useState<'list' | 'kanban'>('list')

  const columns: Column<ProjectWithRelations>[] = [
    {
      key: 'project_code',
      header: 'Code',
      render: (p) => (
        <Link href={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{p.project_code}</span>
        </Link>
      ),
    },
    {
      key: 'name',
      header: 'Project',
      render: (p) => (
        <Link href={`/projects/${p.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {p.is_problematic && (
            <span title={p.problem_note ?? 'Problem flagged'}>
              <AlertTriangle size={13} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
            </span>
          )}
          <span style={{ fontWeight: 500, fontSize: '0.8125rem', color: 'var(--color-text-primary)', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {p.name}
          </span>
        </Link>
      ),
    },
    {
      key: 'client',
      header: 'Client',
      render: (p) => <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{p.clients?.client_name ?? '—'}</span>,
    },
    {
      key: 'disciplines',
      header: 'Disciplines',
      render: (p) => (
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.35 }}>
          {normalizeProjectDisciplines(p)
            .map((d) => d.replace(/_/g, ' '))
            .join(' · ') || '—'}
        </span>
      ),
    },
    {
      key: 'lead',
      header: 'Lead',
      render: (p) => <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{p.lead?.full_name ?? '—'}</span>,
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (p) => <PriorityBadge priority={p.priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) =>
        WORKFLOW_STATUSES.has(p.status) ? (
          <ProjectStatusBadge status={p.status} />
        ) : (
          <InlineStatusSelect
            currentStatus={p.status}
            options={PROJECT_STATUS_OPTIONS}
            onUpdate={(newStatus) => onStatusUpdate(p.id, newStatus)}
            renderBadge={(s) => <ProjectStatusBadge status={s} />}
          />
        ),
    },
    {
      key: 'due',
      header: 'Due',
      render: (p) => <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{formatDate(p.target_due_date)}</span>,
    },
    {
      key: 'progress',
      header: 'Progress',
      render: (p) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '90px' }}>
          <ProgressBar value={p.progress_percent} height={5} />
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{p.progress_percent}%</span>
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
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '5px 10px', border: 'none', borderRadius: '6px',
            cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500,
            backgroundColor: view === 'list' ? 'var(--color-primary)' : 'transparent',
            color: view === 'list' ? 'var(--color-primary-fg)' : 'var(--color-text-muted)',
          }}
        >
          <List size={14} /> List
        </button>
        <button
          onClick={() => setView('kanban')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '5px 10px', border: 'none', borderRadius: '6px',
            cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500,
            backgroundColor: view === 'kanban' ? 'var(--color-primary)' : 'transparent',
            color: view === 'kanban' ? 'var(--color-primary-fg)' : 'var(--color-text-muted)',
          }}
        >
          <LayoutGrid size={14} /> Kanban
        </button>
      </div>

      {/* Views */}
      {view === 'list' && <DataTable columns={columns} data={projects} />}
      {view === 'kanban' && (
        <div style={{ padding: '16px', overflowX: 'auto' }}>
          <ProjectsKanban projects={projects} onStatusChange={onStatusUpdate} />
        </div>
      )}
    </div>
  )
}
