import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getSessionProfile } from '@/lib/auth/session'
import { requireTaskView, userCanEditTask } from '@/lib/auth/access-surface'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { EntityStatusStrip } from '@/components/shared/EntityStatusStrip'
import { TaskStatusBadge } from '@/components/modules/tasks/TaskStatusBadge'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { getTaskById } from '@/lib/tasks/queries'
import { formatDate } from '@/lib/utils/formatters'
import {
  Pencil,
  ExternalLink,
} from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const task = await getTaskById(id)
  return { title: task ? `${task.title} — ReKa Engineering OS` : 'Task not found — ReKa Engineering OS' }
}

export default async function TaskDetailPage({ params }: PageProps) {
  const { id } = await params
  const profile = await getSessionProfile()
  const task = await getTaskById(id)
  if (!task) notFound()

  await requireTaskView(profile, task)
  const showEditTask = await userCanEditTask(profile, task)

  const isBlocked = task.status === 'blocked'

  return (
    <div>
      {/* Header */}
      <PageHeader
        title={task.title}
        subtitle={task.projects ? `${task.projects.project_code} · ${task.projects.name}` : 'No project'}
        actions={
          showEditTask ? (
            <Link
              href={`/tasks/${task.id}/edit`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-control)',
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: 'var(--color-text-secondary)',
                textDecoration: 'none',
              }}
            >
              <Pencil size={13} aria-hidden="true" />
              Edit Task
            </Link>
          ) : undefined
        }
      />

      <EntityStatusStrip
        statusBadge={<TaskStatusBadge status={task.status} />}
        priorityBadge={<PriorityBadge priority={task.priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'} />}
        extraBadge={isBlocked && task.blocked_reason ? (
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 500,
            color: 'var(--color-danger)',
            backgroundColor: 'var(--color-danger-subtle)',
            padding: '2px 10px',
            borderRadius: 'var(--radius-pill)',
          }}>
            Blocked: {task.blocked_reason}
          </span>
        ) : undefined}
        dueDate={task.due_date}
        progress={task.progress_percent}
      />

      {/* Two-column detail */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Overview */}
          <SectionCard title="Overview">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <DetailRow label="Project">
                {task.projects ? (
                  <Link
                    href={`/projects/${task.projects.id}`}
                    style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500, fontSize: '0.8125rem' }}
                  >
                    {task.projects.name}
                  </Link>
                ) : '—'}
              </DetailRow>
              <DetailRow label="Category">
                <span style={{ textTransform: 'capitalize' }}>
                  {task.category?.replace(/_/g, ' ') ?? '—'}
                </span>
              </DetailRow>
              <DetailRow label="Phase">{task.phase ?? '—'}</DetailRow>
              <DetailRow label="Assigned To">{task.assignee?.full_name ?? '—'}</DetailRow>
              <DetailRow label="Reviewer">
                {task.reviewer?.full_name ?? <span style={{ color: 'var(--color-text-muted)' }}>Not assigned</span>}
              </DetailRow>
              <DetailRow label="Start Date">{formatDate(task.start_date)}</DetailRow>
              <DetailRow label="Due Date">{formatDate(task.due_date)}</DetailRow>
              {task.completed_date && (
                <DetailRow label="Completed">{formatDate(task.completed_date)}</DetailRow>
              )}
              <DetailRow label="Estimated Hours">{task.estimated_hours != null ? `${task.estimated_hours}h` : '—'}</DetailRow>
              <DetailRow label="Actual Hours">{task.actual_hours != null ? `${task.actual_hours}h` : '—'}</DetailRow>
            </div>
          </SectionCard>

          {/* Description */}
          {task.description && (
            <SectionCard title="Description">
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                {task.description}
              </p>
            </SectionCard>
          )}

          {/* Notes */}
          {task.notes && (
            <SectionCard title="Notes">
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                {task.notes}
              </p>
            </SectionCard>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Drive Link */}
          {task.drive_link && (
            <SectionCard title="Working File">
              <a
                href={task.drive_link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--color-primary)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  wordBreak: 'break-all',
                }}
              >
                <ExternalLink size={13} aria-hidden="true" />
                Open in Drive
              </a>
            </SectionCard>
          )}

          {/* Record Info */}
          <SectionCard title="Record Info">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <DetailRow label="Created">{formatDate(task.created_at)}</DetailRow>
              <DetailRow label="Last Updated">{formatDate(task.updated_at)}</DetailRow>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '3px', fontWeight: 500 }}>
        {label}
      </p>
      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>{children}</div>
    </div>
  )
}
