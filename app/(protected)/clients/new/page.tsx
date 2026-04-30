import { getSessionProfile, requireRole } from '@/lib/auth/session'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { ClientForm } from '@/components/modules/clients/ClientForm'

export const metadata = { title: 'New Client — ReKa Engineering OS' }

export default async function NewClientPage() {
  const _sp = await getSessionProfile()
  requireRole(_sp.system_role, ['bd', 'direktur', 'technical_director', 'finance'])

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
