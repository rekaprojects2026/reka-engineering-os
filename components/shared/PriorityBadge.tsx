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
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        className
      )}
      style={{ color: config.color, backgroundColor: config.bgColor }}
    >
      {config.label}
    </span>
  )
}
