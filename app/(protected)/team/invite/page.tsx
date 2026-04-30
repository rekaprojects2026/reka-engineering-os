import { getSessionProfile, isOwner, requireRole } from '@/lib/auth/session'
import { PageHeader }  from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { InviteForm }  from '@/components/modules/team/InviteForm'
import { getSettingOptions } from '@/lib/settings/queries'

export const metadata = { title: 'Invite Member — ReKa Engineering OS' }

export default async function InviteMemberPage() {
  const profile = await getSessionProfile()
  requireRole(profile.system_role, ['technical_director'])

  const workerTypeOptions = await getSettingOptions('worker_type')

  return (
    <div>
      <PageHeader
        title="Invite Member"
        subtitle="Create an invite link to send to a new team member or freelancer."
      />
      <SectionCard>
        <InviteForm
          workerTypeOptions={workerTypeOptions}
          canInviteDirektur={isOwner(profile.system_role)}
        />
      </SectionCard>
    </div>
  )
}
