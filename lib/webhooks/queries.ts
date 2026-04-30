import { createServerClient } from '@/lib/supabase/server'
import type { WebhookDeliveryLog, WebhookEndpoint } from '@/types/database'

export type WebhookEndpointListRow = Omit<WebhookEndpoint, 'secret'>

export async function listWebhookEndpoints(): Promise<WebhookEndpointListRow[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('webhook_endpoints')
    .select('id, name, url, events, is_active, created_by, created_at')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as WebhookEndpointListRow[]
}

export async function listWebhookDeliveryLogs(
  webhookId: string,
  filter: 'all' | 'success' | 'failed',
  page: number,
  limit: number,
): Promise<{ rows: WebhookDeliveryLog[]; total: number }> {
  const supabase = await createServerClient()
  const offset = (page - 1) * limit
  const end = offset + limit - 1

  let q = supabase
    .from('webhook_delivery_logs')
    .select('*', { count: 'exact' })
    .eq('webhook_id', webhookId)
    .order('delivered_at', { ascending: false })

  if (filter === 'success') {
    q = q.is('error', null).gte('response_status', 200).lt('response_status', 300)
  } else if (filter === 'failed') {
    q = q.or('error.not.is.null,response_status.is.null,response_status.lt.200,response_status.gte.300')
  }

  const { data, error, count } = await q.range(offset, end)
  if (error) throw new Error(error.message)

  return {
    rows: (data ?? []) as WebhookDeliveryLog[],
    total: count ?? 0,
  }
}
