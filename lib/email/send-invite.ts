import { getResend, FROM_ADDRESS } from '@/lib/email/client'
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
 * Sends invite email after DB insert. Errors are logged and reported via `{ ok }` —
 * callers should not throw; invite row must stay valid.
 */
export async function sendInviteEmail(
  params: SendInviteEmailParams
): Promise<{ ok: boolean }> {
  const inviteUrl = `${APP_URL}/onboarding/${params.token}`

  const { subject, html } = buildInviteEmail({
    recipientName: params.recipientName,
    inviterName: params.inviterName,
    inviteUrl,
    expiresAt: params.expiresAt,
  })

  try {
    const result = await getResend().emails.send({
      from: FROM_ADDRESS,
      to: params.toEmail,
      subject,
      html,
    })

    if (result.error) {
      console.error(
        '[sendInviteEmail] Resend error:',
        result.error.name,
        result.error.message,
        'from:',
        FROM_ADDRESS,
        'to:',
        params.toEmail
      )
      return { ok: false }
    }
    return { ok: true }
  } catch (err) {
    console.error('[sendInviteEmail] Unexpected error:', err)
    return { ok: false }
  }
}
