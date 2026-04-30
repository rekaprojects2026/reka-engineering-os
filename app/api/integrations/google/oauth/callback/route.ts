import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { google } from 'googleapis'
import { createServerClient } from '@/lib/supabase/server'
import { getSessionProfileOptional } from '@/lib/auth/session'
import { isManagement } from '@/lib/auth/permissions'

export async function GET(request: Request) {
  const profile = await getSessionProfileOptional()
  if (!profile) redirect('/auth/login')
  if (!isManagement(profile.system_role)) {
    return new Response('Forbidden', { status: 403 })
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!clientId || !clientSecret || !appUrl) {
    return new Response('Google OAuth is not configured.', { status: 503 })
  }

  const url = new URL(request.url)
  const err = url.searchParams.get('error')
  if (err) {
    redirect(`/settings?tab=finance&drive_error=${encodeURIComponent(err)}`)
  }

  const jar = await cookies()
  const saved = jar.get('google_oauth_state')?.value
  const state = url.searchParams.get('state')
  if (!saved || !state || saved !== state) {
    return new Response('Invalid OAuth state', { status: 400 })
  }
  jar.delete('google_oauth_state')

  const code = url.searchParams.get('code')
  if (!code) {
    return new Response('Missing code', { status: 400 })
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    `${appUrl.replace(/\/$/, '')}/api/integrations/google/oauth/callback`,
  )

  const { tokens } = await oauth2Client.getToken(code)
  oauth2Client.setCredentials(tokens)

  let email: string | null = null
  try {
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const { data } = await oauth2.userinfo.get()
    email = data.email ?? null
  } catch {
    // optional
  }

  const supabase = await createServerClient()
  const { data: existing } = await supabase.from('google_workspace_tokens').select('refresh_token').eq('id', 'default').maybeSingle()

  const refresh = tokens.refresh_token ?? (existing?.refresh_token as string | undefined)
  if (!refresh) {
    redirect('/settings?tab=finance&drive_error=no_refresh_token')
  }

  const expiresAt =
    tokens.expiry_date != null ? new Date(tokens.expiry_date).toISOString() : null

  const { error } = await supabase.from('google_workspace_tokens').upsert(
    {
      id:             'default',
      refresh_token:  refresh,
      access_token:   tokens.access_token ?? null,
      expires_at:     expiresAt,
      provider_email: email,
      updated_by:     profile.id,
      updated_at:     new Date().toISOString(),
    },
    { onConflict: 'id' },
  )

  if (error) {
    redirect(`/settings?tab=finance&drive_error=${encodeURIComponent(error.message)}`)
  }

  redirect('/settings?tab=finance&drive=connected')
}
