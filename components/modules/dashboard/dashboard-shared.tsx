import type { ReactNode } from 'react'
import Link from 'next/link'
import {
  FolderKanban,
  AlertCircle,
  Clock,
  FileText,
  CheckSquare,
  AlertTriangle,
  CalendarClock,
  Activity,
} from 'lucide-react'

import { Card } from '@/components/ui/card'
import { SectionHeader } from '@/components/layout/PageHeader'
import { KpiCard, KpiStrip } from '@/components/shared/KpiCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { TaskStatusBadge } from '@/components/modules/tasks/TaskStatusBadge'
import { formatDate, formatIDR, formatRelativeDate } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils/cn'
import type { ScopedDeliverable, ScopedKpis, ScopedPayment, ScopedTask } from '@/lib/dashboard/role-queries'
import type { WaitingClientProjectRow } from '@/lib/dashboard/queries'
import type { ActivityLogEntry } from '@/lib/activity/queries'
import type { PnlPeriod } from '@/lib/dashboard/pnl-queries'

export const TH_CLASS =
  'whitespace-nowrap border-b border-[var(--table-border)] bg-[var(--table-header-bg)] px-[var(--table-cell-padding-x)] py-2.5 text-left text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-[var(--table-header-text)]'
export const TD_CLASS = 'align-middle px-[var(--table-cell-padding-x)] py-2.5 text-[0.8125rem] text-[var(--text-secondary-neutral)]'
export const ROW_LINK_CLASS =
  'text-[0.8125rem] font-medium text-[var(--text-primary-neutral)] no-underline hover:text-[var(--brand-accent)]'
export const CODE_LINK_CLASS = 'text-xs font-medium text-[var(--brand-accent)] no-underline hover:underline'

export function DashboardSection({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn('rounded-[var(--radius-card)] border p-[var(--space-card-padding-x)]', className)}
      style={{
        backgroundColor: 'var(--surface-card)',
        borderColor: 'var(--border-default)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div className="mb-[var(--space-section-gap)] flex items-center justify-between gap-[var(--space-section-gap)]">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary-neutral)' }}>
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-[0.8125rem]" style={{ color: 'var(--text-muted-neutral)' }}>
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-[var(--space-panel-gap)]">{actions}</div>
        )}
      </div>
      {children}
    </div>
  )
}

export function FlagCount({ count }: { count: number }) {
  if (count === 0) {
    return (
      <span className="rounded-full bg-[var(--color-success-subtle)] px-2.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-[var(--color-success)]">
        Clear
      </span>
    )
  }
  return (
    <span className="rounded-full bg-[var(--color-danger-subtle)] px-2.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-[var(--color-danger)]">
      {count} flagged
    </span>
  )
}

const ENTITY_LABELS: Record<string, string> = {
  project: 'Project',
  task: 'Task',
  deliverable: 'Deliverable',
  intake: 'Intake',
}
const ACTION_LABELS: Record<string, string> = {
  created: 'created',
  updated: 'updated',
  status_updated: 'status updated',
  converted: 'converted to project',
}

export function RecentActivityFeed({ entries }: { entries: ActivityLogEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="flex items-center gap-[var(--space-grid-gap)] py-[var(--space-panel-gap)]">
        <div
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-neutral)] text-[var(--text-muted-neutral)]"
        >
          <Activity className="h-4 w-4" />
        </div>
        <p className="m-0 text-[0.8125rem] leading-snug text-[var(--text-muted-neutral)]">
          No recent updates — activity across projects, tasks, and deliverables will stream here.
        </p>
      </div>
    )
  }
  return (
    <div className="space-y-1">
      {entries.map((entry) => {
        const description =
          entry.note ??
          `${ENTITY_LABELS[entry.entity_type] ?? entry.entity_type} ${ACTION_LABELS[entry.action_type] ?? entry.action_type}`
        return (
          <div key={entry.id} className="flex items-start gap-2.5 rounded-md px-2 py-2">
            <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }} />
            <div className="min-w-0">
              <p className="text-[0.8125rem] leading-snug" style={{ color: 'var(--text-primary-neutral)' }}>
                {description}
              </p>
              <p className="text-[0.6875rem]" style={{ color: 'var(--text-muted-neutral)' }}>
                {entry.actor?.full_name ?? 'System'} · {formatRelativeDate(entry.created_at)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function PnlPeriodTabs({ current }: { current: PnlPeriod }) {
  const tabs: { id: PnlPeriod; label: string; href: string }[] = [
    { id: 'this_month', label: 'Bulan ini', href: '/dashboard' },
    { id: 'this_quarter', label: 'Kuartal ini', href: '/dashboard?pnl_period=this_quarter' },
    { id: 'this_year', label: 'Tahun ini', href: '/dashboard?pnl_period=this_year' },
  ]
  return (
    <nav className="flex flex-wrap gap-[var(--space-compact-gap)]" aria-label="P&L period">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={cn(
            'rounded-[var(--radius-pill)] px-2.5 py-1 text-[0.6875rem] font-semibold no-underline transition-colors',
            current === tab.id
              ? 'bg-[var(--color-primary)] text-[var(--color-primary-fg)]'
              : 'bg-[var(--surface-neutral)] text-[var(--text-secondary-neutral)] hover:bg-[var(--table-row-hover)]',
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}

export function UpcomingDeadlinesList({ waitingClient }: { waitingClient: WaitingClientProjectRow[] }) {
  const items = waitingClient.slice(0, 4)
  if (items.length === 0) {
    return (
      <div className="flex items-center gap-[var(--space-grid-gap)] py-[var(--space-panel-gap)]">
        <div
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-neutral)] text-[var(--text-muted-neutral)]"
        >
          <CalendarClock className="h-4 w-4" />
        </div>
        <p className="m-0 text-[0.8125rem] leading-snug text-[var(--text-muted-neutral)]">
          No deadlines on hold — dated client-side holds will appear here.
        </p>
      </div>
    )
  }
  const today = Date.now()
  return (
    <div className="space-y-[var(--space-panel-gap)]">
      {items.map((p) => {
        const due = new Date(p.target_due_date).getTime()
        const days = Math.ceil((due - today) / (1000 * 60 * 60 * 24))
        const urgent = days <= 7
        return (
          <Link
            key={p.id}
            href={`/projects/${p.id}`}
            className="flex items-center justify-between gap-3 rounded-[var(--radius-control)] bg-[var(--surface-neutral)] px-3 py-2.5 text-inherit no-underline transition-colors hover:bg-[var(--table-row-hover)]"
          >
            <div className="min-w-0">
              <p className="m-0 truncate text-[0.8125rem] font-medium text-[var(--text-primary-neutral)]">{p.name}</p>
              <p className="mt-0.5 truncate text-[0.6875rem] text-[var(--text-muted-neutral)]">
                {p.project_code} · {p.clients?.client_name ?? 'Client'}
              </p>
            </div>
            <span
              className={cn(
                'shrink-0 text-[0.75rem] font-medium tabular-nums',
                urgent ? 'text-[var(--color-danger)]' : 'text-[var(--text-muted-neutral)]',
              )}
            >
              {days <= 0 ? 'Due' : `${days}d`}
            </span>
          </Link>
        )
      })}
    </div>
  )
}

export function ScopedKpiRow({ kpis }: { kpis: ScopedKpis }) {
  return (
    <KpiStrip className="lg:grid-cols-5 xl:grid-cols-5">
      <KpiCard title="Active Projects" value={kpis.activeProjects} icon={FolderKanban} />
      <KpiCard title="Open Tasks" value={kpis.openTasks} icon={CheckSquare} />
      <KpiCard
        title="Overdue Tasks"
        value={kpis.overdueTasks}
        icon={AlertCircle}
        variant={kpis.overdueTasks > 0 ? 'danger' : 'default'}
      />
      <KpiCard
        title="Due This Week"
        value={kpis.dueThisWeek}
        icon={Clock}
        variant={kpis.dueThisWeek > 0 ? 'warning' : 'default'}
      />
      <KpiCard
        title="Awaiting Review"
        value={kpis.awaitingReview}
        icon={FileText}
        accent={kpis.awaitingReview > 0 ? 'primary' : 'none'}
      />
    </KpiStrip>
  )
}

export function ScopedTasksSection({
  tasks,
  title,
  hideProjectColumn,
}: {
  tasks: ScopedTask[]
  title: string
  hideProjectColumn?: boolean
}) {
  const today = new Date().toISOString().split('T')[0]
  return (
    <Card className="p-[var(--space-card-padding-x)]">
      <SectionHeader title={title} />
      <div className="space-y-[var(--space-grid-gap)]">
        {tasks.length === 0 ? (
          <EmptyState icon={<CheckSquare size={20} />} title="No open tasks" description="You're all caught up." className="py-8" />
        ) : (
          <div className="overflow-x-auto scrollbar-neutral">
            <table className="w-full border-collapse table-edge-align">
              <thead>
                <tr>
                  <th className={TH_CLASS}>Task</th>
                  {!hideProjectColumn && <th className={TH_CLASS}>Project</th>}
                  <th className={TH_CLASS}>Due</th>
                  <th className={TH_CLASS}>Priority</th>
                  <th className={TH_CLASS}>Status</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t, i) => {
                  const overdue = t.due_date && t.due_date < today
                  return (
                    <tr key={t.id} className={cn(i < tasks.length - 1 && 'border-b border-[var(--table-border)]')}>
                      <td className={TD_CLASS}>
                        <Link href={`/tasks/${t.id}`} className={ROW_LINK_CLASS}>
                          {t.title}
                        </Link>
                      </td>
                      {!hideProjectColumn && (
                        <td className={TD_CLASS}>
                          {t.projects ? (
                            <Link href={`/projects/${t.projects.id}`} className={CODE_LINK_CLASS}>
                              {t.projects.project_code}
                            </Link>
                          ) : (
                            '—'
                          )}
                        </td>
                      )}
                      <td
                        className={cn(
                          TD_CLASS,
                          'whitespace-nowrap text-xs',
                          overdue ? 'font-semibold text-[var(--color-danger)]' : 'text-[var(--text-muted-neutral)]',
                        )}
                      >
                        {overdue && <AlertTriangle size={11} className="mr-1 inline-block align-middle" />}
                        {t.due_date ? formatDate(t.due_date) : '—'}
                      </td>
                      <td className={TD_CLASS}>
                        <PriorityBadge priority={t.priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'} />
                      </td>
                      <td className={TD_CLASS}>
                        <TaskStatusBadge status={t.status} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  )
}

/** Freelancer tasks — no project relation in data */
export function FreelancerTasksTable({ tasks, title }: { tasks: { id: string; title: string; due_date: string | null; status: string; priority: string }[]; title: string }) {
  const today = new Date().toISOString().split('T')[0]
  return (
    <Card className="p-[var(--space-card-padding-x)]">
      <SectionHeader title={title} />
      <div className="space-y-[var(--space-grid-gap)]">
        {tasks.length === 0 ? (
          <EmptyState icon={<CheckSquare size={20} />} title="No open tasks" description="You're all caught up." className="py-8" />
        ) : (
          <div className="overflow-x-auto scrollbar-neutral">
            <table className="w-full border-collapse table-edge-align">
              <thead>
                <tr>
                  <th className={TH_CLASS}>Task</th>
                  <th className={TH_CLASS}>Due</th>
                  <th className={TH_CLASS}>Priority</th>
                  <th className={TH_CLASS}>Status</th>
                  <th className={TH_CLASS} />
                </tr>
              </thead>
              <tbody>
                {tasks.map((t, i) => {
                  const overdue = t.due_date && t.due_date < today
                  return (
                    <tr key={t.id} className={cn(i < tasks.length - 1 && 'border-b border-[var(--table-border)]')}>
                      <td className={TD_CLASS}>
                        <Link href={`/tasks/${t.id}`} className={ROW_LINK_CLASS}>
                          {t.title}
                        </Link>
                      </td>
                      <td
                        className={cn(
                          TD_CLASS,
                          'whitespace-nowrap text-xs',
                          overdue ? 'font-semibold text-[var(--color-danger)]' : 'text-[var(--text-muted-neutral)]',
                        )}
                      >
                        {t.due_date ? formatDate(t.due_date) : '—'}
                      </td>
                      <td className={TD_CLASS}>
                        <PriorityBadge priority={t.priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'} />
                      </td>
                      <td className={TD_CLASS}>
                        <TaskStatusBadge status={t.status} />
                      </td>
                      <td className={TD_CLASS}>
                        <Link href={`/tasks/${t.id}`} className={CODE_LINK_CLASS}>
                          Detail
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  )
}

export function ScopedDeliverablesSection({ deliverables, title }: { deliverables: ScopedDeliverable[]; title: string }) {
  return (
    <Card className="p-[var(--space-card-padding-x)]">
      <SectionHeader title={title} />
      <div className="space-y-[var(--space-grid-gap)]">
        {deliverables.length === 0 ? (
          <EmptyState icon={<FileText size={20} />} title="No active deliverables" description="Deliverables will appear here." className="py-8" />
        ) : (
          <div className="overflow-x-auto scrollbar-neutral">
            <table className="w-full border-collapse table-edge-align">
              <thead>
                <tr>
                  <th className={TH_CLASS}>Deliverable</th>
                  <th className={TH_CLASS}>Type</th>
                  <th className={TH_CLASS}>Project</th>
                  <th className={TH_CLASS}>Status</th>
                </tr>
              </thead>
              <tbody>
                {deliverables.map((d, i) => (
                  <tr key={d.id} className={cn(i < deliverables.length - 1 && 'border-b border-[var(--table-border)]')}>
                    <td className={TD_CLASS}>
                      <Link href={`/deliverables/${d.id}`} className={ROW_LINK_CLASS}>
                        {d.name}
                      </Link>
                    </td>
                    <td className={cn(TD_CLASS, 'capitalize')}>{d.type.replace(/_/g, ' ')}</td>
                    <td className={TD_CLASS}>
                      {d.projects ? (
                        <Link href={`/projects/${d.projects.id}`} className={CODE_LINK_CLASS}>
                          {d.projects.project_code}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className={cn(TD_CLASS, 'capitalize')}>{d.status.replace(/_/g, ' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  )
}

export function ScopedPaymentsSection({ payments }: { payments: ScopedPayment[] }) {
  if (payments.length === 0) return null
  const PILL_CLASS: Record<string, string> = {
    unpaid: 'text-[var(--color-danger)]  bg-[var(--color-danger-subtle)]',
    partial: 'text-[var(--color-warning)] bg-[var(--color-warning-subtle)]',
    paid: 'text-[var(--color-success)] bg-[var(--color-success-subtle)]',
  }
  return (
    <Card className="p-[var(--space-card-padding-x)]">
      <SectionHeader title="My Payments" />
      <div className="space-y-[var(--space-grid-gap)]">
        <div className="overflow-x-auto scrollbar-neutral">
          <table className="w-full border-collapse table-edge-align">
            <thead>
              <tr>
                <th className={TH_CLASS}>Period</th>
                <th className={cn(TH_CLASS, 'text-right')}>Due</th>
                <th className={cn(TH_CLASS, 'text-right')}>Paid</th>
                <th className={cn(TH_CLASS, 'text-right')}>Balance</th>
                <th className={TH_CLASS}>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p, i) => (
                <tr key={p.id} className={cn(i < payments.length - 1 && 'border-b border-[var(--table-border)]')}>
                  <td className={cn(TD_CLASS, 'font-medium text-[var(--text-primary-neutral)]')}>{p.period_label ?? '—'}</td>
                  <td className={cn(TD_CLASS, 'text-right tabular-nums')}>{formatIDR(p.total_due)}</td>
                  <td className={cn(TD_CLASS, 'text-right tabular-nums')}>{formatIDR(p.total_paid)}</td>
                  <td className={cn(TD_CLASS, 'text-right tabular-nums', p.balance > 0 && 'font-semibold')}>{formatIDR(p.balance)}</td>
                  <td className={TD_CLASS}>
                    <span
                      className={cn(
                        'inline-flex rounded-[var(--radius-pill)] px-2.5 py-0.5 text-[0.6875rem] font-semibold capitalize tracking-[0.01em]',
                        PILL_CLASS[p.payment_status] ?? '',
                      )}
                    >
                      {p.payment_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-[var(--space-grid-gap)]">
          <Link href="/my-payments" className="text-[0.8125rem] font-medium text-[var(--brand-accent)] no-underline hover:underline">
            View all payments →
          </Link>
        </div>
      </div>
    </Card>
  )
}
