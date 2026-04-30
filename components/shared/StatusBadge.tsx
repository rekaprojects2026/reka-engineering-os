import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'
import type { StatusVariant } from '@/lib/constants/statuses'

interface StatusBadgeProps {
  label:      string
  variant?:   StatusVariant
  className?: string
  dot?:       boolean
}

/**
 * StatusBadge — the single shared badge primitive for all status displays.
 *
 * Colors are driven by CSS variables (--badge-*) defined in globals.css.
 * Stage 4 will migrate all module-specific badge components to use this primitive.
 *
 * Variants map to semantic states:
 *   neutral — new, draft, on-hold, default
 *   active  — ongoing, in-progress, confirmed, active
 *   review  — awaiting review, partial, warning states
 *   success — completed, paid, approved, done
 *   danger  — overdue, blocked, cancelled, revision, urgent
 */
export function StatusBadge({ label, variant = 'neutral', className, dot }: StatusBadgeProps) {
  return (
    <Badge
      variant={variant}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[0.6875rem] font-semibold tracking-[0.01em]',
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 shrink-0 rounded-full',
            variant === 'success' && 'bg-[var(--success)]',
            variant === 'review' && 'bg-[var(--warning)]',
            variant === 'danger' && 'bg-[var(--danger)]',
            variant === 'active' && 'bg-[var(--color-primary)]',
            variant === 'neutral' && 'bg-[var(--color-text-muted)]'
          )}
        />
      )}
      {label}
    </Badge>
  )
}
