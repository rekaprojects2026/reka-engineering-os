'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { Users, FolderKanban, Settings, LogOut, UserCircle, ChevronDown, ChevronLeft, ChevronRight, Megaphone, Banknote } from 'lucide-react'
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
const SIDEBAR_SECTION_OPEN_STORAGE_KEY = 'reka-sidebar-sections-open'

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
  /** Top-level rows only; nested links omit for text-only child rows. */
  icon?: ReactNode
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

function SectionHeader({
  id,
  panelId,
  label,
  icon,
  collapsible,
  open,
  onToggle,
}: {
  id: string
  panelId?: string
  label: string
  icon?: ReactNode
  collapsible: boolean
  open?: boolean
  onToggle?: () => void
}) {
  const content = (
    <>
      {icon ? (
        <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center text-[var(--sidebar-nav-section-label)]">{icon}</span>
      ) : null}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {collapsible ? (
        <ChevronDown
          size={12}
          strokeWidth={2}
          className={cn('ml-auto shrink-0 transition-transform duration-150', open ? 'rotate-180' : 'rotate-0')}
          style={{ color: 'var(--sidebar-nav-section-label)' }}
          aria-hidden
        />
      ) : null}
    </>
  )

  if (!collapsible) {
    return (
      <div
        id={id}
        className="mb-[var(--sidebar-label-mb)] mt-0 flex items-center gap-2 pl-[var(--sidebar-nav-item-px)] pr-[var(--sidebar-nav-item-px)] text-[11px] font-semibold uppercase leading-tight tracking-[0.08em]"
        style={{ color: 'var(--sidebar-nav-section-label)' }}
      >
        {content}
      </div>
    )
  }

  return (
    <button
      type="button"
      id={id}
      aria-controls={panelId}
      aria-expanded={open}
      onClick={onToggle}
      className="mb-[var(--sidebar-label-mb)] mt-0 flex w-full items-center gap-2 pl-[var(--sidebar-nav-item-px)] pr-[var(--sidebar-nav-item-px)] text-left text-[11px] font-semibold uppercase leading-tight tracking-[0.08em] transition-colors duration-100"
      style={{ color: 'var(--sidebar-nav-section-label)' }}
    >
      {content}
    </button>
  )
}

/** Subtle “coming soon” hint — does not use the old pill badge. */
function SoonHint() {
  return (
    <span
      className="ml-auto w-8 shrink-0 text-right text-[11px] font-normal italic leading-none"
      style={{ color: 'var(--sidebar-nav-section-label)' }}
      aria-hidden
    >
      soon
    </span>
  )
}

type SidebarNavTier = 'top' | 'nested' | 'deep'
type CollapsibleSectionKey = 'commercial' | 'operations' | 'people' | 'finance' | 'admin'
type SectionOpenState = Record<CollapsibleSectionKey, boolean>

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
    if (pathname.startsWith('/expenses')) setFinanceExpensesOpen(true)
    if (
      pathname.startsWith('/compensation') ||
      pathname.startsWith('/finance/payslips') ||
      pathname.startsWith('/payments')
    ) {
      setFinancePayrollOpen(true)
    }
    if (pathname.startsWith('/finance/fx-rates') || pathname.startsWith('/finance/payment-accounts')) {
      setFinanceSetupOpen(true)
    }
  }, [pathname, isolated])

  const homeDashboardItem: NavItem | null = isolated ? null : { label: perms.labelDashboard, href: '/dashboard' }

  const homeTasksItem: NavItem | null = isolated ? { label: 'My Tasks', href: '/tasks' } : null
  const homeEarningsItem: NavItem | null = isolated ? null : { label: 'My Earnings', href: '/my-payments' }

  const commercialItems: NavItem[] = isolated
    ? []
    : [
        ...(perms.showLeads ? [{ label: 'Leads', href: '/leads' }] : []),
        ...(perms.showOutreach ? [{ label: 'Outreach', href: '/outreach' }] : []),
        ...(perms.showClients ? [{ label: 'Clients', href: '/clients' }] : []),
      ]

  const showCommercialSection = !isolated && commercialItems.length > 0

  const operationsItems: NavItem[] = isolated
    ? []
    : [
        ...(perms.showProjectsNav ? [{ label: perms.labelProjects, href: '/projects' }] : []),
        { label: perms.labelTasks, href: '/tasks' },
        ...(perms.showWorkLogs ? [{ label: 'Work Logs', href: '/work-logs' }] : []),
      ]

  const showOperationsSection = !isolated && operationsItems.length > 0

  const peopleItems: NavItem[] = isolated || !perms.showTeam ? [] : [{ label: 'People & Partners', href: '/team' }]

  const showPeopleSection = peopleItems.length > 0

  const payrollHasChildren =
    perms.showCompensation || perms.showFinance || perms.showPayments

  /** Operating Expenses only; Payroll is a sibling Finance accordion. */
  const expensesParentVisible = !isolated && perms.showExpenses

  const payrollParentVisible = !isolated && payrollHasChildren

  const revenueParentVisible = !isolated && perms.showFinance

  /** FX Rates + Payment Accounts only; Reports is a separate Finance row. */
  const financeSetupVisible = !isolated && (perms.showFxRates || perms.showPaymentAccounts)

  const reportsFinanceVisible = !isolated && isManagement(systemRole)

  const showFinanceBlock =
    !isolated &&
    (revenueParentVisible ||
      expensesParentVisible ||
      payrollParentVisible ||
      reportsFinanceVisible ||
      financeSetupVisible)

  const adminItems: NavItem[] =
    isolated || !perms.showSettings ? [] : [{ label: 'Settings', href: '/settings' }]

  const showAdminSection = adminItems.length > 0

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    if (href.startsWith('/settings?')) return pathname.startsWith('/settings')
    return pathname.startsWith(href)
  }

  const activeInCommercial = pathname.startsWith('/leads') || pathname.startsWith('/outreach') || pathname.startsWith('/clients')
  const activeInOperations =
    pathname.startsWith('/projects') || pathname.startsWith('/tasks') || pathname.startsWith('/work-logs')
  const activeInPeople = pathname.startsWith('/team')
  const activeInFinance =
    pathname.startsWith('/finance') ||
    pathname.startsWith('/expenses') ||
    pathname.startsWith('/compensation') ||
    pathname.startsWith('/payments')
  const activeInAdmin = pathname.startsWith('/settings')

  const [sectionOpen, setSectionOpen] = useState<SectionOpenState>(() => {
    const defaults: SectionOpenState = {
      commercial: showCommercialSection,
      operations: showOperationsSection,
      people: activeInPeople,
      finance: activeInFinance,
      admin: activeInAdmin,
    }

    try {
      const raw = localStorage.getItem(SIDEBAR_SECTION_OPEN_STORAGE_KEY)
      if (!raw) return defaults
      const parsed = JSON.parse(raw) as Partial<SectionOpenState>
      return {
        commercial: activeInCommercial ? true : parsed.commercial ?? defaults.commercial,
        operations: activeInOperations ? true : parsed.operations ?? defaults.operations,
        people: activeInPeople ? true : parsed.people ?? defaults.people,
        finance: activeInFinance ? true : parsed.finance ?? defaults.finance,
        admin: activeInAdmin ? true : parsed.admin ?? defaults.admin,
      }
    } catch {
      return defaults
    }
  })

  useEffect(() => {
    setSectionOpen((prev) => ({
      commercial: activeInCommercial ? true : prev.commercial,
      operations: activeInOperations ? true : prev.operations,
      people: activeInPeople ? true : prev.people,
      finance: activeInFinance ? true : prev.finance,
      admin: activeInAdmin ? true : prev.admin,
    }))
  }, [activeInCommercial, activeInOperations, activeInPeople, activeInFinance, activeInAdmin])

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_SECTION_OPEN_STORAGE_KEY, JSON.stringify(sectionOpen))
    } catch {
      /* ignore */
    }
  }, [sectionOpen])

  const toggleSection = (key: CollapsibleSectionKey) => {
    setSectionOpen((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const renderNavLink = (item: NavItem, tier: SidebarNavTier = 'top') => {
    const active = isActive(item.href)
    const nested = tier !== 'top'
    const isNestedTier = tier === 'nested' || tier === 'deep'

    const plClass =
      tier === 'top'
        ? 'pl-[calc(var(--sidebar-nav-item-px)-3px)]'
        : 'pl-[calc(var(--sidebar-nav-child-pl)-3px)]'
    const hasIcon = item.icon != null
    const textSize = 'text-[13px]'

    return (
      <li key={item.href} className={cn(nested && 'min-w-0')}>
        <Link
          href={item.href}
          aria-current={active ? 'page' : undefined}
          onClick={() => onNavigate?.()}
          className={cn(
            'group flex w-full min-w-0 items-center rounded-none border-l-[3px] border-l-transparent font-medium leading-snug no-underline transition-colors duration-100',
            hasIcon ? 'gap-2.5' : 'gap-0',
            'py-[var(--sidebar-nav-item-py)] pr-[var(--sidebar-nav-item-px)]',
            plClass,
            textSize,
            active &&
              !isNestedTier &&
              'border-l-[var(--sidebar-nav-active-accent)] bg-[var(--sidebar-nav-active-bg-top)] font-medium text-[var(--sidebar-nav-active-text)]',
            active &&
              isNestedTier &&
              'border-l-[var(--sidebar-nav-active-accent)] bg-[var(--sidebar-nav-active-bg-nested)] font-medium text-[var(--sidebar-nav-active-text)]',
            !active && 'text-[var(--sidebar-nav-text)]',
            !active && 'hover:bg-[var(--sidebar-hover)]',
            hasIcon && !active && '[&_svg]:text-[var(--sidebar-nav-text)]',
            hasIcon && active && '[&_svg]:text-[var(--sidebar-nav-active-text)]',
          )}
        >
          {hasIcon ? (
            <span className="flex h-4 w-4 shrink-0 items-center justify-center [&_svg]:block [&_svg]:h-4 [&_svg]:w-4">
              {item.icon}
            </span>
          ) : null}
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

  const renderSoonRow = (
    key: string,
    label: string,
    tier: 'top' | 'nested' = 'top',
    icon?: ReactNode,
  ) => {
    const plClass = tier === 'top' ? 'pl-[var(--sidebar-nav-item-px)]' : 'pl-[var(--sidebar-nav-child-pl)]'
    const hasIcon = icon != null
    const textSize = 'text-[13px]'
    return (
      <li key={key} className={cn(tier === 'nested' && 'min-w-0')}>
        <div
          className={cn(
            'pointer-events-none flex min-w-0 items-center rounded-none font-medium leading-snug',
            hasIcon ? 'gap-2.5' : 'gap-0',
            'py-[var(--sidebar-nav-item-py)] pr-[var(--sidebar-nav-item-px)]',
            plClass,
            textSize,
            'text-[var(--sidebar-nav-text)]',
          )}
          aria-disabled="true"
        >
          {hasIcon ? (
            <span className="flex h-4 w-4 shrink-0 items-center justify-center opacity-60 [&_svg]:block [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0">
              {icon}
            </span>
          ) : null}
          <span className="min-w-0 flex-1 truncate">{label}</span>
          <SoonHint />
        </div>
      </li>
    )
  }

  const financeAccordionBtn = (
    id: string,
    panelId: string,
    open: boolean,
    setOpen: (v: boolean) => void,
    label: string,
  ) => (
    <button
      type="button"
      id={id}
      className={cn(
        'group touch-manipulation flex w-full min-w-0 items-center gap-0 rounded-none border-0 bg-transparent py-[var(--sidebar-nav-item-py)] pl-[var(--sidebar-nav-item-px)] pr-[var(--sidebar-nav-item-px)] text-left text-[13px] font-medium leading-snug outline-none transition-colors duration-100',
        'text-[var(--sidebar-nav-text)] shadow-none hover:bg-[var(--sidebar-hover)]',
        'focus-visible:ring-2 focus-visible:ring-[var(--border-strong-neutral)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sidebar-bg)]',
      )}
      aria-expanded={open}
      aria-controls={panelId}
      onClick={() => setOpen(!open)}
    >
      <span className="min-w-0 flex-1 truncate text-left">{label}</span>
      <ChevronDown
        size={14}
        strokeWidth={2}
        className={cn('ml-auto shrink-0 transition-transform duration-150', open ? 'rotate-180' : 'rotate-0')}
        style={{ color: 'var(--sidebar-nav-accordion-caret)' }}
        aria-hidden
      />
    </button>
  )

  const roleLabel = systemRole ? SYSTEM_ROLE_LABELS[systemRole] ?? systemRole : 'Member'

  const showUserAccessSoon = perms.showSettings && (isOwner(systemRole) || isDirektur(systemRole))

  const reportsFinanceItem: NavItem = {
    label: 'Reports',
    href: '/finance/reports',
  }

  return (
    <>
      {desktopCollapsed && onRequestExpand ? (
        <div
          className="group/sbhead relative flex h-[var(--sidebar-header-height)] w-full shrink-0 items-center justify-center border-b border-[var(--border-default)] bg-[var(--sidebar-bg)]"
        >
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-6 w-6 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-150 group-hover/sbhead:opacity-[0.28] group-focus-within/sbhead:opacity-[0.28]"
            aria-hidden
          >
            <Image src="/brand/reka-mark.svg" alt="" fill sizes="24px" className="object-contain" priority />
          </div>
          <button
            type="button"
            onClick={onRequestExpand}
            className="absolute inset-0 z-10 flex items-center justify-center rounded-md opacity-0 outline-none transition-opacity duration-150 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-[var(--border-strong-neutral)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sidebar-bg)] group-hover/sbhead:opacity-100"
            style={{ color: 'var(--sidebar-text-muted)' }}
            aria-label="Open sidebar"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <ChevronRight size={14} aria-hidden className="shrink-0 opacity-60" />
          </button>
        </div>
      ) : (
        <div
          className="flex h-[var(--sidebar-header-height)] shrink-0 items-center gap-2 border-b border-[var(--border-default)] bg-[var(--sidebar-bg)] px-[var(--sidebar-nav-item-px)]"
        >
          <div className="relative h-6 w-6 shrink-0">
            <Image
              src="/brand/reka-mark.svg"
              alt="REKA Engineering"
              fill
              sizes="24px"
              className="object-contain"
              priority
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[10px] font-medium leading-tight tracking-wide" style={{ color: 'var(--text-soft-muted)' }}>
              {ROLE_CONTEXT[systemRole ?? 'member'] ?? 'Workspace'}
            </p>
          </div>
          {onRequestCollapse ? (
            <button
              type="button"
              onClick={onRequestCollapse}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--border-strong-neutral)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sidebar-bg)]"
              style={{ color: 'var(--text-soft-muted)' }}
              aria-label="Collapse sidebar"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <ChevronLeft size={14} strokeWidth={1.75} aria-hidden className="shrink-0 opacity-[0.42]" />
            </button>
          ) : null}
        </div>
      )}

      {!desktopCollapsed ? (
        <nav
          className="flex min-h-0 flex-1 flex-col gap-[var(--sidebar-section-gap)] overflow-y-auto overflow-x-hidden py-3"
          aria-label="Main navigation"
        >
          <div className="flex min-w-0 flex-col gap-0 border-b border-[var(--border-divider-soft)] pb-3">
            <SectionHeader id="section-home" label="Home" collapsible={false} />
            <ul role="list" className="flex flex-col gap-[var(--sidebar-row-gap)]">
              {homeDashboardItem ? renderNavLink(homeDashboardItem, 'top') : null}
            </ul>
          </div>

          <div className="flex min-w-0 flex-col gap-0 border-b border-[var(--border-divider-soft)] pb-3">
            <SectionHeader id="section-workspace" label="My Workspace" collapsible={false} />
            <ul role="list" className="flex flex-col gap-[var(--sidebar-row-gap)]">
              {homeTasksItem ? renderNavLink(homeTasksItem, 'top') : renderSoonRow('workspace-my-tasks-soon', 'My Tasks', 'top')}
              {homeEarningsItem ? renderNavLink(homeEarningsItem, 'top') : null}
            </ul>
          </div>

          {showCommercialSection ? (
            <div className="flex min-w-0 flex-col gap-0 border-b border-[var(--border-divider-soft)] pb-3">
              <SectionHeader
                id="section-commercial"
                panelId="panel-commercial"
                label="Commercial"
                icon={<Megaphone size={14} strokeWidth={2} aria-hidden />}
                collapsible
                open={sectionOpen.commercial}
                onToggle={() => toggleSection('commercial')}
              />
              <div id="panel-commercial" role="region" aria-labelledby="section-commercial" hidden={!sectionOpen.commercial}>
                <ul role="list" className="flex flex-col gap-[var(--sidebar-row-gap)]">
                  {commercialItems.map((item) => renderNavLink(item, 'top'))}
                  {renderSoonRow('contracts-soon', 'Contracts', 'top')}
                </ul>
              </div>
            </div>
          ) : null}

          {showOperationsSection ? (
            <div className="flex min-w-0 flex-col gap-0 border-b border-[var(--border-divider-soft)] pb-3">
              <SectionHeader
                id="section-operations"
                panelId="panel-operations"
                label="Operations"
                icon={<FolderKanban size={14} strokeWidth={2} aria-hidden />}
                collapsible
                open={sectionOpen.operations}
                onToggle={() => toggleSection('operations')}
              />
              <div id="panel-operations" role="region" aria-labelledby="section-operations" hidden={!sectionOpen.operations}>
                <ul role="list" className="flex flex-col gap-[var(--sidebar-row-gap)]">
                  {operationsItems.map((item) => renderNavLink(item, 'top'))}
                </ul>
              </div>
            </div>
          ) : null}

          {showPeopleSection ? (
            <div className="flex min-w-0 flex-col gap-0 border-b border-[var(--border-divider-soft)] pb-3">
              <SectionHeader
                id="section-people"
                panelId="panel-people"
                label="People"
                icon={<Users size={14} strokeWidth={2} aria-hidden />}
                collapsible
                open={sectionOpen.people}
                onToggle={() => toggleSection('people')}
              />
              <div id="panel-people" role="region" aria-labelledby="section-people" hidden={!sectionOpen.people}>
                <ul role="list" className="flex flex-col gap-[var(--sidebar-row-gap)]">
                  {peopleItems.map((item) => renderNavLink(item, 'top'))}
                  {renderSoonRow('talent-pool-soon', 'Talent Pool', 'top')}
                </ul>
              </div>
            </div>
          ) : null}

          {showFinanceBlock ? (
            <div className="flex min-w-0 flex-col gap-0 border-b border-[var(--border-divider-soft)] pb-3">
              <SectionHeader
                id="section-finance"
                panelId="panel-finance"
                label="Finance"
                icon={<Banknote size={14} strokeWidth={2} aria-hidden />}
                collapsible
                open={sectionOpen.finance}
                onToggle={() => toggleSection('finance')}
              />
              <div id="panel-finance" role="region" aria-labelledby="section-finance" hidden={!sectionOpen.finance}>
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
                        className="mt-0 flex min-w-0 flex-col gap-[var(--sidebar-row-gap)] pl-0 shadow-none"
                      >
                        <ul className="flex min-w-0 flex-col gap-[var(--sidebar-finance-children-gap)]">
                          {perms.showFinance
                            ? renderNavLink(
                                {
                                  label: 'Invoices',
                                  href: '/finance/invoices',
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
                        className="mt-0 flex min-w-0 flex-col gap-[var(--sidebar-row-gap)] pl-0 shadow-none"
                      >
                        <ul className="flex min-w-0 flex-col gap-[var(--sidebar-finance-children-gap)]">
                          {perms.showExpenses
                            ? renderNavLink(
                                {
                                  label: 'Operating Expenses',
                                  href: '/expenses',
                                },
                                'nested',
                              )
                            : null}
                        </ul>
                      </div>
                    </li>
                  ) : null}

                  {payrollParentVisible ? (
                    <li className="list-none">
                      {financeAccordionBtn(
                        'finance-acc-payroll',
                        'finance-panel-payroll',
                        financePayrollOpen,
                        setFinancePayrollOpen,
                        'Payroll',
                      )}
                      <div
                        id="finance-panel-payroll"
                        role="region"
                        aria-labelledby="finance-acc-payroll"
                        hidden={!financePayrollOpen}
                        className="mt-0 flex min-w-0 flex-col gap-[var(--sidebar-row-gap)] pl-0 shadow-none"
                      >
                        <ul className="flex min-w-0 flex-col gap-[var(--sidebar-finance-children-gap)]">
                          {perms.showCompensation
                            ? renderNavLink(
                                {
                                  label: 'Compensation',
                                  href: '/compensation',
                                },
                                'nested',
                              )
                            : null}
                          {perms.showFinance
                            ? renderNavLink(
                                {
                                  label: 'Payslips',
                                  href: '/finance/payslips',
                                },
                                'nested',
                              )
                            : null}
                          {perms.showPayments
                            ? renderNavLink(
                                {
                                  label: 'Payments',
                                  href: '/payments',
                                },
                                'nested',
                              )
                            : null}
                        </ul>
                      </div>
                    </li>
                  ) : null}

                  {reportsFinanceVisible ? renderNavLink(reportsFinanceItem, 'top') : null}

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
                        className="mt-0 flex min-w-0 flex-col gap-[var(--sidebar-row-gap)] pl-0 shadow-none"
                      >
                        <ul className="flex min-w-0 flex-col gap-[var(--sidebar-finance-children-gap)]">
                          {perms.showFxRates
                            ? renderNavLink(
                                {
                                  label: 'FX Rates',
                                  href: '/finance/fx-rates',
                                },
                                'nested',
                              )
                            : null}
                          {perms.showPaymentAccounts
                            ? renderNavLink(
                                {
                                  label: 'Payment Accounts',
                                  href: '/finance/payment-accounts',
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
            </div>
          ) : null}

          {showAdminSection ? (
            <div className="flex min-w-0 flex-col gap-0">
              <SectionHeader
                id="section-admin"
                panelId="panel-admin"
                label="Admin"
                icon={<Settings size={14} strokeWidth={2} aria-hidden />}
                collapsible
                open={sectionOpen.admin}
                onToggle={() => toggleSection('admin')}
              />
              <div id="panel-admin" role="region" aria-labelledby="section-admin" hidden={!sectionOpen.admin}>
                <ul role="list" className="flex flex-col gap-[var(--sidebar-row-gap)]">
                  {adminItems.map((item) => renderNavLink(item, 'top'))}
                  {showUserAccessSoon ? renderSoonRow('user-access-soon', 'User Access', 'top') : null}
                </ul>
              </div>
            </div>
          ) : null}
        </nav>
      ) : (
        <div className="min-h-0 flex-1" style={{ backgroundColor: 'var(--sidebar-bg)' }} aria-hidden />
      )}

      {!desktopCollapsed ? (
        <div className="shrink-0 border-t border-[var(--border-default)] bg-[var(--sidebar-bg)] px-[var(--sidebar-nav-item-px)] py-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex min-h-[2.75rem] w-full min-w-0 items-center gap-2 rounded-md px-1.5 py-1 transition-colors duration-100 outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-strong-neutral)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sidebar-bg)]"
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  {photoUrl && <AvatarImage src={photoUrl} alt={userFullName} />}
                  <AvatarFallback
                    className="text-[11px] font-semibold"
                    style={{ backgroundColor: 'var(--sidebar-active-bg)', color: 'var(--sidebar-text)' }}
                  >
                    {getInitials(userFullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 overflow-hidden text-left">
                  <p className="truncate text-xs font-medium leading-tight" style={{ color: 'var(--sidebar-text)' }}>
                    {userFullName}
                  </p>
                  <p className="truncate text-[10px] leading-tight" style={{ color: 'var(--text-soft-muted)' }}>
                    {roleLabel}
                  </p>
                </div>
                <ChevronDown
                  size={12}
                  strokeWidth={1.75}
                  className="ml-auto shrink-0 opacity-[0.38]"
                  style={{ color: 'var(--text-soft-muted)' }}
                  aria-hidden
                />
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
      className="hidden h-screen w-[var(--sidebar-width)] shrink-0 flex-col overflow-hidden border-r border-[var(--border-default)] bg-[var(--sidebar-bg)] transition-[width] duration-200 ease-out md:fixed md:inset-y-0 md:left-0 md:z-30 md:flex"
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
