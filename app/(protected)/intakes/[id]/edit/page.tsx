import { notFound } from 'next/navigation'
import { getSessionProfile, requireRole } from '@/lib/auth/session'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { IntakeForm } from '@/components/modules/intakes/IntakeForm'
import { getIntakeById } from '@/lib/intakes/queries'
import { getClientsForSelect } from '@/lib/clients/queries'
import { getSettingOptions } from '@/lib/settings/queries'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const intake = await getIntakeById(id)
  return { title: intake ? `Edit ${intake.title} — ReKa Engineering OS` : 'Intake not found — ReKa Engineering OS' }
}

export default async function EditIntakePage({ params }: PageProps) {
  const _sp = await getSessionProfile()
  requireRole(_sp.system_role, ['admin', 'coordinator'])

  const { id } = await params
  const [intake, clients, disciplineOptions, projectTypeOptions] = await Promise.all([
    getIntakeById(id),
    getClientsForSelect(),
    getSettingOptions('discipline'),
    getSettingOptions('project_type'),
  ])
  if (!intake) notFound()

  return (
    <div style={{ maxWidth: '720px' }}>
      <PageHeader
        title={`Edit: ${intake.title}`}
        subtitle={intake.intake_code}
      />
      <SectionCard>
        <IntakeForm mode="edit" intake={intake} clients={clients} disciplineOptions={disciplineOptions} projectTypeOptions={projectTypeOptions} />
      </SectionCard>
    </div>
  )
}
