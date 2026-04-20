import React, { type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Card } from '@/components/ui/card'

export interface KpiCardTrend {
  value:       number
  label:       string
  isPositive?: boolean
}

export interface KpiCardProps {
  /** v0-ui naming (preferred) */
  title?:       string
  /** Legacy naming */
  label?:       string
  value:        string | number
  subtitle?:    string
  /** Legacy — same role as `subtitle` */
  description?: string
  icon?:        LucideIcon | ReactNode
  trend?:       KpiCardTrend
  /** v0-ui variant names */
  variant?:     'default' | 'warning' | 'danger' | 'dashboard'
  /** Legacy accent names */
  accent?:      'none' | 'primary' | 'urgent' | 'warning'
  className?:  string
}

function resolveVisualTone(
  variant: KpiCardProps['variant'],
  accent: KpiCardProps['accent']
) {
  const v = variant === 'dashboard' ? 'default' : variant
  if (v === 'danger' || accent === 'urgent') return 'danger' as const
  if (v === 'warning' || accent === 'warning') return 'warning' as const
  if (accent === 'primary') return 'primary' as const
  return 'default' as const
}

/**
 * KpiCard — headline metric tile, stripped to v0 discipline.
 *
 *   • p-4 padding, compact tile.
 *   • Supports `title` or legacy `label`, optional `trend`, `subtitle` / `description`.
 *   • `variant` (v0) and `accent` (legacy) combine per resolve rules.
 */
export function KpiCard({
  title,
  label,
  value,
  subtitle,
  description,
  icon,
  trend,
  className,
  variant = 'default',
  accent = 'none',
}: KpiCardProps) {
  const heading = title ?? label ?? ''
  const subline = subtitle ?? description

  const tone = resolveVisualTone(variant, accent)

  const valueTone =
    tone === 'danger'  ? 'text-[var(--color-danger)]'  :
    tone === 'warning' ? 'text-[var(--color-warning)]' :
    'text-[var(--color-text-primary)]'

  const iconPill =
    tone === 'danger'  ? 'bg-[var(--color-danger-subtle)]  text-[var(--color-danger)]'  :
    tone === 'warning' ? 'bg-[var(--color-warning-subtle)] text-[var(--color-warning)]' :
    tone === 'primary' ? 'bg-[var(--color-primary-subtle)] text-[var(--color-primary)]' :
    'bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]'

  const accentBar =
    tone === 'danger'  ? 'border-l-2 border-l-[var(--color-danger)]'  :
    tone === 'warning' ? 'border-l-2 border-l-[var(--color-warning)]' :
    tone === 'primary' ? 'border-l-2 border-l-[var(--color-primary)]' :
    ''

  const iconContent = icon
    ? React.isValidElement(icon)
      ? icon
      : React.createElement(icon as React.ElementType, { className: 'h-4 w-4' })
    : null

  return (
    <Card className={cn('kpi-card-hover p-4', accentBar, className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
            {heading}
          </p>
          <p
            className={cn(
              'text-2xl font-semibold leading-tight tracking-tight tabular-nums',
              valueTone
            )}
          >
            {value}
          </p>
          {trend && (
            <p
              className={cn(
                'mt-1 text-xs font-medium',
                trend.isPositive ? 'text-[var(--success)]' : 'text-[var(--danger)]'
              )}
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
          {subline && (
            <p className="text-[0.75rem] leading-snug text-[var(--color-text-muted)]">
              {subline}
            </p>
          )}
        </div>

        {icon != null && (
          <div
            aria-hidden="true"
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
              iconPill
            )}
          >
            {iconContent}
          </div>
        )}
      </div>
    </Card>
  )
}

export function KpiStrip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6', className)}>
      {children}
    </div>
  )
}
