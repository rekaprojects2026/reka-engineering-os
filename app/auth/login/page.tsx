import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import LoginForm from './LoginForm'

export const metadata = {
  title: 'Sign In — ReKa Engineering OS',
  description: 'Sign in to access the internal control app.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ activated?: string }>
}) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  const { activated } = await searchParams

  return (
    <div className="flex min-h-screen bg-[var(--color-background)]">
      {/* Left panel — brand (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-[#142D50] p-12">
        {/* Top: Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
            <span className="text-lg font-bold text-white">R</span>
          </div>
          <div>
            <span className="text-xl font-semibold text-white">ReKa</span>
            <span className="text-xl text-white/60 ml-1.5">Engineering OS</span>
          </div>
        </div>

        {/* Middle: Quote */}
        <div className="space-y-6">
          <blockquote className="text-2xl font-light leading-relaxed text-white/90">
            &ldquo;Manage projects, track tasks, and streamline team compensation — all in one place.&rdquo;
          </blockquote>
          <p className="text-sm font-medium text-white/60">
            Internal platform for authorized team members.
          </p>
        </div>

        {/* Bottom: Tagline */}
        <p className="text-xs text-white/30">
          ReKa Engineering OS © {new Date().getFullYear()}
        </p>
      </div>

      {/* Right panel — login form */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center justify-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[#142D50]">
              <span className="text-sm font-bold text-white">R</span>
            </div>
            <span className="text-lg font-semibold text-[var(--color-text-primary)]">
              ReKa Engineering OS
            </span>
          </div>

          {/* Login card */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-md)]">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
                Welcome back
              </h1>
              <p className="mt-1 text-[0.875rem] text-[var(--color-text-muted)]">
                Sign in to access your workspace
              </p>
            </div>

            {activated && (
              <div
                className="mb-6 rounded-lg border border-[#BBF7D0] bg-[#DCFCE7] px-3 py-2.5 text-[0.8125rem] text-[#16A34A]"
                role="status"
              >
                Account activated! Sign in with your email and the password you just set.
              </div>
            )}

            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  )
}
