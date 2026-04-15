import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { AppSidebar }    from '@/components/layout/AppSidebar'
import { AppTopbar }     from '@/components/layout/AppTopbar'
import { TopbarSearch }  from '@/components/layout/TopbarSearch'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Fetch profile for sidebar — graceful fallback if profiles table not yet seeded
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single()

  const fullName = profile?.full_name ?? user.email?.split('@')[0] ?? 'User'
  const email = profile?.email ?? user.email ?? ''

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <AppSidebar userFullName={fullName} userEmail={email} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <AppTopbar right={<TopbarSearch />} />

        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            backgroundColor: 'var(--color-background)',
          }}
        >
          <div
            style={{
              maxWidth: 'var(--content-max-width)',
              margin: '0 auto',
              padding: '28px',
            }}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
