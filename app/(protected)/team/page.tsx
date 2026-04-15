import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { SectionCard } from '@/components/shared/SectionCard'
import { UserSquare2 } from 'lucide-react'

export const metadata = {
  title: 'Team — Engineering Agency OS',
}

export default function TeamPage() {
  return (
    <div>
      <PageHeader
        title="Team"
        subtitle="Internal team members and subcontractors."
      />
      <SectionCard noPadding>
        <EmptyState
          icon={<UserSquare2 size={22} />}
          title="Team management coming in Stage 03"
          description="You will be able to view team members, their disciplines, roles, and current project assignments."
        />
      </SectionCard>
    </div>
  )
}
