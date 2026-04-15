import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import LoginForm from './LoginForm'

export const metadata = {
  title: 'Sign In — Engineering Agency OS',
  description: 'Sign in to access the Engineering Agency internal control app.',
}

export default async function LoginPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-background)',
        padding: '24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Logo / Wordmark */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '8px',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                backgroundColor: 'var(--color-primary)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>EA</span>
            </div>
            <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--color-text-primary)' }}>
              Engineering Agency OS
            </span>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Internal control system — team access only
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '10px',
            padding: '32px',
          }}
        >
          <h1 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '24px' }}>
            Sign in to your account
          </h1>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
