import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { SectionCard } from '@/components/shared/SectionCard'
import { CheckSquare } from 'lucide-react'

export const metadata = {
  title: 'Tasks — Engineering Agency OS',
}

export default function TasksPage() {
  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle="Executable work items assigned to team members across all projects."
      />
      <SectionCard noPadding>
        <EmptyState
          icon={<CheckSquare size={22} />}
          title="Tasks module coming in Stage 04"
          description="You will be able to view and manage tasks across all projects, update progress, track blockers, and attach working files."
        />
      </SectionCard>
    </div>
  )
}
