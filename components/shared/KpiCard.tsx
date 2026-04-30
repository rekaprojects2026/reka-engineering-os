import React, { type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

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
  variant?:     'default' | 'warning' | 'danger' | 'dashboard' | 'success'
  /** Legacy accent names */
  accent?:      'none' | 'primary' | 'urgent' | 'warning'
  /** Muted headline value (e.g. contra-revenue lines). */
  muted?:       boolean
  className?:  string
}

function resolveVisualTone(
  variant: KpiCardProps['variant'],
  accent: KpiCardProps['accent']
) {
  const v = variant === 'dashboard' ? 'default' : variant
  if (v === 'danger' || accent === 'urgent') return 'danger' as const
  if (v === 'warning' || accent === 'warning') return 'warning' as const
  if (v === 'success') return 'success' as const
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
  muted = false,
}: KpiCardProps) {
  const heading = title ?? label ?? ''
  const subline = subtitle ?? description

  const tone = resolveVisualTone(variant, accent)

  const valueTone = muted
    ? 'text-[var(--color-text-muted)]'
    : tone === 'danger'  ? 'text-[var(--color-danger)]'  :
    tone === 'warning' ? 'text-[var(--color-warning)]' :
    tone === 'success' ? 'text-[var(--color-success)]' :
    'text-[var(--color-text-primary)]'

  const iconPill =
    tone === 'danger'  ? 'bg-[var(--color-danger-subtle)]  text-[var(--color-danger)]'  :
    tone === 'warning' ? 'bg-[var(--color-warning-subtle)] text-[var(--color-warning)]' :
    tone === 'success' ? 'bg-[var(--color-success-subtle)] text-[var(--color-success)]' :
    tone === 'primary' ? 'bg-[var(--color-primary-subtle)] text-[var(--color-primary)]' :
    'bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]'

  const iconContent = icon
    ? React.isValidElement(icon)
      ? icon
      : React.createElement(icon as React.ElementType, { className: 'h-4 w-4' })
    : null

  return (
    <div
      className={cn(
        'kpi-card-hover relative overflow-hidden rounded-[var(--radius-card)] p-4',
        'border bg-[var(--color-surface)]',
        tone === 'danger'  ? 'border-[var(--color-danger)]/20'  :
        tone === 'warning' ? 'border-[var(--color-warning)]/20' :
        tone === 'success' ? 'border-[var(--color-success)]/20' :
        'border-[var(--color-border)]',
        className
      )}
      style={{ boxShadow: 'var(--shadow-sm)' }}
    >
      {/* Accent bar — left edge color stripe */}
      <div
        className={cn(
          'absolute left-0 top-0 h-full w-0.5',
          tone === 'danger'  ? 'bg-[var(--color-danger)]'  :
          tone === 'warning' ? 'bg-[var(--color-warning)]' :
          tone === 'success' ? 'bg-[var(--color-success)]' :
          tone === 'primary' ? 'bg-[var(--color-primary)]' :
          'bg-transparent'
        )}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <p
            className="text-[0.625rem] font-semibold uppercase tracking-[0.09em]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {heading}
          </p>

          <p
            className={cn(
              'text-2xl font-semibold leading-none tracking-tight tabular-nums',
              valueTone
            )}
          >
            {value}
          </p>

          {trend && (
            <p
              className={cn(
                'flex items-center gap-0.5 text-[0.6875rem] font-medium',
                trend.isPositive ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'
              )}
            >
              {trend.isPositive ? '↑' : '↓'}
              {Math.abs(trend.value)}% {trend.label}
            </p>
          )}

          {subline && (
            <p className="text-[0.75rem] leading-snug" style={{ color: 'var(--color-text-muted)' }}>
              {subline}
            </p>
          )}
        </div>

        {icon != null && (
          <div
            aria-hidden="true"
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
              iconPill
            )}
          >
            {iconContent}
          </div>
        )}
      </div>
    </div>
  )
}

export function KpiStrip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6', className)}>
      {children}
    </div>
  )
}
