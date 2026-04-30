import { cn } from '@/lib/utils/cn'
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent } from '@/components/ui/card'
import type { ReactNode } from 'react'

interface SectionCardProps {
  title?:       string
  description?: string
  actions?:     ReactNode
  children:     ReactNode
  className?:   string
  noPadding?:   boolean
}

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
  noPadding = false,
}: SectionCardProps) {
  const hasHeader = Boolean(title || description || actions)

  return (
    <Card className={cn('overflow-hidden', className)}>
      {hasHeader && (
        <CardHeader className="flex-row items-start justify-between gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] py-3 px-4 rounded-t-[var(--radius-card)]">
          <div className="min-w-0">
            {title && (
              <CardTitle className="text-[0.875rem]">{title}</CardTitle>
            )}
            {description && (
              <CardDescription className={title ? 'mt-0.5' : ''}>{description}</CardDescription>
            )}
          </div>
          {actions && (
            <CardAction className="shrink-0">{actions}</CardAction>
          )}
        </CardHeader>
      )}
      {noPadding ? (
        <div>{children}</div>
      ) : (
        <CardContent className="p-4">{children}</CardContent>
      )}
    </Card>
  )
}
