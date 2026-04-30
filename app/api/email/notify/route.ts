import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendNotificationEmail } from '@/lib/email/send-notification'

const WEBHOOK_SECRET = process.env.SUPABASE_WEBHOOK_SECRET

/**
 * POST /api/email/notify
 *
 * Called by Supabase Database Webhook on INSERT to `notifications` table.
 * Payload shape (Supabase webhook format):
 * {
 *   type: 'INSERT',
 *   table: 'notifications',
 *   record: { id, user_id, type, title, body, link, read_at, created_at },
 *   schema: 'public',
 *   old_record: null
 * }
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Verify secret header
  const secret = req.headers.get('x-webhook-secret')
  if (!WEBHOOK_SECRET || secret !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse payload
  let payload: unknown
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('record' in payload) ||
    typeof (payload as Record<string, unknown>).record !== 'object'
  ) {
    return NextResponse.json({ error: 'Unexpected payload shape' }, { status: 400 })
  }

  const record = (payload as { record: Record<string, unknown> }).record

  const userId    = typeof record.user_id === 'string' ? record.user_id : null
  const title     = typeof record.title   === 'string' ? record.title   : null
  const body      = typeof record.body    === 'string' ? record.body    : null
  const link      = typeof record.link    === 'string' ? record.link    : null
  const notifType = typeof record.type    === 'string' ? record.type    : 'notification'

  if (!userId || !title) {
    // Non-actionable row — skip silently
    return NextResponse.json({ ok: true, skipped: true })
  }

  // 3. Look up recipient email + name from profiles
  const admin = createAdminClient()
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('email, full_name')
    .eq('id', userId)
    .maybeSingle()

  if (profileError || !profile) {
    console.error('[notify webhook] Profile lookup failed:', profileError?.message ?? 'no profile')
    return NextResponse.json({ ok: true, skipped: true })
  }

  const toEmail = profile.email
  if (typeof toEmail !== 'string' || !toEmail) {
    console.error('[notify webhook] Profile lookup failed: no email')
    return NextResponse.json({ ok: true, skipped: true })
  }

  // 4. Send email (errors logged inside sendNotificationEmail; still return 200 below)
  await sendNotificationEmail({
    toEmail,
    recipientName: profile.full_name ?? 'Pengguna',
    title,
    body,
    link,
    notificationType: notifType,
  })

  return NextResponse.json({ ok: true })
}
