import Link from 'next/link'

import type { SessionProfile } from '@/lib/auth/session'
import type { PersonalDashboardData } from '@/lib/dashboard/personal-queries'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  ScopedDeliverablesSection,
  ScopedKpiRow,
  ScopedPaymentsSection,
  ScopedTasksSection,
  CODE_LINK_CLASS,
} from '@/components/modules/dashboard/dashboard-shared'

export function DashboardPersonal({ data, profile }: { data: PersonalDashboardData; profile: SessionProfile }) {
  if (data.variant === 'senior') {
    return (
      <div className="space-y-6">
        <PageHeader title="Review dashboard" subtitle="Queue and items waiting for your sign-off." />
        <ScopedKpiRow kpis={data.kpis} />
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <ScopedTasksSection tasks={data.tasks} title="Review tasks" />
          <ScopedDeliverablesSection deliverables={data.deliverables} title="Review deliverables" />
        </div>
        <p className="m-0 text-[0.8125rem] text-[var(--color-text-muted)]">
          Open a deliverable to review or approve.{' '}
          <Link href="/deliverables" className={CODE_LINK_CLASS}>
            Browse deliverables
          </Link>
        </p>
      </div>
    )
  }

  if (data.variant === 'member') {
    return (
      <div className="space-y-6">
        <PageHeader
          title="My dashboard"
          subtitle={`${profile.full_name} · Your tasks, deliverables, and payment status.`}
        />
        <ScopedKpiRow kpis={data.kpis} />
        <ScopedTasksSection tasks={data.tasks} title="My open tasks" />
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <ScopedDeliverablesSection deliverables={data.deliverables} title="My deliverables" />
          </div>
          <ScopedPaymentsSection payments={data.payments} />
        </div>
      </div>
    )
  }

  return null
}
