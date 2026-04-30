import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getMemberById }  from '@/lib/team/queries'
import { PageHeader }     from '@/components/layout/PageHeader'
import { SectionCard }    from '@/components/shared/SectionCard'
import { TeamMemberForm } from '@/components/modules/team/TeamMemberForm'
import { AvatarUploadInput } from '@/components/modules/team/AvatarUploadInput'
import { isFinance, isTD } from '@/lib/auth/permissions'
import { getSettingOptions } from '@/lib/settings/queries'

export const metadata = { title: 'My Profile — ReKa Engineering OS' }

export default async function MyProfilePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [member, functionalRoleOptions, disciplineOptions, workerTypeOptions] = await Promise.all([
    getMemberById(user.id),
    getSettingOptions('functional_role'),
    getSettingOptions('discipline'),
    getSettingOptions('worker_type'),
  ])

  // Only TD / Finance may edit privileged fields (rates, system role, …) even on their own profile.
  // Direktur & others use the same form but without those sections — matches server stripping in updateMember.
  const showPrivilegedTeamFields = isTD(member?.system_role) || isFinance(member?.system_role)

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
        <AvatarUploadInput photoUrl={member.photo_url} fullName={member.full_name} />
        <div className="my-6 border-t border-[var(--color-border)]" />
        <TeamMemberForm
          mode="edit"
          member={member}
          functionalRoleOptions={functionalRoleOptions}
          disciplineOptions={disciplineOptions}
          workerTypeOptions={workerTypeOptions}
          isAdmin={showPrivilegedTeamFields}
        />
      </SectionCard>
    </div>
  )
}
