import { cn } from '@/lib/utils/cn'
import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn('flex items-start justify-between gap-4 mb-6', className)}
    >
      <div className="min-w-0">
        <h1
          style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            lineHeight: 1.3,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              fontSize: '0.8125rem',
              color: 'var(--color-text-muted)',
              marginTop: '3px',
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0 mt-0.5">
          {actions}
        </div>
      )}
    </div>
  )
}
