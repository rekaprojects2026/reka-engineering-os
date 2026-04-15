import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { ClientForm } from '@/components/modules/clients/ClientForm'

export const metadata = { title: 'New Client — Engineering Agency OS' }

export default function NewClientPage() {
  return (
    <div style={{ maxWidth: '720px' }}>
      <PageHeader
        title="New Client"
        subtitle="Add a new client to your agency roster."
      />
      <SectionCard>
        <ClientForm mode="create" />
      </SectionCard>
    </div>
  )
}
