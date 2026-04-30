import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

interface FormSectionProps {
  title?:       string
  description?: string
  children:     ReactNode
  first?:       boolean
  className?:   string
}

/**
 * FormSection — a titled section separator for create/edit forms.
 * Use `first={true}` on the first section to suppress the top margin.
 */
export function FormSection({ title, description, children, first = false, className }: FormSectionProps) {
  return (
    <div className={cn('space-y-4', !first && 'mt-6', className)}>
      {(title || description) && (
        <div className="border-b pb-3" style={{ borderColor: 'var(--color-border)' }}>
          {title && (
            <p className="text-xs font-semibold uppercase tracking-[0.05em]" style={{ color: 'var(--color-text-muted)' }}>
              {title}
            </p>
          )}
          {description && (
            <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {description}
            </p>
          )}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}
