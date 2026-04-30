import { getInviteByToken } from '@/lib/invites/queries'
import { ActivateForm } from '@/components/modules/onboarding/ActivateForm'
import { AlertCircle } from 'lucide-react'

interface PageProps {
  params: Promise<{ token: string }>
}

export const metadata = { title: 'Activate Account — ReKa Engineering OS' }

export default async function OnboardingPage({ params }: PageProps) {
  const { token } = await params
  const invite = await getInviteByToken(token)

  if (!invite) {
    return (
      <ErrorCard
        title="Invalid invite link"
        message="This invite link doesn't exist. Check the link or contact your admin."
      />
    )
  }

  if (invite.status === 'accepted') {
    return (
      <ErrorCard
        title="Invite already used"
        message="This invite has already been activated. Try logging in with your email and password."
      />
    )
  }

  if (invite.status === 'revoked') {
    return (
      <ErrorCard
        title="Invite revoked"
        message="This invite has been revoked by an admin. Contact your admin for a new invite."
      />
    )
  }

  const isExpired = invite.status === 'expired' || new Date(invite.expires_at) < new Date()
  if (isExpired) {
    return (
      <ErrorCard
        title="Invite expired"
        message="This invite link has expired. Contact your admin to send you a new one."
      />
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] p-8">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#142D50]">
              <span className="text-sm font-bold text-white">R</span>
            </div>
            <span className="text-lg font-semibold text-[var(--color-text-primary)]">ReKa Engineering OS</span>
          </div>
          <p className="text-[0.875rem] text-[var(--color-text-muted)]">You&apos;ve been invited to join the team.</p>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-md)]">
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Activate your account</h1>
          <p className="mt-1 text-[0.8125rem] text-[var(--color-text-muted)]">Set your name and password to get started.</p>
          <div className="mt-6">
            <ActivateForm token={token} email={invite.email} fullName={invite.full_name} />
          </div>
        </div>
      </div>
    </div>
  )
}

function ErrorCard({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] p-8">
      <div className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-8 py-10 text-center shadow-[var(--shadow-md)]">
        <div
          className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-danger-subtle)] text-[var(--color-danger)]"
          aria-hidden="true"
        >
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">{title}</h2>
        <p className="mt-2 text-[0.8125rem] leading-relaxed text-[var(--color-text-muted)]">{message}</p>
      </div>
    </div>
  )
}
