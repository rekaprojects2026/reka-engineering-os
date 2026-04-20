import { getSessionProfile, requireRole } from '@/lib/auth/session'
import { PageHeader }      from '@/components/layout/PageHeader'
import { SectionCard }     from '@/components/shared/SectionCard'
import { TeamMemberForm }  from '@/components/modules/team/TeamMemberForm'
import { getSettingOptions } from '@/lib/settings/queries'

export const metadata = { title: 'Add Member — ReKa Engineering OS' }

export default async function NewTeamMemberPage() {
  const profile = await getSessionProfile()
  requireRole(profile.system_role, ['admin'])

  const [functionalRoleOptions, disciplineOptions, workerTypeOptions] = await Promise.all([
    getSettingOptions('functional_role'),
    getSettingOptions('discipline'),
    getSettingOptions('worker_type'),
  ])

  return (
    <div>
      <PageHeader
        title="Add Member"
        subtitle="Create a new team member or freelancer account."
      />
      <SectionCard>
        <TeamMemberForm mode="create" functionalRoleOptions={functionalRoleOptions} disciplineOptions={disciplineOptions} workerTypeOptions={workerTypeOptions} />
      </SectionCard>
    </div>
  )
}
