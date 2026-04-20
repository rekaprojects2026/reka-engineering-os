import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import type { ReactNode } from 'react'

export interface SectionHeaderProps {
  title:        string
  description?: string
  children?:    ReactNode
  className?:   string
}

export function SectionHeader({ title, description, children, className }: SectionHeaderProps) {
  return (
    <div className={cn('mb-4 flex items-center justify-between gap-4', className)}>
      <div>
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">{title}</h2>
        {description && (
          <p className="mt-0.5 text-[0.8125rem] text-[var(--color-text-muted)]">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex shrink-0 items-center gap-2">{children}</div>
      )}
    </div>
  )
}

interface PageHeaderProps {
  title:      string
  subtitle?:  string
  actions?:   ReactNode
  className?: string
  /** Optional back-link rendered above the title. Used on detail and edit pages. */
  breadcrumb?: { label: string; href: string }
}

/**
 * PageHeader — top of every page. Premium typography:
 *   • Title: text-2xl / semibold / tracking-tight
 *   • Subtitle: 0.875rem / muted, sits with a small top gap
 *   • Optional breadcrumb above the title, optional actions aligned right
 */
export function PageHeader({ title, subtitle, actions, className, breadcrumb }: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      {/* Left: optional breadcrumb + title + subtitle */}
      <div className="min-w-0">
        {breadcrumb && (
          <Link
            href={breadcrumb.href}
            className="mb-1.5 inline-flex items-center gap-1 text-xs font-medium text-[var(--color-text-muted)] no-underline transition-colors hover:text-[var(--color-primary)]"
          >
            ← {breadcrumb.label}
          </Link>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-[0.875rem] leading-snug text-[var(--color-text-muted)]">
            {subtitle}
          </p>
        )}
      </div>

      {/* Right: action buttons */}
      {actions && (
        <div
          className={cn('flex shrink-0 items-center gap-2', breadcrumb ? 'mt-7' : 'mt-1')}
        >
          {actions}
        </div>
      )}
    </div>
  )
}
