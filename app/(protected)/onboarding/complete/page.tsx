import { redirect }           from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getMemberById }      from '@/lib/team/queries'
import { PageHeader }         from '@/components/layout/PageHeader'
import { SectionCard }        from '@/components/shared/SectionCard'
import { ProfileCompletionForm } from '@/components/modules/onboarding/ProfileCompletionForm'

export const metadata = { title: 'Complete Your Profile — ReKa Engineering OS' }

export default async function ProfileCompletionPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await getMemberById(user.id)
  if (!profile) redirect('/dashboard')

  // If already completed, redirect to my-profile
  if (profile.profile_completed_at) redirect('/my-profile')

  return (
    <div>
      <PageHeader
        title="Complete Your Profile"
        subtitle="Fill in your details so the team knows who you are and how to reach you."
      />

      <div
        style={{
          padding:         '12px 16px',
          backgroundColor: 'var(--color-info-subtle)',
          border:          '1px solid var(--color-border)',
          borderRadius:    'var(--radius-control)',
          marginBottom:    '20px',
          fontSize:        '0.8125rem',
          color:           'var(--color-info)',
          lineHeight:      1.5,
        }}
      >
        <strong>Welcome!</strong> Your account has been activated. Please complete your profile below. You can update it any time from My Profile.
      </div>

      <SectionCard>
        <ProfileCompletionForm profile={profile} />
      </SectionCard>
    </div>
  )
}
