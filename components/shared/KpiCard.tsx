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
    ? 'text-[var(--text-muted-neutral)]'
    : tone === 'danger'  ? 'text-[var(--color-danger)]' :
    tone === 'warning' ? 'text-[var(--color-warning)]' :
    tone === 'success' ? 'text-[var(--color-success)]' :
    'text-[var(--text-primary-neutral)]'

  const iconTone =
    tone === 'danger' ? 'text-[var(--color-danger)]' :
    tone === 'warning' ? 'text-[var(--color-warning)]' :
    tone === 'success' ? 'text-[var(--color-success)]' :
    tone === 'primary' ? 'text-[var(--brand-accent)]' :
    'text-[var(--text-muted-neutral)]'

  const accentBarTone =
    tone === 'danger' ? 'bg-[var(--color-danger)]' :
    tone === 'warning' ? 'bg-[var(--color-warning)]' :
    tone === 'success' ? 'bg-[var(--color-success)]' :
    tone === 'primary' ? 'bg-[var(--brand-accent)]' :
    'bg-transparent'

  const accentBorderTone =
    tone === 'danger' ? 'border-l-[var(--color-danger)]/25' :
    tone === 'warning' ? 'border-l-[var(--color-warning)]/25' :
    tone === 'success' ? 'border-l-[var(--color-success)]/25' :
    tone === 'primary' ? 'border-l-[var(--brand-accent)]/25' :
    'border-l-[var(--border-default)]'

  const iconContent = icon
    ? React.isValidElement(icon)
      ? icon
      : React.createElement(icon as React.ElementType, { className: 'h-3.5 w-3.5' })
    : null

  return (
    <div
      className={cn(
        'kpi-card-hover relative overflow-hidden rounded-[var(--radius-card)] border border-l-2 bg-[var(--surface-card)] px-4 py-3.5',
        tone === 'danger' ? 'border-[var(--border-default)]' :
        tone === 'warning' ? 'border-[var(--border-default)]' :
        tone === 'success' ? 'border-[var(--border-default)]' :
        tone === 'primary' ? 'border-[var(--border-default)]' :
        'border-[var(--border-default)]',
        accentBorderTone,
        className
      )}
      style={{ boxShadow: 'var(--shadow-sm)' }}
    >
      {/* Subtle top accent to preserve semantic tone without saturating card body */}
      <div
        className={cn(
          'absolute left-0 top-0 h-0.5 w-full',
          accentBarTone
        )}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <p
            className="text-[0.625rem] font-semibold uppercase tracking-[0.09em] text-[var(--text-muted-neutral)]"
          >
            {heading}
          </p>

          <p
            className={cn(
              'text-[1.7rem] font-bold leading-[1.05] tracking-tight tabular-nums',
              valueTone
            )}
          >
            {value}
          </p>

          {trend && (
            <p
              className={cn(
                'flex items-center gap-0.5 text-[0.6875rem] font-medium leading-tight',
                trend.isPositive ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'
              )}
            >
              {trend.isPositive ? '↑' : '↓'}
              {Math.abs(trend.value)}% {trend.label}
            </p>
          )}

          {subline && (
            <p className="line-clamp-1 text-[0.75rem] leading-snug text-[var(--text-soft-muted)]">
              {subline}
            </p>
          )}
        </div>

        {icon != null && (
          <div
            aria-hidden="true"
            className={cn(
              'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--surface-neutral)]',
              iconTone
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
