import { getSessionProfile, requireRole } from '@/lib/auth/session'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { CompensationForm } from '@/components/modules/compensation/CompensationForm'
import { getMemberOptionsForCompensation, getProjectOptionsForCompensation } from '@/lib/compensation/helpers'
import { createCompensation } from '@/lib/compensation/actions'

export const metadata = { title: 'New Compensation Record — ReKa Engineering OS' }

export default async function NewCompensationPage() {
  const _sp = await getSessionProfile()
  requireRole(_sp.system_role, ['technical_director', 'manajer'])

  const [members, projects] = await Promise.all([
    getMemberOptionsForCompensation(_sp),
    getProjectOptionsForCompensation(_sp),
  ])

  return (
    <div>
      <PageHeader
        title="New Compensation Record"
        subtitle="Ajukan proposal kompensasi kerja. Finance akan mengonfirmasi setelah review."
      />
      <SectionCard>
        <CompensationForm
          members={members}
          projects={projects}
          action={createCompensation}
          submitLabel="Ajukan proposal"
          showStatusField={false}
          showMonthlyFixedGuidance
        />
      </SectionCard>
    </div>
  )
}
