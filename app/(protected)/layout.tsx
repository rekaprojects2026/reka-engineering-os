import Link from 'next/link'
import { AppSidebar }    from '@/components/layout/AppSidebar'
import { AppTopbar }     from '@/components/layout/AppTopbar'
import { TopbarSearch }  from '@/components/layout/TopbarSearch'
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav'
import { getSessionProfile } from '@/lib/auth/session'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getSessionProfile()

  const profileIncomplete = profile.profile_completed_at === null

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar
        userFullName={profile.full_name}
        userEmail={profile.email}
        systemRole={profile.system_role}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <AppTopbar left={<BreadcrumbNav />} right={<TopbarSearch />} showSearch={true} />

        {/* Profile completion banner */}
        {profileIncomplete && (
          <div
            className="flex shrink-0 items-center justify-between gap-3 px-6 py-2.5 text-sm"
            style={{
              backgroundColor: 'var(--color-warning-subtle)',
              borderBottom: '1px solid rgba(138, 74, 8, 0.15)',
            }}
          >
            <div className="flex items-center gap-2.5">
              <svg
                className="h-4 w-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                style={{ color: 'var(--color-warning)' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <span style={{ color: 'var(--color-warning)' }}>
                Your profile is incomplete. Complete it so the team knows how to reach you.
              </span>
            </div>
            <Link
              href="/onboarding/complete"
              className="shrink-0 rounded-md px-3 py-1 text-xs font-semibold transition-colors no-underline"
              style={{
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-warning)',
                border: '1px solid rgba(138,74,8,0.25)',
              }}
            >
              Complete profile →
            </Link>
          </div>
        )}

        <main className="flex-1 overflow-y-auto bg-[var(--color-background)]">
          <div className="mx-auto max-w-[var(--content-max-width)] px-8 py-8 md:px-12 xl:px-14">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
