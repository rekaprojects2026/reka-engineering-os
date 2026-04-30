const APP_NAME = 'ReKa Engineering OS'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.reka-engineering.com'

export interface NotificationEmailData {
  recipientName: string
  title: string
  body: string | null
  link: string | null
  notificationType: string
}

export function buildNotificationEmail(data: NotificationEmailData): {
  subject: string
  html: string
} {
  const subject = `${data.title} — ${APP_NAME}`

  const ctaButton = data.link
    ? `
      <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr>
          <td>
            <a
              href="${APP_URL}${data.link}"
              style="display:inline-block;padding:11px 22px;background:#18181b;color:#fafafa;border-radius:7px;font-size:14px;font-weight:600;text-decoration:none;"
            >
              Lihat Detail →
            </a>
          </td>
        </tr>
      </table>`
    : ''

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:ui-sans-serif,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:10px;border:1px solid #e4e4e7;padding:40px 32px;">
          <tr>
            <td>
              <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#71717a;letter-spacing:0.05em;text-transform:uppercase;">${APP_NAME}</p>
              <h1 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#09090b;">${data.title}</h1>

              <p style="margin:0 0 8px;font-size:14px;color:#71717a;">Halo, ${data.recipientName}.</p>

              ${data.body ? `<p style="margin:0 0 24px;font-size:15px;color:#3f3f46;line-height:1.6;">${data.body}</p>` : ''}

              ${ctaButton}

              <hr style="border:none;border-top:1px solid #e4e4e7;margin:0 0 20px;" />

              <p style="margin:0;font-size:12px;color:#a1a1aa;line-height:1.6;">
                Notifikasi ini dikirim dari <strong>${APP_NAME}</strong>.<br />
                Login untuk melihat semua notifikasi: <a href="${APP_URL}/dashboard" style="color:#71717a;">${APP_URL}/dashboard</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim()

  return { subject, html }
}
