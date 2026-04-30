import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { google } from 'googleapis'
import { getSessionProfileOptional } from '@/lib/auth/session'
import { isManagement } from '@/lib/auth/permissions'

export async function GET() {
  const profile = await getSessionProfileOptional()
  if (!profile) redirect('/auth/login')
  if (!isManagement(profile.system_role)) {
    return new Response('Forbidden', { status: 403 })
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!clientId || !clientSecret || !appUrl) {
    return new Response('Google OAuth is not configured (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / NEXT_PUBLIC_APP_URL).', {
      status: 503,
    })
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    `${appUrl.replace(/\/$/, '')}/api/integrations/google/oauth/callback`,
  )

  const state = crypto.randomUUID()
  const jar = await cookies()
  jar.set('google_oauth_state', state, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path:     '/',
    maxAge:   600,
  })

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt:        'consent',
    scope:         ['https://www.googleapis.com/auth/drive.file'],
    state,
  })

  redirect(url)
}
