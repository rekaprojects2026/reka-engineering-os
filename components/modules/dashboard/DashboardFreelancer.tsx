import type { SessionProfile } from '@/lib/auth/session'
import type { PersonalDashboardData } from '@/lib/dashboard/personal-queries'
import { PageHeader } from '@/components/layout/PageHeader'
import { FreelancerTasksTable, ScopedPaymentsSection } from '@/components/modules/dashboard/dashboard-shared'

export function DashboardFreelancer({ data, profile }: { data: PersonalDashboardData; profile: SessionProfile }) {
  if (data.variant !== 'freelancer') return null

  return (
    <div className="space-y-6">
      <PageHeader title={`Hello, ${profile.full_name}`} subtitle="Your assigned tasks and recent payments — project names are hidden." />
      <FreelancerTasksTable tasks={data.tasks} title="My tasks" />
      <ScopedPaymentsSection payments={data.payments} />
    </div>
  )
}
