import { cn } from '@/lib/utils/cn'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?:        ReactNode
  title:        string
  description?: string
  action?:      ReactNode
  /**
   * emphasis — first-use state: centered, larger icon, prominent action button.
   * Default (false) — standard empty state for lists and sections.
   * compact — filter no-results: minimal height, inline layout, no large icon block.
   */
  emphasis?:  boolean
  compact?:   boolean
  className?: string
}

export function EmptyState({ icon, title, description, action, emphasis, compact, className }: EmptyStateProps) {
  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 rounded-[var(--radius-control)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-4 py-3',
          className
        )}
      >
        {icon && (
          <span aria-hidden="true" className="flex shrink-0 text-[var(--color-text-muted)]">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <p className="text-[0.8125rem] font-medium leading-[1.35] text-[var(--color-text-secondary)]">
            {title}
          </p>
          {description && (
            <p className="mt-px text-xs text-[var(--color-text-muted)]">{description}</p>
          )}
        </div>
        {action && (
          <div className="ml-auto shrink-0">{action}</div>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 text-center',
        emphasis && 'py-20',
        className
      )}
    >
      {icon && (
        <div
          className={cn(
            'mb-4 flex items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]',
            emphasis ? 'mb-5 h-14 w-14' : 'h-12 w-12'
          )}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      <h3 className="text-[0.9375rem] font-semibold text-[var(--color-text-primary)]">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-[0.8125rem] text-[var(--color-text-muted)]">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
