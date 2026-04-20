import type { ReactNode } from 'react'
import Link from 'next/link'
import { Search, Bell } from 'lucide-react'

interface AppTopbarProps {
  left?: ReactNode
  right?: ReactNode
  showSearch?: boolean
}

/**
 * AppTopbar — sticky top shell. Slightly taller (56px) to match the sidebar
 * brand area; uses a single hairline border instead of a shadow drop so
 * the scroll region below reads as one continuous surface.
 */
export function AppTopbar({ left, right, showSearch = false }: AppTopbarProps) {
  return (
    <header
      className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6"
      style={{ height: 'var(--topbar-height)' }}
    >
      {/* Left — breadcrumb / page context */}
      <div className="flex min-w-0 items-center gap-2">{left}</div>

      {/* Right — search, actions, notification */}
      <div className="flex shrink-0 items-center gap-2">
        {showSearch && (
          <Link
            href="/search"
            className="flex h-8 items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 text-[0.8125rem] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-secondary)]"
            style={{ minWidth: '200px' }}
          >
            <Search size={13} aria-hidden="true" />
            <span>Search...</span>
            <kbd className="ml-auto text-[0.625rem] font-medium text-[var(--color-text-muted)] opacity-70">⌘K</kbd>
          </Link>
        )}

        {right}

        <Link
          href="/search"
          aria-label="Search"
          className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-secondary)]"
        >
          <Bell size={16} aria-hidden="true" />
        </Link>
      </div>
    </header>
  )
}
