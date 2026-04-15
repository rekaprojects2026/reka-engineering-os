import { cn } from '@/lib/utils/cn'
import type { ReactNode } from 'react'

interface SectionCardProps {
  title?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
  noPadding?: boolean
}

export function SectionCard({
  title,
  actions,
  children,
  className,
  noPadding = false,
}: SectionCardProps) {
  return (
    <div
      className={cn('rounded-lg', className)}
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      {(title || actions) && (
        <div
          className="flex items-center justify-between gap-4"
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          {title && (
            <h2
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
              }}
            >
              {title}
            </h2>
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-4'}>{children}</div>
    </div>
  )
}
