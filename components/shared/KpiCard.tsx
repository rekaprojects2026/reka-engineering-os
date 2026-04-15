import { cn } from '@/lib/utils/cn'
import type { ReactNode } from 'react'

interface KpiCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  description?: string
  className?: string
}

export function KpiCard({ label, value, icon, description, className }: KpiCardProps) {
  return (
    <div
      className={cn('rounded-lg p-4', className)}
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p
            style={{
              fontSize: '0.75rem',
              fontWeight: 500,
              color: 'var(--color-text-muted)',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {label}
          </p>
          <p
            style={{
              fontSize: '1.625rem',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              lineHeight: 1,
            }}
          >
            {value}
          </p>
          {description && (
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--color-text-muted)',
                marginTop: '4px',
              }}
            >
              {description}
            </p>
          )}
        </div>
        {icon && (
          <div
            style={{
              color: 'var(--color-text-muted)',
              flexShrink: 0,
              marginTop: '2px',
            }}
            aria-hidden="true"
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
