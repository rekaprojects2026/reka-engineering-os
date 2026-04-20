import { notFound } from 'next/navigation'

import { getSessionProfile, requireRole } from '@/lib/auth/session'
import { PageHeader }     from '@/components/layout/PageHeader'
import { SectionCard }    from '@/components/shared/SectionCard'
import { TeamMemberForm } from '@/components/modules/team/TeamMemberForm'
import { getMemberById }  from '@/lib/team/queries'
import { getSettingOptions } from '@/lib/settings/queries'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const member = await getMemberById(id)
  return { title: member ? `Edit ${member.full_name} — ReKa Engineering OS` : 'Member not found — ReKa Engineering OS' }
}

export default async function EditTeamMemberPage({ params }: PageProps) {
  const _sp = await getSessionProfile()
  requireRole(_sp.system_role, ['admin'])

  const { id } = await params
  const [member, functionalRoleOptions, disciplineOptions, workerTypeOptions] = await Promise.all([
    getMemberById(id),
    getSettingOptions('functional_role'),
    getSettingOptions('discipline'),
    getSettingOptions('worker_type'),
  ])
  if (!member) notFound()

  return (
    <div>
      <PageHeader
        title={`Edit: ${member.full_name}`}
        subtitle="Update profile, role, availability, and rate information."
      />
      <SectionCard>
        <TeamMemberForm mode="edit" member={member} functionalRoleOptions={functionalRoleOptions} disciplineOptions={disciplineOptions} workerTypeOptions={workerTypeOptions} />
      </SectionCard>
    </div>
  )
}
