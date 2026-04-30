'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { NotificationsBell } from '@/components/layout/NotificationsBell'

interface AppTopbarProps {
  left?: ReactNode
  right?: ReactNode
  showSearch?: boolean
  /** When set, enables realtime notification bell (Supabase `notifications` + Realtime). */
  notificationUserId?: string
}

/**
 * AppTopbar — sticky top shell. h-[var(--topbar-height)], single hairline
 * border, search bar with keyboard shortcut hint, notification bell.
 */
export function AppTopbar({ left, right, showSearch = false, notificationUserId }: AppTopbarProps) {
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

      {/* Right — search + actions (search hidden below md to avoid horizontal scroll) */}
      <div className="flex min-w-0 shrink-0 items-center gap-2">
        {/* Search shortcut link — desktop only; mobile uses hamburger nav */}
        {showSearch && (
          <Link
            href="/search"
            className="group hidden h-8 items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-secondary)] transition-all duration-150 no-underline md:flex"
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

        {right != null && <div className="hidden min-w-0 md:block">{right}</div>}

        <NotificationsBell userId={notificationUserId} />
      </div>
    </header>
  )
}
