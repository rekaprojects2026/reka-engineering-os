import { notFound } from 'next/navigation'
import { getSessionProfile, requireRole } from '@/lib/auth/session'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { ClientForm } from '@/components/modules/clients/ClientForm'
import { getClientById } from '@/lib/clients/queries'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const client = await getClientById(id)
  return { title: client ? `Edit ${client.client_name} — ReKa Engineering OS` : 'Client not found — ReKa Engineering OS' }
}

export default async function EditClientPage({ params }: PageProps) {
  const _sp = await getSessionProfile()
  requireRole(_sp.system_role, ['admin'])

  const { id } = await params
  const client = await getClientById(id)
  if (!client) notFound()

  return (
    <div style={{ maxWidth: '720px' }}>
      <PageHeader
        title={`Edit: ${client.client_name}`}
        subtitle={client.client_code}
      />
      <SectionCard>
        <ClientForm mode="edit" client={client} />
      </SectionCard>
    </div>
  )
}
