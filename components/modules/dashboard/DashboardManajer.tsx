import Link from 'next/link'
import { CheckSquare, FileText, Milestone } from 'lucide-react'

import type { SessionProfile } from '@/lib/auth/session'
import type { ManajerDashboardFull } from '@/lib/dashboard/manajer-queries'
import { PageHeader } from '@/components/layout/PageHeader'
import { KpiCard, KpiStrip } from '@/components/shared/KpiCard'
import {
  DashboardSection,
  FlagCount,
  RecentActivityFeed,
  ScopedDeliverablesSection,
  ScopedKpiRow,
  ScopedTasksSection,
  TH_CLASS,
  TD_CLASS,
  ROW_LINK_CLASS,
} from '@/components/modules/dashboard/dashboard-shared'
import { TaskStatusBarChart } from '@/components/modules/dashboard/TaskStatusBarChart'
import { DeadlineBucketsChart } from '@/components/modules/dashboard/DeadlineBucketsChart'
import { AttentionQueue } from '@/components/modules/dashboard/AttentionQueue'
import { WorkloadBars } from '@/components/modules/dashboard/WorkloadBars'
import { ProjectStatusBadge } from '@/components/modules/projects/ProjectStatusBadge'
import { formatDate, formatIDR } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils/cn'

export function DashboardManajer({ data, profile }: { data: ManajerDashboardFull; profile: SessionProfile }) {
  const attentionCount =
    data.attention.overdueTasks.length +
    data.attention.blockedTasks.length +
    data.attention.revisionDeliverables.length +
    data.waiting.length

  const today = new Date().toISOString().split('T')[0]

  if (data.base.projectIds.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          subtitle={`${profile.full_name} — Projects you lead will appear here.`}
        />
        <ScopedKpiRow kpis={data.base.kpis} />
        <DashboardSection title="Assignments">
          <p className="m-0 text-sm text-[var(--color-text-muted)]">
            You are not leading any projects yet. When you are assigned as project lead, this dashboard will populate.
          </p>
        </DashboardSection>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={`${profile.full_name} — Projects you lead, milestones, and team load.`}
      />

      <ScopedKpiRow kpis={data.base.kpis} />

      <KpiStrip className="lg:grid-cols-3 xl:grid-cols-3">
        <KpiCard title="Termin ready to claim" value={data.base.readyTermins.length} icon={Milestone} accent="primary" />
        <KpiCard title="Deliverables in review" value={data.base.kpis.awaitingReview} icon={FileText} />
        <KpiCard title="Open tasks (your projects)" value={data.base.kpis.openTasks} icon={CheckSquare} />
      </KpiStrip>

      <DashboardSection title="My projects" description="Status, progress, and deadlines for projects you lead.">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={TH_CLASS}>Project</th>
                <th className={TH_CLASS}>Status</th>
                <th className={TH_CLASS}>Progress</th>
                <th className={TH_CLASS}>Deadline</th>
                <th className={TH_CLASS}>Issues</th>
              </tr>
            </thead>
            <tbody>
              {data.projectsTable.map((p, i) => {
                const overdue = p.target_due_date < today && p.status !== 'completed'
                return (
                  <tr key={p.id} className={cn(i < data.projectsTable.length - 1 && 'border-b border-[var(--color-border)]')}>
                    <td className={TD_CLASS}>
                      <Link href={`/projects/${p.id}`} className={ROW_LINK_CLASS}>
                        {p.project_code} · {p.name}
                      </Link>
                    </td>
                    <td className={TD_CLASS}>
                      <ProjectStatusBadge status={p.status} />
                    </td>
                    <td className={TD_CLASS}>{p.progress_percent}%</td>
                    <td className={cn(TD_CLASS, overdue && 'font-semibold text-[var(--color-danger)]')}>
                      {formatDate(p.target_due_date)}
                    </td>
                    <td className={TD_CLASS}>
                      {p.is_problematic ? <span className="text-[var(--color-warning)]">Flagged</span> : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </DashboardSection>

      {data.base.readyTermins.length > 0 && (
        <DashboardSection title="Upcoming milestones — Siap Diklaim" description="Submit a claim from the project page when ready.">
          <ul className="m-0 list-none space-y-2 p-0">
            {data.base.readyTermins.map((t) => (
              <li
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-muted)' }}
              >
                <div>
                  <p className="m-0 text-[0.8125rem] font-medium text-[var(--color-text-primary)]">
                    {t.label} · {t.projects?.name ?? 'Project'}
                  </p>
                  <p className="m-0 mt-0.5 text-[0.75rem] text-[var(--color-text-muted)]">
                    {t.percentage}% · {t.amount != null ? formatIDR(t.amount) : '—'} {t.currency}
                  </p>
                </div>
                <Link
                  href={`/projects/${t.project_id}`}
                  className="rounded-[var(--radius-control)] bg-[var(--color-primary)] px-3 py-1.5 text-[0.75rem] font-semibold text-[var(--color-primary-fg)] no-underline"
                >
                  Ajukan klaim
                </Link>
              </li>
            ))}
          </ul>
        </DashboardSection>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <DashboardSection title="Needs attention" description="Queue for your portfolio." actions={<FlagCount count={attentionCount} />}>
            <AttentionQueue attention={data.attention} waitingClient={data.waiting} />
          </DashboardSection>

          <DashboardSection title="Tasks by status">
            <TaskStatusBarChart counts={data.pipeline} />
          </DashboardSection>

          <DashboardSection title="Deadline pressure">
            <DeadlineBucketsChart buckets={data.buckets} />
          </DashboardSection>

          <DashboardSection title="Team workload" description="Open task load on your projects — highest first.">
            <WorkloadBars users={data.workload} />
          </DashboardSection>
        </div>

        <div className="space-y-4 xl:col-span-4">
          <DashboardSection title="Recent activity">
            <RecentActivityFeed entries={data.activity} />
          </DashboardSection>
          <ScopedTasksSection tasks={data.base.tasks} title="Open tasks" />
          <ScopedDeliverablesSection deliverables={data.base.deliverables} title="Active deliverables" />
        </div>
      </div>
    </div>
  )
}
