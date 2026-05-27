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
  tone?:      'default' | 'neutral'
  className?: string
}

export function EmptyState({ icon, title, description, action, emphasis, compact, tone = 'default', className }: EmptyStateProps) {
  const neutralTone = tone === 'neutral'

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-[var(--space-grid-gap)] rounded-[var(--radius-control)] px-[var(--space-4)] py-[var(--space-3)]',
          neutralTone
            ? 'border border-dashed border-[var(--empty-border)] bg-[var(--empty-bg)]'
            : 'border border-dashed border-[var(--color-border)] bg-[var(--color-surface-subtle)]',
          className
        )}
      >
        {icon && (
          <span
            aria-hidden="true"
            className={cn('flex shrink-0', neutralTone ? 'text-[var(--empty-icon)]' : 'text-[var(--color-text-muted)]')}
          >
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <p
            className={cn(
              'text-[0.8125rem] font-medium leading-[1.35]',
              neutralTone ? 'text-[var(--empty-text)]' : 'text-[var(--color-text-secondary)]'
            )}
          >
            {title}
          </p>
          {description && (
            <p
              className={cn('mt-px text-xs', neutralTone ? 'text-[var(--empty-muted-text)]' : 'text-[var(--color-text-muted)]')}
            >
              {description}
            </p>
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
        'flex flex-col items-center justify-center py-[var(--space-empty-block-y)] text-center',
        emphasis && 'py-[var(--space-empty-block-y-emphasis)]',
        className
      )}
    >
      {icon && (
        <div
          className={cn(
            'mb-[var(--space-section-gap)] flex items-center justify-center rounded-2xl',
            neutralTone
              ? 'bg-[var(--surface-neutral)] text-[var(--empty-icon)]'
              : 'bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]',
            emphasis ? 'mb-[var(--space-5)] h-14 w-14' : 'h-12 w-12'
          )}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      <h3
        className={cn(
          'text-[0.9375rem] font-semibold',
          neutralTone ? 'text-[var(--empty-text)]' : 'text-[var(--color-text-primary)]'
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            'mt-1.5 max-w-sm text-[0.8125rem]',
            neutralTone ? 'text-[var(--empty-muted-text)]' : 'text-[var(--color-text-muted)]'
          )}
        >
          {description}
        </p>
      )}
      {action && <div className="mt-[var(--space-section-gap)]">{action}</div>}
    </div>
  )
}
