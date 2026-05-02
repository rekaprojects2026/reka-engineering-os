'use client'

import Link from 'next/link'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications'
import { cn } from '@/lib/utils/cn'

export function NotificationsBell({ userId }: { userId?: string }) {
  const { items, unread, loading, onItemClick, markAllRead } = useRealtimeNotifications(userId)

  if (!userId) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="relative h-9 w-9 shrink-0 rounded-[var(--radius-control)] border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-muted-neutral)] hover:bg-[var(--surface-neutral)] hover:text-[var(--text-secondary-neutral)]"
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        >
          <Bell size={15} aria-hidden="true" />
          {unread > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border border-[var(--surface-card)] bg-[var(--brand-accent)] px-1 text-[0.5625rem] font-bold leading-none text-white"
            >
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-primary-neutral)]">
        <DropdownMenuLabel className="flex items-center justify-between gap-2 font-semibold">
          <span>Notifications</span>
          {unread > 0 && (
            <button
              type="button"
              className="text-[0.6875rem] font-medium text-[var(--brand-accent)] hover:underline"
              onClick={(e) => {
                e.preventDefault()
                void markAllRead()
              }}
            >
              Mark all read
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading && (
          <div className="px-2 py-4 text-center text-[0.75rem] text-[var(--text-muted-neutral)]">Loading…</div>
        )}
        {!loading && items.length === 0 && (
          <div className="px-2 py-4 text-center text-[0.75rem] text-[var(--text-muted-neutral)]">No notifications yet.</div>
        )}
        {items.map((n) => (
          <DropdownMenuItem
            key={`${n.source}-${n.id}`}
            className={cn('cursor-pointer flex-col items-start gap-0.5 p-3', !n.read && 'bg-[var(--surface-neutral)]')}
            onSelect={(e) => {
              e.preventDefault()
              void onItemClick(n)
            }}
          >
            <div className="flex w-full flex-wrap items-center gap-2">
              <span className="text-[0.8125rem] font-medium text-[var(--text-primary-neutral)]">{n.title}</span>
              {n.source === 'docs' && (
                <span className="rounded border border-[var(--border-default)] bg-[var(--surface-chip)] px-1.5 py-0.5 text-[0.5625rem] font-semibold uppercase tracking-wide text-[var(--text-secondary-neutral)]">
                  Docs
                </span>
              )}
              {n.source === 'os' && (
                <span className="rounded bg-[var(--brand-accent)] px-1.5 py-0.5 text-[0.5625rem] font-semibold uppercase tracking-wide text-white">
                  OS
                </span>
              )}
            </div>
            {n.body && <span className="line-clamp-2 text-[0.75rem] text-[var(--text-muted-neutral)]">{n.body}</span>}
            {n.link && (
              <span className="text-[0.6875rem] text-[var(--brand-accent)]">
                Open →
              </span>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/tasks" className="w-full text-[0.8125rem]">
            View tasks
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
