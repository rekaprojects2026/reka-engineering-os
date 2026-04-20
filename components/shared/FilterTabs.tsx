import { cn } from '@/lib/utils/cn'
import Link from 'next/link'

export interface FilterTab {
  value:  string
  label:  string
  count?: number
  href?:  string
}

export interface FilterTabsProps {
  tabs:         FilterTab[]
  activeValue:  string
  className?:   string
  /** Query param for server-side GET links when `tab.href` is omitted. */
  paramName?:   string
  baseHref?:    string
}

function buildTabHref(tab: FilterTab, baseHref: string, paramName: string) {
  if (tab.href) return tab.href
  const sep = baseHref.includes('?') ? '&' : '?'
  return `${baseHref}${sep}${paramName}=${encodeURIComponent(tab.value)}`
}

/**
 * FilterTabs — pill-style tab filter.
 * Supports server-side navigation (Link href) or display-only tabs with explicit `href`.
 */
export function FilterTabs({
  tabs,
  activeValue,
  className,
  paramName = 'status',
  baseHref = '',
}: FilterTabsProps) {
  return (
    <div
      className={cn(
        'mb-4 flex items-center gap-1 rounded-lg bg-[var(--color-surface-muted)] p-1',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.value === activeValue
        const href = buildTabHref(tab, baseHref, paramName)

        return (
          <Link
            key={tab.value}
            href={href}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[0.8125rem] font-medium transition-colors',
              isActive
                ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  'text-[0.6875rem]',
                  isActive ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-text-muted)] opacity-60'
                )}
              >
                {tab.count}
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )
}
