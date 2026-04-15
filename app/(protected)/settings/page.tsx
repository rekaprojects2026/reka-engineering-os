import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { SectionCard } from '@/components/shared/SectionCard'
import { Settings } from 'lucide-react'

export const metadata = {
  title: 'Settings — Engineering Agency OS',
}

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Application configuration, templates, and preferences."
      />
      <SectionCard noPadding>
        <EmptyState
          icon={<Settings size={22} />}
          title="Settings coming in Stage 06"
          description="This area will include project templates, status configuration, user management, and application preferences."
        />
      </SectionCard>
    </div>
  )
}
