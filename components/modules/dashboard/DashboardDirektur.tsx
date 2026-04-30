import Link from 'next/link'
import {
  FolderKanban,
  AlertCircle,
  Clock,
  FileText,
  AlertTriangle,
  CalendarClock,
  TrendingUp,
  ArrowDownRight,
  Landmark,
  PieChart,
} from 'lucide-react'

import type { SessionProfile } from '@/lib/auth/session'
import type { DirekturDashboardData } from '@/lib/dashboard/direktur-queries'
import { PageHeader } from '@/components/layout/PageHeader'
import { KpiCard, KpiStrip } from '@/components/shared/KpiCard'
import {
  DashboardSection,
  FlagCount,
  RecentActivityFeed,
  PnlPeriodTabs,
  UpcomingDeadlinesList,
  ROW_LINK_CLASS,
  TH_CLASS,
  TD_CLASS,
} from '@/components/modules/dashboard/dashboard-shared'
import { NeedsAttentionWidget, type AttentionLinkItem } from '@/components/modules/dashboard/NeedsAttentionWidget'
import { MoneyDisplay } from '@/components/shared/MoneyDisplay'
import { TaskStatusBarChart } from '@/components/modules/dashboard/TaskStatusBarChart'
import { DeadlineBucketsChart } from '@/components/modules/dashboard/DeadlineBucketsChart'
import { AttentionQueue } from '@/components/modules/dashboard/AttentionQueue'
import { PaymentSnapshotCard } from '@/components/modules/dashboard/PaymentSnapshotCard'
import { WorkloadBars } from '@/components/modules/dashboard/WorkloadBars'
import { ProjectStatusBadge } from '@/components/modules/projects/ProjectStatusBadge'
import { Badge } from '@/components/ui/badge'
import { formatIDR, formatMoney } from '@/lib/utils/formatters'

function formatDiajukanHariLalu(iso: string | null): string {
  if (!iso) return 'Waktu pengajuan belum tercatat'
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days < 0) return 'Baru diajukan'
  if (days === 0) return 'Diajukan hari ini'
  if (days === 1) return 'Diajukan 1 hari lalu'
  return `Diajukan ${days} hari lalu`
}

export function DashboardDirektur({ data, profile }: { data: DirekturDashboardData; profile: SessionProfile }) {
  const attentionCount =
    data.attention.overdueTasks.length +
    data.attention.blockedTasks.length +
    data.attention.revisionDeliverables.length +
    data.waitingClient.length

  const needsLinks: AttentionLinkItem[] = []
  for (const inv of data.overdueInvoices.slice(0, 5)) {
    needsLinks.push({
      id: `inv-${inv.id}`,
      label: inv.invoice_code,
      sub: inv.clients?.client_name ?? 'Overdue invoice',
      href: '/finance/invoices',
      icon: 'invoice',
    })
  }
  if (data.compensationDraftCount > 0) {
    needsLinks.push({
      id: 'comp-pending',
      label: `${data.compensationDraftCount} compensation draft(s)`,
      sub: 'Awaiting Finance confirmation',
      href: '/compensation?view=pending',
      icon: 'comp',
    })
  }

  return (
    <div className="page-content animate-fade-in space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={`${profile.full_name} — Org overview, finance, and governance.`}
      />

      <KpiStrip className="lg:grid-cols-4 xl:grid-cols-4">
        <KpiCard title="Revenue MTD (IDR)" value={formatIDR(data.revenueMtdIdr)} icon={TrendingUp} accent="primary" />
        <KpiCard title="Revenue YTD (IDR)" value={formatIDR(data.revenueYtdIdr)} icon={TrendingUp} />
        <KpiCard
          title="Outstanding invoices"
          value={formatIDR(data.invoiceSummary.outstanding * data.fxRate)}
          subtitle={`${data.overdueInvoices.length} overdue · outstanding (approx. IDR)`}
          icon={AlertTriangle}
          variant={data.overdueInvoices.length > 0 ? 'warning' : 'default'}
        />
        <KpiCard
          title="P&L (period)"
          value={formatMoney(data.pnl.grossProfit, 'USD')}
          subtitle={`≈ ${formatIDR(data.pnl.grossProfit * data.fxRate)} · ${data.pnl.periodLabel}`}
          icon={PieChart}
          variant={data.pnl.grossProfit >= 0 ? 'success' : 'danger'}
        />
      </KpiStrip>

      <KpiStrip className="lg:grid-cols-4 xl:grid-cols-4">
        <KpiCard title="Active projects" value={data.kpis.activeProjects} icon={FolderKanban} accent="primary" />
        <KpiCard title="Completed this month" value={data.projectsCompletedThisMonth} icon={Clock} />
        <KpiCard title="Team utilization" value={`${data.teamUtilizationPct}%`} icon={FileText} subtitle="Active members with open tasks" />
        <KpiCard
          title="Pending team payments"
          value={formatIDR(data.paymentSnapshot.totalOutstanding)}
          icon={CalendarClock}
          variant={data.paymentSnapshot.unpaidCount + data.paymentSnapshot.partialCount > 0 ? 'warning' : 'default'}
          subtitle={`${data.paymentSnapshot.unpaidCount + data.paymentSnapshot.partialCount} records`}
        />
      </KpiStrip>

      {data.pendingApprovalProjects.length > 0 && (
        <div
          className="overflow-hidden rounded-[var(--radius-card)] border-2 p-4"
          style={{
            borderColor: 'var(--color-warning, #d97706)',
            backgroundColor: 'var(--color-warning-subtle)',
          }}
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="m-0 text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Menunggu Persetujuan
            </h2>
            <Badge variant="destructive" className="h-6 min-w-7 justify-center tabular-nums">
              {data.pendingApprovalProjects.length}
            </Badge>
          </div>
          <ul className="m-0 list-none space-y-3 p-0">
            {data.pendingApprovalProjects.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/projects/${p.id}`}
                  className="block rounded-md border p-3 no-underline transition-colors hover:opacity-95"
                  style={{
                    borderColor: 'var(--color-border-strong)',
                    backgroundColor: 'var(--color-surface, #fff)',
                  }}
                >
                  <div className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {p.project_code ? `${p.project_code} · ` : ''}
                    {p.name}
                  </div>
                  <div
                    className="mt-1 text-[0.8125rem] leading-relaxed"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {p.discipline}
                    {p.client_name != null && p.client_name.length > 0
                      ? ` · ${p.client_name}`
                      : null}
                    {p.project_lead_name != null && p.project_lead_name.length > 0
                      ? ` · Lead: ${p.project_lead_name}`
                      : null}
                  </div>
                  <div className="mt-1.5 text-[0.75rem] font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                    {formatDiajukanHariLalu(p.approval_requested_at)}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {needsLinks.length > 0 && (
        <NeedsAttentionWidget title="Needs attention — quick links" items={needsLinks} />
      )}

      <DashboardSection
        title="P&L overview"
        description={`Paid invoice revenue, fees, and payroll — ${data.pnl.periodLabel}.`}
        actions={<PnlPeriodTabs current={data.pnlPeriod} />}
      >
        <KpiStrip className="grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
          <KpiCard
            title="Revenue"
            value={formatMoney(data.pnl.revenue, 'USD')}
            subtitle={`≈ ${formatIDR(data.pnl.revenue * data.fxRate)}`}
            icon={TrendingUp}
            accent="primary"
          />
          <KpiCard
            title="Platform fees"
            value={formatMoney(data.pnl.platformFees, 'USD')}
            subtitle={`≈ ${formatIDR(data.pnl.platformFees * data.fxRate)}`}
            icon={ArrowDownRight}
            variant="dashboard"
            muted
          />
          <KpiCard
            title="Expenses"
            value={formatIDR(data.pnl.expenses * data.fxRate)}
            subtitle={`≈ ${formatMoney(data.pnl.expenses, 'USD')} · comp + member payments`}
            icon={Landmark}
            variant="dashboard"
          />
          <KpiCard
            title="Gross profit"
            value={formatMoney(data.pnl.grossProfit, 'USD')}
            subtitle={`≈ ${formatIDR(data.pnl.grossProfit * data.fxRate)}`}
            icon={PieChart}
            variant={data.pnl.grossProfit >= 0 ? 'success' : 'danger'}
          />
        </KpiStrip>
      </DashboardSection>

      <DashboardSection title="Payment accounts" description="Gross invoice amounts by destination account (paid vs pipeline).">
        <div className="flex flex-wrap gap-3">
          {data.accountReceive.length === 0 ? (
            <p className="m-0 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              No payment accounts configured.
            </p>
          ) : (
            data.accountReceive.map((acc) => (
              <div
                key={acc.accountId}
                className="min-w-[200px] flex-1 rounded-[var(--radius-card)] border p-3"
                style={{
                  backgroundColor: 'var(--color-surface-muted)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <p className="m-0 truncate text-[0.8125rem] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {acc.accountName}
                </p>
                <p className="mt-1 text-[0.6875rem] font-medium uppercase tracking-[0.06em]" style={{ color: 'var(--color-text-muted)' }}>
                  Received
                </p>
                <div className="mt-0.5">
                  <MoneyDisplay
                    amount={acc.totalReceived}
                    currency={acc.currency}
                    fxRateToIDR={data.fxRate}
                    showConversion={acc.currency === 'USD'}
                    size="sm"
                  />
                </div>
                <p className="mt-2 text-[0.6875rem] font-medium uppercase tracking-[0.06em]" style={{ color: 'var(--color-text-muted)' }}>
                  Pending
                </p>
                <div className="mt-0.5">
                  <MoneyDisplay
                    amount={acc.pendingAmount}
                    currency={acc.currency}
                    fxRateToIDR={data.fxRate}
                    showConversion={acc.currency === 'USD'}
                    size="sm"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </DashboardSection>

      <DashboardSection title="Project overview" description="Upcoming and active work ordered by deadline.">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={TH_CLASS}>Project</th>
                <th className={TH_CLASS}>Client</th>
                <th className={TH_CLASS}>Status</th>
                <th className={TH_CLASS}>Progress</th>
                <th className={TH_CLASS}>Lead</th>
              </tr>
            </thead>
            <tbody>
              {data.projectOverview.map((p, i) => (
                <tr key={p.id} className={i < data.projectOverview.length - 1 ? 'border-b border-[var(--color-border)]' : ''}>
                  <td className={TD_CLASS}>
                    <Link href={`/projects/${p.id}`} className={ROW_LINK_CLASS}>
                      {p.project_code ? `${p.project_code} · ` : ''}
                      {p.name}
                    </Link>
                  </td>
                  <td className={TD_CLASS}>{p.clients?.client_name ?? '—'}</td>
                  <td className={TD_CLASS}>
                    <ProjectStatusBadge status={p.status} />
                  </td>
                  <td className={TD_CLASS}>{p.progress_percent}%</td>
                  <td className={TD_CLASS}>{p.lead?.full_name ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardSection>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <DashboardSection
            title="Operations — needs attention"
            description="Overdue tasks, blocked work, revision requests, and client holds."
            actions={<FlagCount count={attentionCount} />}
          >
            <AttentionQueue attention={data.attention} waitingClient={data.waitingClient} />
          </DashboardSection>

          <DashboardSection title="Tasks by status">
            <TaskStatusBarChart counts={data.pipeline} />
          </DashboardSection>

          <DashboardSection title="Deadline pressure">
            <DeadlineBucketsChart buckets={data.buckets} />
          </DashboardSection>

          <DashboardSection title="Team workload" description="Open task load — highest first.">
            <WorkloadBars users={data.workload} />
          </DashboardSection>
        </div>

        <div className="space-y-4">
          <DashboardSection title="Revenue summary" description="From paid + partial invoices">
            <div className="space-y-2">
              {[
                { label: 'Total Gross', amount: data.invoiceSummary.totalGross, note: 'Before fees' },
                { label: 'Net Revenue', amount: data.invoiceSummary.totalNet, note: 'After all fees' },
                { label: 'Outstanding', amount: data.invoiceSummary.outstanding, note: 'Unpaid invoices', highlight: true },
                { label: 'Collected', amount: data.invoiceSummary.paid, note: 'Paid invoices' },
              ].map((card) => (
                <div
                  key={card.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-control)',
                    backgroundColor: card.highlight ? 'var(--color-warning-subtle)' : 'var(--color-surface-muted)',
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: card.highlight ? 'var(--color-warning)' : 'var(--color-text-muted)',
                        marginBottom: '1px',
                      }}
                    >
                      {card.label}
                    </p>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>{card.note}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p
                      style={{
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        color: card.highlight ? 'var(--color-warning)' : 'var(--color-text-primary)',
                        fontFamily: 'monospace',
                      }}
                    >
                      USD {card.amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                      ≈{' '}
                      {(card.amount * data.fxRate).toLocaleString('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <Link href="/finance/invoices" className="text-[0.8125rem] font-medium text-[var(--color-primary)] no-underline hover:underline">
                View all invoices →
              </Link>
            </div>
          </DashboardSection>

          <DashboardSection title="Payment snapshot">
            <PaymentSnapshotCard snapshot={data.paymentSnapshot} />
          </DashboardSection>

          <DashboardSection title="Recent activity">
            <RecentActivityFeed entries={data.activity} />
          </DashboardSection>

          <DashboardSection title="Upcoming deadlines">
            <UpcomingDeadlinesList waitingClient={data.waitingClient} />
          </DashboardSection>
        </div>
      </div>
    </div>
  )
}
