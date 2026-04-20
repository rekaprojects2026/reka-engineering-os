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
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-warning-subtle)] px-7 py-2.5">
            <span className="text-[0.8125rem] text-[var(--color-warning)]">
              Your profile is incomplete. Complete it so the team knows how to reach you and what you work on.
            </span>
            <Link
              href="/onboarding/complete"
              className="shrink-0 rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-1 text-[0.8125rem] font-semibold text-[var(--color-warning)] no-underline hover:bg-[var(--color-surface-muted)] transition-colors"
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
