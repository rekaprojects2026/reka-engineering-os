const APP_NAME = 'ReKa Engineering OS'

export interface InviteEmailData {
  recipientName: string | null
  inviterName: string
  inviteUrl: string
  expiresAt: string // ISO string
}

export function buildInviteEmail(data: InviteEmailData): {
  subject: string
  html: string
} {
  const greeting = data.recipientName
    ? `Halo, ${data.recipientName}!`
    : 'Halo!'

  const expiryDate = new Date(data.expiresAt).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const subject = `Undangan bergabung ke ${APP_NAME}`

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
              <h1 style="margin:0 0 24px;font-size:22px;font-weight:700;color:#09090b;">Kamu diundang untuk bergabung</h1>

              <p style="margin:0 0 16px;font-size:15px;color:#3f3f46;line-height:1.6;">
                ${greeting}
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#3f3f46;line-height:1.6;">
                <strong>${data.inviterName}</strong> mengundang kamu untuk bergabung ke <strong>${APP_NAME}</strong>.
                Klik tombol di bawah untuk mengatur password dan melengkapi profilmu.
              </p>

              <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td>
                    <a
                      href="${data.inviteUrl}"
                      style="display:inline-block;padding:12px 24px;background:#18181b;color:#fafafa;border-radius:7px;font-size:14px;font-weight:600;text-decoration:none;"
                    >
                      Aktifkan Akunmu →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:13px;color:#71717a;line-height:1.5;">
                Atau copy link berikut ke browser:
              </p>
              <p style="margin:0 0 24px;font-size:12px;color:#71717a;word-break:break-all;font-family:ui-monospace,monospace;background:#f4f4f5;padding:10px 12px;border-radius:6px;">
                ${data.inviteUrl}
              </p>

              <hr style="border:none;border-top:1px solid #e4e4e7;margin:0 0 20px;" />

              <p style="margin:0;font-size:12px;color:#a1a1aa;line-height:1.6;">
                Link ini berlaku sampai <strong>${expiryDate}</strong>.<br />
                Jika kamu tidak merasa diundang, abaikan email ini.
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
