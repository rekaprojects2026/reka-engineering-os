'use client'

import type { ReactNode } from 'react'
import { NotificationsBell } from '@/components/layout/NotificationsBell'

interface AppTopbarProps {
  left?: ReactNode
  right?: ReactNode
  /** When set, enables realtime notification bell (Supabase `notifications` + Realtime). */
  notificationUserId?: string
}

/**
 * AppTopbar — sticky top shell. Single hairline border, neutral surface;
 * left slot (breadcrumb), right slot (e.g. TopbarSearch), notification bell.
 */
export function AppTopbar({ left, right, notificationUserId }: AppTopbarProps) {
  return (
    <header
      className="sticky top-0 z-10 flex h-[var(--topbar-height)] shrink-0 items-center gap-3 border-b border-[var(--border-default)] bg-[var(--surface-card)] px-4 sm:px-8 md:px-12 xl:px-14"
    >
      {/* Left — breadcrumb + mobile trigger */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {left}
      </div>

      {/* Right — search (md+) + notifications; search lives in `right` only to avoid duplicate controls */}
      <div className="flex min-w-0 shrink-0 items-center gap-2 md:gap-3">
        {right != null && <div className="hidden min-w-0 md:flex md:items-center">{right}</div>}

        <NotificationsBell userId={notificationUserId} />
      </div>
    </header>
  )
}
