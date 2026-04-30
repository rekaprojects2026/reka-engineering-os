import type { ReactNode } from 'react'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { formatDate } from '@/lib/utils/formatters'

interface EntityStatusStripProps {
  statusBadge:    ReactNode
  priorityBadge?: ReactNode
  extraBadge?:    ReactNode
  dueDate?:       string | null
  progress?:      number | null
}

/**
 * EntityStatusStrip — a contained status hero strip for detail pages.
 * Sits between the PageHeader and the tab navigation.
 * Shows status, priority, optional extra badge, due date, and progress.
 */
export function EntityStatusStrip({
  statusBadge,
  priorityBadge,
  extraBadge,
  dueDate,
  progress,
}: EntityStatusStripProps) {
  const today     = new Date().toISOString().split('T')[0]
  const isOverdue = dueDate && dueDate < today

  return (
    <div className="mb-5 flex flex-wrap items-center gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 shadow-[var(--shadow-sm)]">
      {statusBadge}
      {priorityBadge}
      {extraBadge}

      {dueDate && (
        <span
          className={`whitespace-nowrap text-xs ${isOverdue ? 'font-semibold text-[var(--color-danger)]' : 'font-normal text-[var(--color-text-muted)]'}`}
        >
          Due {formatDate(dueDate)}
        </span>
      )}

      {progress != null && (
        <div className="flex min-w-[110px] shrink-0 items-center gap-1.5">
          <ProgressBar value={progress} height={5} />
          <span className="whitespace-nowrap text-[0.6875rem] text-[var(--color-text-muted)]">
            {progress}%
          </span>
        </div>
      )}
    </div>
  )
}
