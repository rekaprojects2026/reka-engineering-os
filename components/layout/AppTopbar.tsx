'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { Search, Bell } from 'lucide-react'

interface AppTopbarProps {
  left?: ReactNode
  right?: ReactNode
  showSearch?: boolean
}

/**
 * AppTopbar — sticky top shell. h-[var(--topbar-height)], single hairline
 * border, search bar with keyboard shortcut hint, notification bell.
 */
export function AppTopbar({ left, right, showSearch = false }: AppTopbarProps) {
  return (
    <header
      className="sticky top-0 z-10 flex h-[var(--topbar-height)] shrink-0 items-center gap-4 px-5"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {/* Left — breadcrumb */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {left}
      </div>

      {/* Right — search + actions */}
      <div className="flex shrink-0 items-center gap-2">
        {/* Search bar */}
        {showSearch && (
          <Link
            href="/search"
            className="group flex h-8 items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-secondary)] transition-all duration-150 no-underline"
            style={{ minWidth: '220px' }}
          >
            <Search size={13} aria-hidden="true" className="shrink-0" />
            <span className="flex-1 text-xs">Search projects, tasks, files...</span>
            <kbd
              className="hidden items-center gap-0.5 rounded px-1 py-0.5 text-[0.5625rem] font-medium sm:flex"
              style={{
                backgroundColor: 'var(--color-border)',
                color: 'var(--color-text-muted)',
                border: '1px solid var(--color-border-strong)',
              }}
            >
              ⌘K
            </kbd>
          </Link>
        )}

        {right}

        {/* Notification bell */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-secondary)] transition-colors duration-100"
        >
          <Bell size={15} aria-hidden="true" />
        </button>
      </div>
    </header>
  )
}
