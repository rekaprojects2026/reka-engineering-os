import { cn } from '@/lib/utils/cn'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-16 px-6',
        className
      )}
    >
      {icon && (
        <div
          className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
          style={{ backgroundColor: 'var(--color-surface-subtle)', color: 'var(--color-text-muted)' }}
        >
          {icon}
        </div>
      )}
      <h3
        className="mb-1 font-semibold"
        style={{ color: 'var(--color-text-primary)', fontSize: '0.9375rem' }}
      >
        {title}
      </h3>
      {description && (
        <p
          className="mb-6 max-w-sm"
          style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', lineHeight: '1.6' }}
        >
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  )
}
