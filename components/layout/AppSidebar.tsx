'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Target,
  FolderKanban,
  CheckSquare,
  UserSquare2,
  Receipt,
  Wallet,
  Settings,
  LogOut,
  UserCircle,
  ChevronDown,
  FileText,
  Megaphone,
  DollarSign,
  CreditCard,
  Clock,
} from 'lucide-react'
import { logout } from '@/app/auth/login/actions'
import { getInitials } from '@/lib/utils/formatters'
import { getNavPermissions } from '@/lib/auth/permissions'
import { SYSTEM_ROLE_LABELS } from '@/lib/constants/options'
import { cn } from '@/lib/utils/cn'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { SystemRole } from '@/types/database'

const ROLE_CONTEXT: Record<string, string> = {
  direktur: 'Direktur',
  technical_director: 'Technical',
  finance: 'Finance',
  manajer: 'Manajer',
  bd: 'BD',
  senior: 'Review',
  member: 'My Workspace',
  freelancer: 'Tasks',
}

interface NavItem {
  label: string
  href: string
  icon: ReactNode
  badge?: number
}

interface NavGroup {
  label?: string
  items: NavItem[]
}

export type SidebarShellProps = {
  userFullName?: string
  userEmail?: string
  systemRole?: SystemRole | null
  photoUrl?: string | null
  onNavigate?: () => void
}

export function SidebarContent({
  userFullName = 'User',
  userEmail = '',
  systemRole = null,
  photoUrl = null,
  onNavigate,
}: SidebarShellProps) {
  const pathname = usePathname()
  const perms = getNavPermissions(systemRole)
  const isolated = perms.isIsolatedFreelancer

  const mainItems: NavItem[] = isolated
    ? []
    : [{ label: perms.labelDashboard, href: '/dashboard', icon: <LayoutDashboard size={16} /> }]

  const operationsItems: NavItem[] = isolated
    ? [
        { label: perms.labelTasks, href: '/tasks', icon: <CheckSquare size={16} /> },
        ...(perms.showWorkLogs
          ? [{ label: 'Work Logs', href: '/work-logs', icon: <Clock size={16} /> }]
          : []),
        ...(perms.showExpenses ? [{ label: 'Expenses', href: '/expenses', icon: <Receipt size={16} /> }] : []),
      ]
    : [
        ...(perms.showLeads ? [{ label: 'Leads', href: '/leads', icon: <Target size={16} /> }] : []),
        ...(perms.showOutreach ? [{ label: 'Outreach', href: '/outreach', icon: <Megaphone size={16} /> }] : []),
        ...(perms.showClients ? [{ label: 'Clients', href: '/clients', icon: <Users size={16} /> }] : []),
        ...(perms.showProjectsNav
          ? [{ label: perms.labelProjects, href: '/projects', icon: <FolderKanban size={16} /> }]
          : []),
        { label: perms.labelTasks, href: '/tasks', icon: <CheckSquare size={16} /> },
        ...(perms.showWorkLogs
          ? [{ label: 'Work Logs', href: '/work-logs', icon: <Clock size={16} /> }]
          : []),
        ...(perms.showExpenses ? [{ label: 'Expenses', href: '/expenses', icon: <Receipt size={16} /> }] : []),
      ]

  const financeItems: NavItem[] = isolated
    ? []
    : [
        ...(perms.showFinance
          ? [{ label: 'Invoices', href: '/finance/invoices', icon: <FileText size={16} /> }]
          : []),
        ...(perms.showCompensation
          ? [{ label: 'Compensation', href: '/compensation', icon: <Receipt size={16} /> }]
          : []),
        ...(perms.showFinance
          ? [{ label: 'Payslips', href: '/finance/payslips', icon: <Receipt size={16} /> }]
          : []),
        ...(perms.showPayments ? [{ label: 'Payments', href: '/payments', icon: <Wallet size={16} /> }] : []),
        ...(perms.showMyPayments
          ? [{ label: 'My Payments', href: '/my-payments', icon: <Wallet size={16} /> }]
          : []),
        ...(perms.showFxRates
          ? [{ label: 'FX Rates', href: '/finance/fx-rates', icon: <DollarSign size={16} /> }]
          : []),
        ...(perms.showPaymentAccounts
          ? [{ label: 'Payment Accounts', href: '/finance/payment-accounts', icon: <CreditCard size={16} /> }]
          : []),
      ]

  const peopleItems: NavItem[] =
    isolated || !perms.showTeam ? [] : [{ label: 'Team', href: '/team', icon: <UserSquare2 size={16} /> }]

  const bottomItems: NavItem[] =
    isolated || !perms.showSettings ? [] : [{ label: 'Settings', href: '/settings', icon: <Settings size={16} /> }]

  const navGroups: NavGroup[] = isolated
    ? [
        { items: operationsItems },
        ...(financeItems.length ? [{ label: 'Finance', items: financeItems }] : []),
      ]
    : [
        { items: mainItems },
        { label: 'Operations', items: operationsItems },
        ...(financeItems.length ? [{ label: 'Finance', items: financeItems }] : []),
        ...(peopleItems.length ? [{ label: 'People', items: peopleItems }] : []),
        ...(bottomItems.length ? [{ label: 'Admin', items: bottomItems }] : []),
      ]

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    if (href.startsWith('/settings?')) return pathname.startsWith('/settings')
    return pathname.startsWith(href)
  }

  const renderItem = (item: NavItem) => {
    const active = isActive(item.href)
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          aria-current={active ? 'page' : undefined}
          onClick={() => onNavigate?.()}
          className={cn(
            'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[0.8125rem] font-medium transition-all duration-100 no-underline',
            active ? 'text-[var(--sidebar-active-text)]' : 'opacity-70 hover:opacity-100',
          )}
          style={
            active
              ? { backgroundColor: 'var(--sidebar-active-bg)', color: 'var(--sidebar-active-text)' }
              : { color: 'var(--sidebar-text)' }
          }
        >
          <span className={cn('shrink-0', active ? 'opacity-100' : 'opacity-70')}>{item.icon}</span>
          <span className="truncate">{item.label}</span>
          {item.badge != null && item.badge > 0 && (
            <span
              className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[0.5625rem] font-bold"
              style={{ backgroundColor: 'var(--color-danger)', color: 'var(--color-danger-fg)' }}
            >
              {item.badge}
            </span>
          )}
        </Link>
      </li>
    )
  }

  const roleLabel = systemRole ? SYSTEM_ROLE_LABELS[systemRole] ?? systemRole : 'Member'

  return (
    <>
      <div
        className="flex h-14 shrink-0 items-center gap-2.5 px-4"
        style={{ borderBottom: '1px solid var(--sidebar-border)' }}
      >
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1"
          style={
            {
              backgroundColor: 'rgba(255,255,255,0.08)',
              '--tw-ring-color': 'rgba(255,255,255,0.12)',
            } as React.CSSProperties
          }
        >
          <span className="text-xs font-bold" style={{ color: 'var(--sidebar-text)' }}>
            R
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--sidebar-text)' }}>
            ReKa
          </p>
          <p className="truncate text-[0.6875rem] leading-tight" style={{ color: 'var(--sidebar-text-muted)' }}>
            {ROLE_CONTEXT[systemRole ?? 'member'] ?? 'Workspace'}
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Main navigation">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p
                className="mb-1 px-2 text-[0.625rem] font-semibold uppercase tracking-[0.1em]"
                style={{ color: 'var(--sidebar-label)' }}
              >
                {group.label}
              </p>
            )}
            <ul role="list" className="flex flex-col gap-1">
              {group.items.map(renderItem)}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 px-3 py-3" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 transition-colors duration-100 outline-none"
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Avatar className="h-7 w-7 shrink-0">
                {photoUrl && <AvatarImage src={photoUrl} alt={userFullName} />}
                <AvatarFallback
                  className="text-[0.6875rem] font-semibold"
                  style={{ backgroundColor: 'var(--sidebar-active-bg)', color: 'var(--sidebar-text)' }}
                >
                  {getInitials(userFullName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-[0.8125rem] font-medium leading-tight" style={{ color: 'var(--sidebar-text)' }}>
                  {userFullName}
                </p>
                <p className="truncate text-[0.6875rem] leading-tight" style={{ color: 'var(--sidebar-text-muted)' }}>
                  {roleLabel}
                </p>
              </div>
              <ChevronDown size={13} style={{ color: 'var(--sidebar-text-muted)', flexShrink: 0 }} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" sideOffset={4} className="w-52">
            <DropdownMenuItem asChild>
              <Link href="/my-profile" onClick={() => onNavigate?.()} className="flex cursor-pointer items-center gap-2">
                <UserCircle size={14} className="opacity-60" />
                My Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-2 text-[var(--color-danger)] focus:text-[var(--color-danger)]"
              onClick={async () => {
                await logout()
              }}
            >
              <LogOut size={14} className="opacity-80" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )
}

export function AppSidebar(props: Omit<SidebarShellProps, 'onNavigate'>) {
  return (
    <aside
      className="hidden h-screen w-[var(--sidebar-width)] shrink-0 flex-col overflow-hidden md:fixed md:inset-y-0 md:left-0 md:z-30 md:flex"
      style={{ backgroundColor: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}
    >
      <SidebarContent {...props} />
    </aside>
  )
}
