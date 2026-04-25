import { getResend, FROM_ADDRESS } from '@/lib/email/client'
import { buildNotificationEmail } from '@/lib/email/templates/notification'

export interface SendNotificationEmailParams {
  toEmail: string
  recipientName: string
  title: string
  body: string | null
  link: string | null
  notificationType: string
}

/**
 * Fire-and-forget notification email.
 * Errors are logged but NOT rethrown — webhook must always return 200.
 */
export async function sendNotificationEmail(
  params: SendNotificationEmailParams
): Promise<void> {
  const { subject, html } = buildNotificationEmail({
    recipientName: params.recipientName,
    title: params.title,
    body: params.body,
    link: params.link,
    notificationType: params.notificationType,
  })

  try {
    const { error } = await getResend().emails.send({
      from: FROM_ADDRESS,
      to: params.toEmail,
      subject,
      html,
    })

    if (error) {
      console.error('[sendNotificationEmail] Resend error:', error)
    }
  } catch (err) {
    console.error('[sendNotificationEmail] Unexpected error:', err)
  }
}
