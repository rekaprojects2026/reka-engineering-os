import { getSessionProfile, requireRole } from '@/lib/auth/session'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { IntakeForm } from '@/components/modules/intakes/IntakeForm'
import { getClientsForSelect } from '@/lib/clients/queries'
import { getSettingOptions } from '@/lib/settings/queries'

export const metadata = { title: 'New Intake — ReKa Engineering OS' }

export default async function NewIntakePage() {
  const _sp = await getSessionProfile()
  requireRole(_sp.system_role, ['admin', 'coordinator'])

  const [clients, disciplineOptions, projectTypeOptions] = await Promise.all([
    getClientsForSelect(),
    getSettingOptions('discipline'),
    getSettingOptions('project_type'),
  ])

  return (
    <div style={{ maxWidth: '720px' }}>
      <PageHeader
        title="New Intake"
        subtitle="Log an incoming lead or project opportunity."
      />
      <SectionCard>
        <IntakeForm mode="create" clients={clients} disciplineOptions={disciplineOptions} projectTypeOptions={projectTypeOptions} />
      </SectionCard>
    </div>
  )
}
