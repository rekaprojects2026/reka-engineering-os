import { notFound } from 'next/navigation'

import { PageHeader }     from '@/components/layout/PageHeader'
import { SectionCard }    from '@/components/shared/SectionCard'
import { TeamMemberForm } from '@/components/modules/team/TeamMemberForm'
import { getMemberById }  from '@/lib/team/queries'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const member = await getMemberById(id)
  return { title: member ? `Edit ${member.full_name} — Engineering Agency OS` : 'Member Not Found' }
}

export default async function EditTeamMemberPage({ params }: PageProps) {
  const { id } = await params
  const member = await getMemberById(id)
  if (!member) notFound()

  return (
    <div>
      <PageHeader
        title={`Edit: ${member.full_name}`}
        subtitle="Update profile, role, availability, and rate information."
      />
      <SectionCard>
        <TeamMemberForm mode="edit" member={member} />
      </SectionCard>
    </div>
  )
}
