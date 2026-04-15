import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { SectionCard } from '@/components/shared/SectionCard'
import { FileText } from 'lucide-react'

export const metadata = {
  title: 'Deliverables — Engineering Agency OS',
}

export default function DeliverablesPage() {
  return (
    <div>
      <PageHeader
        title="Deliverables"
        subtitle="Project outputs tracked through review, revision, and final issuance."
      />
      <SectionCard noPadding>
        <EmptyState
          icon={<FileText size={22} />}
          title="Deliverables module coming in Stage 04"
          description="You will be able to track deliverables, manage revision cycles, record client feedback, and link final issued files."
        />
      </SectionCard>
    </div>
  )
}
