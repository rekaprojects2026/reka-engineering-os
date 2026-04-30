import { cn } from '@/lib/utils/cn'
import { PRIORITIES, type Priority } from '@/lib/constants/priorities'

interface PriorityBadgeProps {
  priority: Priority
  className?: string
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = PRIORITIES[priority]

  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap',
        className
      )}
      style={{
        color: config.color,
        backgroundColor: config.bgColor,
        borderRadius: 'var(--radius-pill)',
        padding: '2px 10px',
        fontSize: '0.6875rem',
        fontWeight: 600,
        letterSpacing: '0.01em',
      }}
    >
      {config.label}
    </span>
  )
}
