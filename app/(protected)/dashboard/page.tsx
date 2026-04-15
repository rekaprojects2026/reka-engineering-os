import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { KpiCard } from '@/components/shared/KpiCard'
import { SectionCard } from '@/components/shared/SectionCard'
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  FileText,
  Clock,
  AlertCircle,
} from 'lucide-react'

export const metadata = {
  title: 'Dashboard — Engineering Agency OS',
}

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Operational overview of active projects, tasks, and priorities."
      />

      {/* KPI row — placeholder values */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '14px',
          marginBottom: '24px',
        }}
      >
        <KpiCard label="Active Projects"        value="—" icon={<FolderKanban size={18} />} />
        <KpiCard label="Overdue Tasks"          value="—" icon={<AlertCircle size={18} />} />
        <KpiCard label="Due This Week"          value="—" icon={<Clock size={18} />} />
        <KpiCard label="Awaiting Review"        value="—" icon={<FileText size={18} />} />
        <KpiCard label="Waiting on Client"      value="—" icon={<CheckSquare size={18} />} />
        <KpiCard label="Projects in Revision"   value="—" icon={<FolderKanban size={18} />} />
      </div>

      {/* Main content area — placeholder */}
      <SectionCard title="Needs Attention">
        <EmptyState
          icon={<LayoutDashboard size={22} />}
          title="Dashboard analytics coming in Stage 05"
          description="This panel will show urgent projects, overdue tasks, team workload, and recent activity once the data modules are in place."
        />
      </SectionCard>
    </div>
  )
}
