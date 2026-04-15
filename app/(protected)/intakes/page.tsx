import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { SectionCard } from '@/components/shared/SectionCard'
import { ClipboardList } from 'lucide-react'

export const metadata = {
  title: 'Intakes — Engineering Agency OS',
}

export default function IntakesPage() {
  return (
    <div>
      <PageHeader
        title="Intakes"
        subtitle="Incoming leads and project opportunities before conversion."
      />
      <SectionCard noPadding>
        <EmptyState
          icon={<ClipboardList size={22} />}
          title="Intakes module coming in Stage 02"
          description="You will be able to log leads from Upwork, Fiverr, and direct channels, qualify them, and convert them into projects."
        />
      </SectionCard>
    </div>
  )
}
