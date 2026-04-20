'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FolderKanban,
  CheckSquare,
  FileText,
  Paperclip,
  UserSquare2,
  Receipt,
  Wallet,
  Settings,
  LogOut,
  UserCircle,
  ChevronDown,
} from 'lucide-react'
import { logout } from '@/app/auth/login/actions'
import { getInitials } from '@/lib/utils/formatters'
import { getNavPermissions } from '@/lib/auth/permissions'
import { cn } from '@/lib/utils/cn'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { SystemRole } from '@/types/database'

// ── Role display helpers ──────────────────────────────────────────────────

const ROLE_CONTEXT: Record<string, string> = {
  admin:       'Admin Workspace',
  coordinator: 'Coordinator',
  reviewer:    'Review Queue',
  member:      'My Workspace',
}

const ROLE_LABEL: Record<string, string> = {
  admin:       'Admin',
  coordinator: 'Coordinator',
  reviewer:    'Reviewer',
  member:      'Member',
}

interface NavItem {
  label: string
  href:  string
  icon:  ReactNode
  badge?: number // red badge count, omit if 0
}

interface NavGroup {
  label?: string
  items:  NavItem[]
}

interface AppSidebarProps {
  userFullName?: string
  userEmail?:    string
  systemRole?:   SystemRole | null
}

/**
 * AppSidebar — premium vertical navigation rail.
 *
 * v0-inspired density:
 *   • 248px rail, h-14 brand area
 *   • Groups separated by whitespace (space-y-6), NOT dividers
 *   • Nav items: `rounded-md px-3 py-2 text-sm` with soft hover state
 *   • User footer is a single quiet row — avatar + name/role + signout icon,
 *     no visible inner border
 */
export function AppSidebar({
  userFullName = 'User',
  userEmail    = '',
  systemRole   = null,
}: AppSidebarProps) {
  const pathname = usePathname()
  const perms    = getNavPermissions(systemRole)

  // ── Build nav groups ────────────────────────────────────────

  const mainItems: NavItem[] = [
    { label: perms.labelDashboard, href: '/dashboard', icon: <LayoutDashboard size={16} /> },
  ]

  const operationsItems: NavItem[] = [
    ...(perms.showClients  ? [{ label: 'Clients',      href: '/clients',      icon: <Users size={16} /> }]        : []),
    ...(perms.showIntakes  ? [{ label: 'Intakes',      href: '/intakes',      icon: <ClipboardList size={16} /> }] : []),
    { label: perms.labelProjects,     href: '/projects',     icon: <FolderKanban size={16} /> },
    { label: perms.labelTasks,        href: '/tasks',        icon: <CheckSquare size={16} /> },
    { label: perms.labelDeliverables, href: '/deliverables', icon: <FileText size={16} /> },
    { label: perms.labelFiles,        href: '/files',        icon: <Paperclip size={16} /> },
  ]

  const peopleItems: NavItem[] = [
    ...(perms.showTeam         ? [{ label: 'Team',         href: '/team',         icon: <UserSquare2 size={16} /> }] : []),
    ...(perms.showCompensation ? [{ label: 'Compensation', href: '/compensation', icon: <Receipt size={16} /> }]    : []),
    ...(perms.showPayments     ? [{ label: 'Payments',     href: '/payments',     icon: <Wallet size={16} /> }]     : []),
    ...(perms.showMyPayments   ? [{ label: 'My Payments',  href: '/my-payments',  icon: <Wallet size={16} /> }]     : []),
  ]

  const bottomItems: NavItem[] = [
    ...(perms.showSettings ? [{ label: 'Settings', href: '/settings', icon: <Settings size={16} /> }] : []),
  ]

  const navGroups: NavGroup[] = [
    { items: mainItems },
    { label: 'Operations',  items: operationsItems },
    ...(peopleItems.length  ? [{ label: 'People',     items: peopleItems }]  : []),
    ...(bottomItems.length  ? [{ label: 'Admin',      items: bottomItems }]  : []),
  ]

  // ── Nav item renderer ───────────────────────────────────────

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  const renderItem = (item: NavItem) => {
    const active = isActive(item.href)
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          aria-current={active ? 'page' : undefined}
          className={cn(
            'sidebar-nav-item flex items-center gap-3 rounded-md px-3 py-2.5 text-sm no-underline transition-colors duration-150',
            active
              ? 'bg-[var(--sidebar-active-bg)] font-semibold text-[var(--sidebar-active-text)]'
              : 'font-medium text-[var(--sidebar-text-muted)]'
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'flex shrink-0',
              active ? 'text-[var(--sidebar-active-text)]' : 'text-[var(--sidebar-text-muted)]'
            )}
          >
            {item.icon}
          </span>
          <span className="truncate">{item.label}</span>
          {item.badge !== undefined && item.badge > 0 && (
            <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded bg-[#851E1E] px-1.5 text-[10px] font-semibold text-white">
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          )}
        </Link>
      </li>
    )
  }

  // ── Render ──────────────────────────────────────────────────

  return (
    <aside
      className="sticky top-0 flex h-screen shrink-0 flex-col overflow-hidden border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)]"
      style={{ width: 'var(--sidebar-width)', minWidth: 'var(--sidebar-width)' }}
    >
      {/* ── Brand ─────────────────────────────────────────────── */}
      <div
        className="flex shrink-0 items-center gap-3 border-b border-[var(--sidebar-border)] px-5"
        style={{ height: 'var(--topbar-height)' }}
      >
        <div
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[var(--color-primary)] shadow-[0_1px_3px_rgba(20,45,80,0.35)]"
        >
          <span className="text-[12px] font-bold tracking-[0.02em] text-white">R</span>
        </div>
        <div className="min-w-0 leading-tight">
          <span className="block truncate text-[0.9375rem] font-semibold text-[var(--sidebar-text)]">
            Agency OS
          </span>
          <span className="mt-0.5 block truncate text-[0.6875rem] font-medium text-[var(--sidebar-label)]">
            {systemRole ? (ROLE_CONTEXT[systemRole] ?? 'Engineering Agency') : 'Engineering Agency'}
          </span>
        </div>
      </div>

      {/* ── Nav groups ────────────────────────────────────────── */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label="Main navigation">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className="mb-3 px-3 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-[var(--sidebar-label)]">
                {group.label}
              </p>
            )}
            <ul role="list" className="flex flex-col gap-1">
              {group.items.map(renderItem)}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── Footer ────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-[var(--sidebar-border)] p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-md px-2.5 py-2.5 text-left transition-colors hover:bg-[var(--sidebar-hover)] focus:outline-none"
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-[var(--color-primary)] text-[10px] font-semibold text-white">
                  {getInitials(userFullName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-[0.8125rem] font-semibold text-[var(--sidebar-text)]">
                  {userFullName}
                </p>
                {systemRole && (
                  <p className="mt-0.5 truncate text-[0.6875rem] font-medium capitalize text-[var(--sidebar-text-muted)]">
                    {ROLE_LABEL[systemRole] ?? systemRole}
                  </p>
                )}
              </div>
              <ChevronDown size={14} className="shrink-0 text-[var(--sidebar-text-muted)]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" sideOffset={4} className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/my-profile">
                <UserCircle className="mr-2 h-4 w-4" />
                My Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-[var(--color-danger)] focus:text-[var(--color-danger)] focus:bg-[var(--color-danger-subtle)]"
              onClick={async () => {
                await logout()
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
