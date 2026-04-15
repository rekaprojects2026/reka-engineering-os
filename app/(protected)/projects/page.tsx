import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { SectionCard } from '@/components/shared/SectionCard'
import { FolderKanban } from 'lucide-react'

export const metadata = {
  title: 'Projects — Engineering Agency OS',
}

export default function ProjectsPage() {
  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle="Active and historical engineering project work."
      />
      <SectionCard noPadding>
        <EmptyState
          icon={<FolderKanban size={22} />}
          title="Projects module coming in Stage 03"
          description="You will be able to create projects, assign team members, track deadlines, link Google Drive folders, and monitor progress."
        />
      </SectionCard>
    </div>
  )
}
