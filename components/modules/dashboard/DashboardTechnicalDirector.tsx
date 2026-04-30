import Link from 'next/link'
import { FolderKanban, AlertCircle, FileText, AlertTriangle, CheckSquare } from 'lucide-react'

import type { SessionProfile } from '@/lib/auth/session'
import type { TDDashboardData } from '@/lib/dashboard/td-queries'
import { PageHeader } from '@/components/layout/PageHeader'
import { KpiCard, KpiStrip } from '@/components/shared/KpiCard'
import {
  DashboardSection,
  FlagCount,
  RecentActivityFeed,
  TH_CLASS,
  TD_CLASS,
  ROW_LINK_CLASS,
  CODE_LINK_CLASS,
} from '@/components/modules/dashboard/dashboard-shared'
import { TaskStatusBarChart } from '@/components/modules/dashboard/TaskStatusBarChart'
import { DeadlineBucketsChart } from '@/components/modules/dashboard/DeadlineBucketsChart'
import { AttentionQueue } from '@/components/modules/dashboard/AttentionQueue'
import { WorkloadBars } from '@/components/modules/dashboard/WorkloadBars'
import { ProjectStatusBadge } from '@/components/modules/projects/ProjectStatusBadge'
import { formatDate } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils/cn'

export function DashboardTechnicalDirector({ data, profile }: { data: TDDashboardData; profile: SessionProfile }) {
  const attentionCount =
    data.attention.overdueTasks.length +
    data.attention.blockedTasks.length +
    data.attention.revisionDeliverables.length +
    data.waitingClient.length

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="page-content animate-fade-in space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={`${profile.full_name} — Operational health across all projects.`}
      />

      <KpiStrip className="lg:grid-cols-4 xl:grid-cols-4">
        <KpiCard title="Active projects" value={data.kpis.activeProjects} icon={FolderKanban} accent="primary" />
        <KpiCard title="Tasks in progress" value={data.tasksInProgress} icon={CheckSquare} />
        <KpiCard title="Deliverables in review" value={data.deliverablesPendingReview} icon={FileText} />
        <KpiCard
          title="Problem projects"
          value={data.problemProjects.length}
          icon={AlertTriangle}
          variant={data.problemProjects.length > 0 ? 'warning' : 'default'}
        />
      </KpiStrip>

      <KpiStrip className="lg:grid-cols-5 xl:grid-cols-5">
        <KpiCard title="Open tasks (all)" value={data.kpis.openTasks} icon={CheckSquare} />
        <KpiCard
          title="Overdue tasks"
          value={data.kpis.overdueTasks}
          icon={AlertCircle}
          variant={data.kpis.overdueTasks > 0 ? 'danger' : 'default'}
        />
        <KpiCard title="Due this week" value={data.kpis.dueThisWeek} icon={AlertCircle} />
        <KpiCard title="In review (deliverables)" value={data.kpis.awaitingReview} icon={FileText} />
        <KpiCard title="Waiting on client" value={data.kpis.waitingClient} icon={AlertCircle} />
      </KpiStrip>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <DashboardSection
            title="Needs attention"
            description="Overdue tasks, blocked work, revision requests, and client holds."
            actions={<FlagCount count={attentionCount} />}
          >
            <AttentionQueue attention={data.attention} waitingClient={data.waitingClient} />
          </DashboardSection>

          <DashboardSection title="Project status board" description="Sorted by target due date — review deadlines first.">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className={TH_CLASS}>Project</th>
                    <th className={TH_CLASS}>Status</th>
                    <th className={TH_CLASS}>Due</th>
                    <th className={TH_CLASS}>%</th>
                  </tr>
                </thead>
                <tbody>
                  {data.projectBoard.map((p, i) => {
                    const overdue = p.target_due_date < today
                    return (
                      <tr key={p.id} className={cn(i < data.projectBoard.length - 1 && 'border-b border-[var(--color-border)]')}>
                        <td className={TD_CLASS}>
                          <Link href={`/projects/${p.id}`} className={ROW_LINK_CLASS}>
                            {p.project_code} · {p.name}
                          </Link>
                        </td>
                        <td className={TD_CLASS}>
                          <ProjectStatusBadge status={p.status} />
                        </td>
                        <td className={cn(TD_CLASS, overdue && 'font-semibold text-[var(--color-danger)]')}>
                          {formatDate(p.target_due_date)}
                        </td>
                        <td className={TD_CLASS}>{p.progress_percent}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </DashboardSection>

          <DashboardSection title="Tasks by status">
            <TaskStatusBarChart counts={data.pipeline} />
          </DashboardSection>

          <DashboardSection title="Deadline pressure">
            <DeadlineBucketsChart buckets={data.buckets} />
          </DashboardSection>

          <DashboardSection title="Team workload" description="Open task load — highest first.">
            <WorkloadBars users={data.teamWorkload} />
          </DashboardSection>
        </div>

        <div className="space-y-4 xl:col-span-4">
          <DashboardSection title="Problem projects" description="Flagged for follow-up.">
            {data.problemProjects.length === 0 ? (
              <p className="m-0 text-sm text-[var(--color-text-muted)]">No problematic projects flagged.</p>
            ) : (
              <ul className="m-0 list-none space-y-2 p-0">
                {data.problemProjects.map((p) => (
                  <li key={p.id}>
                    <Link href={`/projects/${p.id}`} className={ROW_LINK_CLASS}>
                      {p.project_code} · {p.name}
                    </Link>
                    {p.problem_note && <p className="mt-1 text-[0.75rem] text-[var(--color-text-muted)]">{p.problem_note}</p>}
                  </li>
                ))}
              </ul>
            )}
          </DashboardSection>

          <DashboardSection title="Deliverables needing review" description="Oldest internal review first.">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className={TH_CLASS}>Deliverable</th>
                    <th className={TH_CLASS}>Project</th>
                    <th className={TH_CLASS}>Prepared by</th>
                  </tr>
                </thead>
                <tbody>
                  {data.deliverablesForReview.map((d, i) => (
                    <tr key={d.id} className={cn(i < data.deliverablesForReview.length - 1 && 'border-b border-[var(--color-border)]')}>
                      <td className={TD_CLASS}>
                        <Link href={`/deliverables/${d.id}`} className={ROW_LINK_CLASS}>
                          {d.name}
                        </Link>
                      </td>
                      <td className={TD_CLASS}>
                        {d.projects ? (
                          <Link href={`/projects/${d.projects.id}`} className={CODE_LINK_CLASS}>
                            {d.projects.project_code}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className={TD_CLASS}>{d.prepared_by_user?.full_name ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DashboardSection>

          <DashboardSection title="Recent activity">
            <RecentActivityFeed entries={data.activity} />
          </DashboardSection>
        </div>
      </div>
    </div>
  )
}
