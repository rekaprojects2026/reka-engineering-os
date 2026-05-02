'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
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
  ChevronLeft,
  ChevronRight,
  FileText,
  Megaphone,
  DollarSign,
  CreditCard,
  Clock,
} from 'lucide-react'
import { logout } from '@/app/auth/login/actions'
import { getInitials } from '@/lib/utils/formatters'
import { getNavPermissions, isDirektur, isManagement, isOwner } from '@/lib/auth/permissions'
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

/** Matches `docs/handoff/05_SIDEBAR_TOPBAR_LOGO_HANDOFF.md` */
const SIDEBAR_COLLAPSED_STORAGE_KEY = 'reka-sidebar-collapsed'

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

export interface NavItem {
  label: string
  href: string
  icon: ReactNode
  badge?: number
}

export type SidebarShellProps = {
  userFullName?: string
  userEmail?: string
  systemRole?: SystemRole | null
  photoUrl?: string | null
  onNavigate?: () => void
  /** Desktop rail only; mobile drawer ignores (always full IA). */
  desktopCollapsed?: boolean
  onRequestCollapse?: () => void
  onRequestExpand?: () => void
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mb-[var(--sidebar-label-mb)] mt-0 px-2 text-[0.625rem] font-medium uppercase tracking-[0.07em]"
      style={{ color: 'var(--sidebar-label)' }}
    >
      {children}
    </p>
  )
}

function SoonBadge() {
  return (
    <span
      className="ml-auto shrink-0 rounded px-1 py-px text-[0.5rem] font-medium uppercase tracking-wide"
      style={{
        backgroundColor: 'var(--border-divider-soft)',
        color: 'var(--sidebar-text-muted)',
      }}
    >
      Soon
    </span>
  )
}

type SidebarNavTier = 'top' | 'nested' | 'deep'

export function SidebarContent({
  userFullName = 'User',
  userEmail = '',
  systemRole = null,
  photoUrl = null,
  onNavigate,
  desktopCollapsed = false,
  onRequestCollapse,
  onRequestExpand,
}: SidebarShellProps) {
  const pathname = usePathname()
  const perms = getNavPermissions(systemRole)
  const isolated = perms.isIsolatedFreelancer

  const [financeRevenueOpen, setFinanceRevenueOpen] = useState(false)
  const [financeExpensesOpen, setFinanceExpensesOpen] = useState(false)
  const [financePayrollOpen, setFinancePayrollOpen] = useState(false)
  const [financeSetupOpen, setFinanceSetupOpen] = useState(false)

  useEffect(() => {
    if (isolated) return
    if (pathname.startsWith('/finance/invoices')) setFinanceRevenueOpen(true)
    if (
      pathname.startsWith('/expenses') ||
      pathname.startsWith('/compensation') ||
      pathname.startsWith('/finance/payslips') ||
      pathname.startsWith('/payments')
    ) {
      setFinanceExpensesOpen(true)
      if (
        pathname.startsWith('/compensation') ||
        pathname.startsWith('/finance/payslips') ||
        pathname.startsWith('/payments')
      ) {
        setFinancePayrollOpen(true)
      }
    }
    if (
      pathname.startsWith('/finance/fx-rates') ||
      pathname.startsWith('/finance/payment-accounts') ||
      pathname.startsWith('/finance/reports')
    ) {
      setFinanceSetupOpen(true)
    }
  }, [pathname, isolated])

  const homeItems: NavItem[] = isolated
    ? []
    : [{ label: perms.labelDashboard, href: '/dashboard', icon: <LayoutDashboard size={16} /> }]

  const myWorkspaceItems: NavItem[] = isolated
    ? [
        { label: perms.labelTasks, href: '/tasks', icon: <CheckSquare size={16} /> },
        ...(perms.showWorkLogs
          ? [{ label: 'Work Logs', href: '/work-logs', icon: <Clock size={16} /> }]
          : []),
        ...(perms.showExpenses ? [{ label: 'Operating Expenses', href: '/expenses', icon: <Receipt size={16} /> }] : []),
      ]
    : []

  const showMyWorkspaceSection = isolated ? myWorkspaceItems.length > 0 : true

  const commercialItems: NavItem[] = isolated
    ? []
    : [
        ...(perms.showLeads ? [{ label: 'Leads', href: '/leads', icon: <Target size={16} /> }] : []),
        ...(perms.showOutreach ? [{ label: 'Outreach', href: '/outreach', icon: <Megaphone size={16} /> }] : []),
        ...(perms.showClients ? [{ label: 'Clients', href: '/clients', icon: <Users size={16} /> }] : []),
      ]

  const showCommercialSection = !isolated && commercialItems.length > 0

  const operationsItems: NavItem[] = isolated
    ? []
    : [
        ...(perms.showProjectsNav
          ? [{ label: perms.labelProjects, href: '/projects', icon: <FolderKanban size={16} /> }]
          : []),
        { label: perms.labelTasks, href: '/tasks', icon: <CheckSquare size={16} /> },
        ...(perms.showWorkLogs
          ? [{ label: 'Work Logs', href: '/work-logs', icon: <Clock size={16} /> }]
          : []),
      ]

  const showOperationsSection = !isolated && operationsItems.length > 0

  const peopleItems: NavItem[] =
    isolated || !perms.showTeam ? [] : [{ label: 'People & Partners', href: '/team', icon: <UserSquare2 size={16} /> }]

  const showPeopleSection = peopleItems.length > 0

  const payrollHasChildren =
    perms.showCompensation || perms.showFinance || perms.showPayments

  const expensesParentVisible =
    !isolated && (perms.showExpenses || payrollHasChildren)

  const revenueParentVisible = !isolated && perms.showFinance

  const financeSetupVisible =
    !isolated &&
    (perms.showFxRates || perms.showPaymentAccounts || isManagement(systemRole))

  const showFinanceBlock =
    !isolated && (revenueParentVisible || expensesParentVisible || financeSetupVisible)

  const adminItems: NavItem[] =
    isolated || !perms.showSettings ? [] : [{ label: 'Settings', href: '/settings', icon: <Settings size={16} /> }]

  const showAdminSection = adminItems.length > 0

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    if (href.startsWith('/settings?')) return pathname.startsWith('/settings')
    return pathname.startsWith(href)
  }

  const renderNavLink = (item: NavItem, tier: SidebarNavTier = 'top') => {
    const active = isActive(item.href)
    const nested = tier !== 'top'
    const deep = tier === 'deep'

    const inactiveColor =
      deep ? 'var(--text-muted-neutral)' : nested ? 'var(--text-secondary-neutral)' : 'var(--sidebar-text)'

    return (
      <li key={item.href} className={cn(nested && 'min-w-0')}>
        <Link
          href={item.href}
          aria-current={active ? 'page' : undefined}
          onClick={() => onNavigate?.()}
          className={cn(
            'flex min-h-[var(--sidebar-nav-row-min-h)] w-full min-w-0 items-center rounded-md text-[0.8125rem] no-underline transition-colors duration-100',
            tier === 'top' && 'gap-2.5 px-2 py-1.5',
            tier === 'nested' && 'gap-2 px-2 py-1.5',
            tier === 'deep' && 'gap-1.5 px-1.5 py-1.5',
            active ? 'font-medium text-[var(--sidebar-active-text)]' : 'font-normal',
            !active && 'hover:bg-[var(--sidebar-hover)]',
            !active && deep && 'opacity-95',
            !active && !deep && 'opacity-90 hover:opacity-100',
          )}
          style={
            active
              ? {
                  backgroundColor: nested ? 'var(--sidebar-nested-active-bg)' : 'var(--sidebar-active-bg)',
                  color: 'var(--sidebar-active-text)',
                }
              : { color: inactiveColor }
          }
        >
          <span
            className={cn(
              'flex shrink-0 items-center justify-center [&_svg]:block',
              tier === 'top' && '[&_svg]:h-4 [&_svg]:w-4',
              nested && '[&_svg]:h-3.5 [&_svg]:w-3.5 opacity-85',
            )}
          >
            {item.icon}
          </span>
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          {item.badge != null && item.badge > 0 && (
            <span
              className="ml-auto flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full px-1 text-[0.5625rem] font-bold"
              style={{ backgroundColor: 'var(--color-danger)', color: 'var(--color-danger-fg)' }}
            >
              {item.badge}
            </span>
          )}
        </Link>
      </li>
    )
  }

  const renderSoonRow = (key: string, label: string, tier: 'top' | 'nested' = 'top') => (
    <li key={key} className={cn(tier === 'nested' && 'min-w-0')}>
      <div
        className={cn(
          'pointer-events-none flex min-h-[var(--sidebar-nav-row-min-h)] min-w-0 items-center rounded-md font-normal text-[0.8125rem]',
          tier === 'top' && 'gap-2 px-2 py-1.5',
          tier === 'nested' && 'gap-1.5 px-2 py-1.5',
        )}
        style={{ color: 'var(--sidebar-text-muted)', opacity: tier === 'nested' ? 0.78 : 0.72 }}
        aria-disabled="true"
      >
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <SoonBadge />
      </div>
    </li>
  )

  const financeAccordionBtn = (
    id: string,
    panelId: string,
    open: boolean,
    setOpen: (v: boolean) => void,
    label: string,
    indentClass = '',
  ) => (
    <button
      type="button"
      id={id}
      className={cn(
        'touch-manipulation flex min-h-[var(--sidebar-nav-row-min-h)] w-full min-w-0 items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-[0.8125rem] font-medium outline-none transition-colors duration-100',
        'text-[var(--text-secondary-neutral)] hover:bg-[var(--sidebar-hover)]',
        open && 'bg-[var(--sidebar-parent-open-bg)] text-[var(--sidebar-text)]',
        'focus-visible:ring-2 focus-visible:ring-[var(--border-strong-neutral)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sidebar-bg)]',
        indentClass,
      )}
      aria-expanded={open}
      aria-controls={panelId}
      onClick={() => setOpen(!open)}
    >
      <span className="min-w-0 truncate">{label}</span>
      <ChevronDown
        size={14}
        strokeWidth={2}
        className={cn(
          'shrink-0 text-[var(--sidebar-text-muted)] transition-transform duration-150',
          open ? 'rotate-180 opacity-65' : 'rotate-0 opacity-45',
        )}
        aria-hidden
      />
    </button>
  )

  const roleLabel = systemRole ? SYSTEM_ROLE_LABELS[systemRole] ?? systemRole : 'Member'

  const earningsItem: NavItem = {
    label: 'Earnings',
    href: '/my-payments',
    icon: <Wallet size={16} />,
  }

  const showUserAccessSoon = perms.showSettings && (isOwner(systemRole) || isDirektur(systemRole))

  return (
    <>
      {desktopCollapsed && onRequestExpand ? (
        <div
          className="group/sbhead relative flex h-14 w-full shrink-0 items-center"
          style={{ borderBottom: '1px solid var(--sidebar-border)' }}
        >
          <div
            className="pointer-events-none absolute left-3 top-1/2 z-0 h-7 w-7 -translate-y-1/2 transition-opacity duration-150 group-hover/sbhead:opacity-[0.28] group-focus-within/sbhead:opacity-[0.28]"
            aria-hidden
          >
            <Image src="/brand/reka-mark.svg" alt="" fill sizes="28px" className="object-contain" priority />
          </div>
          <button
            type="button"
            onClick={onRequestExpand}
            className="absolute inset-0 z-10 flex items-center justify-center rounded-md opacity-0 outline-none transition-opacity duration-150 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-[var(--border-strong-neutral)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sidebar-bg)] group-hover/sbhead:opacity-100"
            style={{ color: 'var(--sidebar-text)' }}
            aria-label="Open sidebar"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <ChevronRight size={18} aria-hidden className="shrink-0" />
          </button>
        </div>
      ) : (
        <div
          className="flex h-14 shrink-0 items-center gap-2.5 px-2 sm:px-2.5 lg:px-3"
          style={{ borderBottom: '1px solid var(--sidebar-border)' }}
        >
          <div className="relative h-7 w-7 shrink-0">
            <Image
              src="/brand/reka-mark.svg"
              alt="REKA Engineering"
              fill
              sizes="28px"
              className="object-contain"
              priority
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.6875rem] leading-tight" style={{ color: 'var(--sidebar-text-muted)' }}>
              {ROLE_CONTEXT[systemRole ?? 'member'] ?? 'Workspace'}
            </p>
          </div>
          {onRequestCollapse ? (
            <button
              type="button"
              onClick={onRequestCollapse}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--border-strong-neutral)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sidebar-bg)]"
              style={{ color: 'var(--sidebar-text-muted)' }}
              aria-label="Collapse sidebar"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <ChevronLeft size={18} aria-hidden className="shrink-0" />
            </button>
          ) : null}
        </div>
      )}

      {!desktopCollapsed ? (
        <nav
          className="flex min-h-0 flex-1 flex-col gap-[var(--sidebar-section-gap)] overflow-y-auto overflow-x-hidden px-2 py-3 sm:px-2.5 sm:py-3.5 lg:px-3"
          aria-label="Main navigation"
        >
          {homeItems.length > 0 ? (
            <div className="flex min-w-0 flex-col gap-1.5">
              <SectionLabel>Home</SectionLabel>
              <ul role="list" className="flex flex-col gap-[var(--sidebar-row-gap)]">
                {homeItems.map((item) => renderNavLink(item, 'top'))}
              </ul>
            </div>
          ) : null}

          {showMyWorkspaceSection ? (
            <div className="flex min-w-0 flex-col gap-1.5">
              <SectionLabel>My Workspace</SectionLabel>
              <ul role="list" className="flex flex-col gap-[var(--sidebar-row-gap)]">
                {isolated ? (
                  myWorkspaceItems.map((item) => renderNavLink(item, 'top'))
                ) : (
                  <>
                    {renderSoonRow('assigned-tasks-soon', 'Assigned Tasks', 'top')}
                    {renderNavLink(earningsItem, 'top')}
                  </>
                )}
              </ul>
            </div>
          ) : null}

          {showCommercialSection ? (
            <div className="flex min-w-0 flex-col gap-1.5">
              <SectionLabel>Commercial</SectionLabel>
              <ul role="list" className="flex flex-col gap-[var(--sidebar-row-gap)]">
                {commercialItems.map((item) => renderNavLink(item, 'top'))}
                {renderSoonRow('contracts-soon', 'Contracts', 'top')}
              </ul>
            </div>
          ) : null}

          {showOperationsSection ? (
            <div className="flex min-w-0 flex-col gap-1.5">
              <SectionLabel>Operations</SectionLabel>
              <ul role="list" className="flex flex-col gap-[var(--sidebar-row-gap)]">
                {operationsItems.map((item) => renderNavLink(item, 'top'))}
              </ul>
            </div>
          ) : null}

          {showPeopleSection ? (
            <div className="flex min-w-0 flex-col gap-1.5">
              <SectionLabel>People</SectionLabel>
              <ul role="list" className="flex flex-col gap-[var(--sidebar-row-gap)]">
                {peopleItems.map((item) => renderNavLink(item, 'top'))}
                {renderSoonRow('talent-pool-soon', 'Talent Pool', 'top')}
              </ul>
            </div>
          ) : null}

          {showFinanceBlock ? (
            <div className="flex min-w-0 flex-col gap-1.5">
              <SectionLabel>Finance</SectionLabel>
              <ul role="list" className="flex min-w-0 flex-col gap-[var(--sidebar-finance-parent-gap)]">
                {revenueParentVisible ? (
                  <li className="list-none">
                    {financeAccordionBtn(
                      'finance-acc-revenue',
                      'finance-panel-revenue',
                      financeRevenueOpen,
                      setFinanceRevenueOpen,
                      'Revenue',
                    )}
                    <div
                      id="finance-panel-revenue"
                      role="region"
                      aria-labelledby="finance-acc-revenue"
                      hidden={!financeRevenueOpen}
                      className="mt-0.5 flex min-w-0 flex-col gap-[var(--sidebar-row-gap)] pl-[var(--sidebar-nest-1)]"
                    >
                      <ul className="flex min-w-0 flex-col gap-[var(--sidebar-row-gap)]">
                        {perms.showFinance
                          ? renderNavLink(
                              {
                                label: 'Invoices',
                                href: '/finance/invoices',
                                icon: <FileText size={16} />,
                              },
                              'nested',
                            )
                          : null}
                        {perms.showFinance ? renderSoonRow('receivables-soon', 'Receivables', 'nested') : null}
                      </ul>
                    </div>
                  </li>
                ) : null}

                {expensesParentVisible ? (
                  <li className="list-none">
                    {financeAccordionBtn(
                      'finance-acc-expenses',
                      'finance-panel-expenses',
                      financeExpensesOpen,
                      setFinanceExpensesOpen,
                      'Expenses',
                    )}
                    <div
                      id="finance-panel-expenses"
                      role="region"
                      aria-labelledby="finance-acc-expenses"
                      hidden={!financeExpensesOpen}
                      className="mt-0.5 flex min-w-0 flex-col gap-[var(--sidebar-row-gap)] pl-[var(--sidebar-nest-1)]"
                    >
                      <ul className="flex min-w-0 flex-col gap-[var(--sidebar-row-gap)]">
                        {perms.showExpenses
                          ? renderNavLink(
                              {
                                label: 'Operating Expenses',
                                href: '/expenses',
                                icon: <Receipt size={16} />,
                              },
                              'nested',
                            )
                          : null}
                        {payrollHasChildren ? (
                          <li className="list-none">
                            {financeAccordionBtn(
                              'finance-acc-payroll',
                              'finance-panel-payroll',
                              financePayrollOpen,
                              setFinancePayrollOpen,
                              'Payroll',
                              'pl-0',
                            )}
                            <div
                              id="finance-panel-payroll"
                              role="region"
                              aria-labelledby="finance-acc-payroll"
                              hidden={!financePayrollOpen}
                              className="mt-0.5 flex min-w-0 flex-col gap-[var(--sidebar-row-gap)] pl-[var(--sidebar-nest-2)]"
                            >
                              <ul className="flex min-w-0 flex-col gap-[var(--sidebar-row-gap)]">
                                {perms.showCompensation
                                  ? renderNavLink(
                                      {
                                        label: 'Compensation',
                                        href: '/compensation',
                                        icon: <Receipt size={16} />,
                                      },
                                      'deep',
                                    )
                                  : null}
                                {perms.showFinance
                                  ? renderNavLink(
                                      {
                                        label: 'Payslips',
                                        href: '/finance/payslips',
                                        icon: <Receipt size={16} />,
                                      },
                                      'deep',
                                    )
                                  : null}
                                {perms.showPayments
                                  ? renderNavLink(
                                      {
                                        label: 'Payments',
                                        href: '/payments',
                                        icon: <Wallet size={16} />,
                                      },
                                      'deep',
                                    )
                                  : null}
                              </ul>
                            </div>
                          </li>
                        ) : null}
                      </ul>
                    </div>
                  </li>
                ) : null}

                {financeSetupVisible ? (
                  <li className="list-none">
                    {financeAccordionBtn(
                      'finance-acc-setup',
                      'finance-panel-setup',
                      financeSetupOpen,
                      setFinanceSetupOpen,
                      'Finance Setup',
                    )}
                    <div
                      id="finance-panel-setup"
                      role="region"
                      aria-labelledby="finance-acc-setup"
                      hidden={!financeSetupOpen}
                      className="mt-0.5 flex min-w-0 flex-col gap-[var(--sidebar-row-gap)] pl-[var(--sidebar-nest-1)]"
                    >
                      <ul className="flex min-w-0 flex-col gap-[var(--sidebar-row-gap)]">
                        {perms.showFxRates
                          ? renderNavLink(
                              {
                                label: 'FX Rates',
                                href: '/finance/fx-rates',
                                icon: <DollarSign size={16} />,
                              },
                              'nested',
                            )
                          : null}
                        {perms.showPaymentAccounts
                          ? renderNavLink(
                              {
                                label: 'Payment Accounts',
                                href: '/finance/payment-accounts',
                                icon: <CreditCard size={16} />,
                              },
                              'nested',
                            )
                          : null}
                        {isManagement(systemRole)
                          ? renderNavLink(
                              {
                                label: 'Reports',
                                href: '/finance/reports',
                                icon: <FileText size={16} />,
                              },
                              'nested',
                            )
                          : null}
                      </ul>
                    </div>
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}

          {showAdminSection ? (
            <div className="flex min-w-0 flex-col gap-1.5">
              <SectionLabel>Admin</SectionLabel>
              <ul role="list" className="flex flex-col gap-[var(--sidebar-row-gap)]">
                {adminItems.map((item) => renderNavLink(item, 'top'))}
                {showUserAccessSoon ? renderSoonRow('user-access-soon', 'User Access', 'top') : null}
              </ul>
            </div>
          ) : null}
        </nav>
      ) : (
        <div className="min-h-0 flex-1" style={{ backgroundColor: 'var(--sidebar-bg)' }} aria-hidden />
      )}

      {!desktopCollapsed ? (
        <div
          className="shrink-0 px-2 py-2.5 sm:px-2.5 sm:py-3 lg:px-3"
          style={{ borderTop: '1px solid var(--sidebar-border)' }}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex w-full min-w-0 items-center gap-2.5 rounded-md px-2 py-2 transition-colors duration-100 outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-strong-neutral)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sidebar-bg)]"
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
                <ChevronDown size={13} style={{ color: 'var(--sidebar-text-muted)', flexShrink: 0 }} aria-hidden />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" sideOffset={4} className="w-52">
              <DropdownMenuItem asChild>
                <Link href="/my-profile" onClick={() => onNavigate?.()} className="flex cursor-pointer items-center gap-2">
                  <UserCircle size={14} className="opacity-60" aria-hidden />
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
                <LogOut size={14} className="opacity-80" aria-hidden />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : null}
    </>
  )
}

export function AppSidebar(props: Omit<SidebarShellProps, 'onNavigate' | 'desktopCollapsed' | 'onRequestCollapse' | 'onRequestExpand'>) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === 'true')
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (collapsed) {
      root.setAttribute('data-sidebar-collapsed', 'true')
    } else {
      root.removeAttribute('data-sidebar-collapsed')
    }
    try {
      if (collapsed) {
        localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, 'true')
      } else {
        localStorage.removeItem(SIDEBAR_COLLAPSED_STORAGE_KEY)
      }
    } catch {
      /* ignore */
    }
  }, [collapsed])

  useEffect(() => {
    return () => {
      document.documentElement.removeAttribute('data-sidebar-collapsed')
    }
  }, [])

  const handleCollapse = useCallback(() => {
    setCollapsed(true)
  }, [])

  const handleExpand = useCallback(() => {
    setCollapsed(false)
  }, [])

  return (
    <aside
      className="hidden h-screen w-[var(--sidebar-width)] shrink-0 flex-col overflow-hidden transition-[width] duration-200 ease-out md:fixed md:inset-y-0 md:left-0 md:z-30 md:flex"
      style={{ backgroundColor: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}
    >
      <SidebarContent
        {...props}
        desktopCollapsed={collapsed}
        onRequestCollapse={handleCollapse}
        onRequestExpand={handleExpand}
      />
    </aside>
  )
}
