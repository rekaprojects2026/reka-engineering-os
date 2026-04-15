import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getMemberById }  from '@/lib/team/queries'
import { PageHeader }     from '@/components/layout/PageHeader'
import { SectionCard }    from '@/components/shared/SectionCard'
import { TeamMemberForm } from '@/components/modules/team/TeamMemberForm'

export const metadata = { title: 'My Profile — Engineering Agency OS' }

export default async function MyProfilePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const member = await getMemberById(user.id)

  // If no profile record yet (edge case), fall back gracefully
  if (!member) {
    return (
      <div>
        <PageHeader
          title="My Profile"
          subtitle="Your personal profile and work information."
        />
        <SectionCard>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            Profile not found. Please contact your admin to set up your account.
          </p>
        </SectionCard>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="My Profile"
        subtitle={`${member.email} · Edit your profile and availability.`}
      />
      <SectionCard>
        <TeamMemberForm mode="edit" member={member} />
      </SectionCard>
    </div>
  )
}
