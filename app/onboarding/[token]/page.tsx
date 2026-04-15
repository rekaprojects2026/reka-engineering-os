import { getInviteByToken } from '@/lib/invites/queries'
import { ActivateForm }     from '@/components/modules/onboarding/ActivateForm'

interface PageProps {
  params: Promise<{ token: string }>
}

export const metadata = { title: 'Activate Account — Engineering Agency OS' }

export default async function OnboardingPage({ params }: PageProps) {
  const { token } = await params
  const invite = await getInviteByToken(token)

  // ── Invalid or missing token ──────────────────────────────
  if (!invite) {
    return <ErrorCard title="Invalid invite link" message="This invite link doesn't exist. Check the link or contact your admin." />
  }

  // ── Already used ──────────────────────────────────────────
  if (invite.status === 'accepted') {
    return <ErrorCard title="Invite already used" message="This invite has already been activated. Try logging in with your email and password." />
  }

  // ── Revoked ───────────────────────────────────────────────
  if (invite.status === 'revoked') {
    return <ErrorCard title="Invite revoked" message="This invite has been revoked by an admin. Contact your admin for a new invite." />
  }

  // ── Expired (status or date check) ───────────────────────
  const isExpired = invite.status === 'expired' || new Date(invite.expires_at) < new Date()
  if (isExpired) {
    return <ErrorCard title="Invite expired" message="This invite link has expired. Contact your admin to send you a new one." />
  }

  // ── Valid — show activation form ──────────────────────────
  return (
    <div
      style={{
        minHeight:       '100vh',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        backgroundColor: 'var(--color-background)',
        padding:         '24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <div
            style={{
              display:        'inline-flex',
              alignItems:     'center',
              gap:            '10px',
              marginBottom:   '8px',
            }}
          >
            <div
              style={{
                width:           '32px',
                height:          '32px',
                backgroundColor: 'var(--color-primary)',
                borderRadius:    '6px',
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
              }}
            >
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>EA</span>
            </div>
            <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--color-text-primary)' }}>
              Engineering Agency OS
            </span>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            You&apos;ve been invited to join the team.
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border:          '1px solid var(--color-border)',
            borderRadius:    '10px',
            padding:         '32px',
          }}
        >
          <h1 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '6px' }}>
            Activate your account
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '24px' }}>
            Set your name and password to get started.
          </p>

          <ActivateForm
            token={token}
            email={invite.email}
            fullName={invite.full_name}
          />
        </div>
      </div>
    </div>
  )
}

// ── Error state card ──────────────────────────────────────────

function ErrorCard({ title, message }: { title: string; message: string }) {
  return (
    <div
      style={{
        minHeight:       '100vh',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        backgroundColor: 'var(--color-background)',
        padding:         '24px',
      }}
    >
      <div
        style={{
          width:           '100%',
          maxWidth:        '440px',
          backgroundColor: 'var(--color-surface)',
          border:          '1px solid var(--color-border)',
          borderRadius:    '10px',
          padding:         '40px 32px',
          textAlign:       'center',
        }}
      >
        <div
          style={{
            width:           '44px',
            height:          '44px',
            backgroundColor: 'var(--color-danger-subtle)',
            borderRadius:    '50%',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            margin:          '0 auto 16px',
            fontSize:        '1.25rem',
          }}
        >
          ✕
        </div>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px' }}>{title}</h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{message}</p>
      </div>
    </div>
  )
}
