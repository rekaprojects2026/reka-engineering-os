import { resend, FROM_ADDRESS } from '@/lib/email/client'
import { buildInviteEmail } from '@/lib/email/templates/invite'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export interface SendInviteEmailParams {
  toEmail: string
  recipientName: string | null
  inviterName: string
  token: string
  expiresAt: string // ISO string
}

/**
 * Fire-and-forget invite email. Errors are logged but NOT rethrown —
 * the invite is already saved to DB at this point and must not be rolled back.
 */
export async function sendInviteEmail(params: SendInviteEmailParams): Promise<void> {
  const inviteUrl = `${APP_URL}/onboarding/${params.token}`

  const { subject, html } = buildInviteEmail({
    recipientName: params.recipientName,
    inviterName: params.inviterName,
    inviteUrl,
    expiresAt: params.expiresAt,
  })

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: params.toEmail,
      subject,
      html,
    })

    if (error) {
      console.error('[sendInviteEmail] Resend error:', error)
    }
  } catch (err) {
    console.error('[sendInviteEmail] Unexpected error:', err)
  }
}
