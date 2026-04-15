import { PageHeader }  from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { InviteForm }  from '@/components/modules/team/InviteForm'

export const metadata = { title: 'Invite Member — Engineering Agency OS' }

export default function InviteMemberPage() {
  return (
    <div>
      <PageHeader
        title="Invite Member"
        subtitle="Create an invite link to send to a new team member or freelancer."
      />
      <SectionCard>
        <InviteForm />
      </SectionCard>
    </div>
  )
}
