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
    <Card className={cn('overflow-hidden border-[var(--border-default)] bg-[var(--surface-card)]', className)}>
      {hasHeader && (
        <CardHeader className="flex-row items-start justify-between gap-4 border-b border-[var(--table-border)] bg-[var(--surface-neutral)] px-[var(--table-edge-padding-x)] py-3.5 rounded-t-[var(--radius-card)]">
          <div className="min-w-0">
            {title && (
              <CardTitle className="text-[0.875rem] text-[var(--text-primary-neutral)]">{title}</CardTitle>
            )}
            {description && (
              <CardDescription className={cn('text-[var(--text-muted-neutral)]', title ? 'mt-0.5' : '')}>
                {description}
              </CardDescription>
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
        <CardContent className="px-[var(--table-edge-padding-x)] py-4">{children}</CardContent>
      )}
    </Card>
  )
}
