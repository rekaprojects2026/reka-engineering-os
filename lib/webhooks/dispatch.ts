import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import type { WebhookEventType } from '@/lib/webhooks/events'

export async function dispatchWebhook(
  eventType: WebhookEventType,
  payload: Record<string, unknown>,
): Promise<void> {
  const supabase = createAdminClient()

  const { data: webhooks, error } = await supabase
    .from('webhook_endpoints')
    .select('id, url, secret, events')
    .eq('is_active', true)

  if (error) {
    console.error('[webhook] list endpoints:', error.message)
    return
  }

  const subscribers = (webhooks ?? []).filter(
    (w) => Array.isArray(w.events) && (w.events as string[]).includes(eventType),
  )

  if (subscribers.length === 0) return

  const body = JSON.stringify({
    event: eventType,
    timestamp: new Date().toISOString(),
    data: payload,
  })

  await Promise.allSettled(
    subscribers.map((webhook) => deliverWebhook(webhook, eventType, body, payload)),
  )
}

async function deliverWebhook(
  webhook: { id: string; url: string; secret: string },
  eventType: WebhookEventType,
  body: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const supabase = createAdminClient()
  const startTime = Date.now()

  const signature = crypto.createHmac('sha256', webhook.secret).update(body).digest('hex')

  let responseStatus: number | null = null
  let responseBody: string | null = null
  let errMsg: string | null = null

  try {
    const res = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Reka-Signature': `sha256=${signature}`,
        'X-Reka-Event': eventType,
      },
      body,
      signal: AbortSignal.timeout(10_000),
    })

    responseStatus = res.status
    responseBody = await res.text().catch(() => null)
  } catch (err) {
    errMsg = err instanceof Error ? err.message : 'Unknown error'
  }

  const { error: logErr } = await supabase.from('webhook_delivery_logs').insert({
    webhook_id: webhook.id,
    event_type: eventType,
    payload,
    response_status: responseStatus,
    response_body: responseBody,
    error: errMsg,
    duration_ms: Date.now() - startTime,
  })

  if (logErr) console.error('[webhook] delivery log:', logErr.message)
}
