'use client'

import { cn } from '@/lib/utils/cn'
import type { ChangeEvent, ReactNode } from 'react'
import { Search, X } from 'lucide-react'

export interface FilterBarProps {
  children?:   ReactNode
  className?:  string
  /** When set, renders the built-in search control (server GET `name` or client `onSearchChange`). */
  searchPlaceholder?: string
  searchName?:         string
  searchDefaultValue?: string
  /** Client-side: notified on input change (does not replace native form submit). */
  onSearchChange?: (value: string) => void
  clearHref?: string
  showClear?: boolean
}

/**
 * FilterBar — filter row for list pages.
 *
 * Supports server GET forms (pass controls as `children` and/or built-in search with `name`),
 * or lightweight client callbacks via `onSearchChange`.
 */
export function FilterBar({
  children,
  className,
  searchPlaceholder,
  searchName = 'search',
  searchDefaultValue,
  onSearchChange,
  clearHref,
  showClear,
}: FilterBarProps) {
  return (
    <div
      role="group"
      aria-label="Filters"
      className={cn(
        'mb-4 flex flex-wrap items-center gap-2',
        className
      )}
    >
      {searchPlaceholder !== undefined && (
        <div className="relative">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
            aria-hidden="true"
          />
          <input
            type="search"
            name={searchName}
            defaultValue={searchDefaultValue}
            placeholder={searchPlaceholder || 'Search...'}
            onChange={
              onSearchChange
                ? (e: ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)
                : undefined
            }
            className="h-9 w-[200px] rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] pl-9 pr-3 text-[0.8125rem] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-subtle)]"
          />
        </div>
      )}

      {children}

      {showClear && clearHref && (
        <a
          href={clearHref}
          className="flex h-9 items-center gap-1.5 rounded-md px-2 text-[0.8125rem] font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-secondary)]"
        >
          <X size={13} aria-hidden="true" />
          Clear
        </a>
      )}
    </div>
  )
}
