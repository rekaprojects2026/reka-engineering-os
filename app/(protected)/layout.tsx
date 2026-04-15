import Link     from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { AppSidebar }   from '@/components/layout/AppSidebar'
import { AppTopbar }    from '@/components/layout/AppTopbar'
import { TopbarSearch } from '@/components/layout/TopbarSearch'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Fetch profile for sidebar + completion check
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, profile_completed_at')
    .eq('id', user.id)
    .single()

  const fullName         = profile?.full_name ?? user.email?.split('@')[0] ?? 'User'
  const email            = profile?.email    ?? user.email ?? ''
  const profileIncomplete = profile && profile.profile_completed_at === null

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <AppSidebar userFullName={fullName} userEmail={email} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <AppTopbar right={<TopbarSearch />} />

        {/* Profile completion banner */}
        {profileIncomplete && (
          <div
            style={{
              padding:         '10px 24px',
              backgroundColor: '#FFFAEB',
              borderBottom:    '1px solid #FDE68A',
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'space-between',
              gap:             '12px',
              flexShrink:      0,
            }}
          >
            <span style={{ fontSize: '0.8125rem', color: '#B45309' }}>
              Your profile is incomplete. Complete it so the team knows how to reach you and what you work on.
            </span>
            <Link
              href="/onboarding/complete"
              style={{
                fontSize:        '0.8125rem',
                fontWeight:      600,
                color:           '#B45309',
                textDecoration:  'none',
                whiteSpace:      'nowrap',
                padding:         '4px 10px',
                border:          '1px solid #FCD34D',
                borderRadius:    '5px',
                backgroundColor: '#FFFBEB',
              }}
            >
              Complete profile →
            </Link>
          </div>
        )}

        <main
          style={{
            flex:            1,
            overflowY:       'auto',
            backgroundColor: 'var(--color-background)',
          }}
        >
          <div
            style={{
              maxWidth: 'var(--content-max-width)',
              margin:   '0 auto',
              padding:  '28px',
            }}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
