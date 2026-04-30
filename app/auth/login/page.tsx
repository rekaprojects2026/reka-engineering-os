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
    <div className="flex min-h-screen">
      {/* ── Left panel — brand (desktop only) ─────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-[#142D50] p-12 relative overflow-hidden">
        {/* Background texture — subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />

        {/* Top: Logo */}
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
            <span className="text-lg font-bold text-white">R</span>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold leading-tight text-white">ReKa</span>
            <span className="text-xs text-white/50 leading-tight">Engineering OS</span>
          </div>
        </div>

        {/* Middle: Quote + feature list */}
        <div className="relative space-y-8">
          <div className="space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
              </svg>
            </div>
            <blockquote className="text-2xl font-light leading-relaxed text-white/90">
              &ldquo;Manage projects, track tasks, and streamline team compensation — all in one place.&rdquo;
            </blockquote>
          </div>

          {/* Feature highlights */}
          <ul className="space-y-3">
            {[
              'Real-time project pipeline visibility',
              'Automated task & deliverable tracking',
              'Team compensation & payment management',
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-sm text-white/60">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom: Copyright */}
        <p className="relative text-xs text-white/25">
          ReKa Engineering OS © {new Date().getFullYear()} — Internal use only
        </p>
      </div>

      {/* ── Right panel — login form ────────────────────────────── */}
      <div
        className="flex flex-1 flex-col items-center justify-center p-6 lg:p-12"
        style={{ backgroundColor: 'var(--color-background)' }}
      >
        {/* Mobile logo — shown only on small screens */}
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#142D50]">
            <span className="text-sm font-bold text-white">R</span>
          </div>
          <div>
            <span className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>ReKa</span>
            <span className="ml-1 text-base" style={{ color: 'var(--color-text-muted)' }}>Engineering OS</span>
          </div>
        </div>

        {/* Login card */}
        <div
          className="w-full max-w-[400px] rounded-2xl border p-8"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {/* Header */}
          <div className="mb-7">
            <h1
              className="text-[1.375rem] font-semibold leading-tight tracking-tight"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Welcome back
            </h1>
            <p className="mt-1.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Sign in to access your workspace
            </p>
          </div>

          {/* Account activated banner */}
          {activated && (
            <div
              className="mb-5 flex items-start gap-2.5 rounded-lg px-3.5 py-3 text-sm"
              style={{
                backgroundColor: 'var(--color-success-subtle)',
                color: 'var(--color-success)',
                border: '1px solid #BBF7D0',
              }}
              role="status"
            >
              <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Account activated! Sign in with your email and the password you just set.</span>
            </div>
          )}

          {/* Form */}
          <LoginForm />
        </div>

        {/* Footer note */}
        <p className="mt-6 text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
          Internal platform — authorized team members only
        </p>
      </div>
    </div>
  )
}
