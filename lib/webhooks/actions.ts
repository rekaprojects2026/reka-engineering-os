'use server'

import crypto from 'crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { loadMutationProfile, ensureDirekturMutation } from '@/lib/auth/mutation-policy'
import { listWebhookDeliveryLogs } from '@/lib/webhooks/queries'
import type { WebhookDeliveryLog } from '@/types/database'
import { WEBHOOK_EVENTS, type WebhookEventType } from '@/lib/webhooks/events'

function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString('hex')
}

function parseEventsFromForm(formData: FormData): WebhookEventType[] {
  const raw = formData.getAll('event').map((v) => String(v))
  const allowed = new Set(Object.keys(WEBHOOK_EVENTS) as WebhookEventType[])
  return raw.filter((e): e is WebhookEventType => allowed.has(e as WebhookEventType))
}

export async function createWebhookEndpoint(
  formData: FormData,
): Promise<{ error: string } | { plaintextSecret: string }> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await loadMutationProfile()
  const perm = ensureDirekturMutation(profile)
  if (perm) return { error: perm }

  const name = (formData.get('name') as string)?.trim()
  const url = (formData.get('url') as string)?.trim()
  if (!name) return { error: 'Name is required.' }
  if (!url || !url.startsWith('https://')) return { error: 'URL must be HTTPS.' }

  const events = parseEventsFromForm(formData)
  if (events.length === 0) return { error: 'Select at least one event.' }

  const secret = generateWebhookSecret()

  const { error } = await supabase.from('webhook_endpoints').insert({
    name,
    url,
    secret,
    events,
    is_active: true,
    created_by: user.id,
  })

  if (error) return { error: error.message }

  revalidatePath('/settings/webhooks')
  return { plaintextSecret: secret }
}

export async function updateWebhookEndpoint(
  id: string,
  formData: FormData,
): Promise<{ error: string } | { ok: true }> {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  const perm = ensureDirekturMutation(profile)
  if (perm) return { error: perm }

  const name = (formData.get('name') as string)?.trim()
  const url = (formData.get('url') as string)?.trim()
  if (!name) return { error: 'Name is required.' }
  if (!url || !url.startsWith('https://')) return { error: 'URL must be HTTPS.' }

  const events = parseEventsFromForm(formData)
  if (events.length === 0) return { error: 'Select at least one event.' }

  const isActive = (formData.get('is_active') as string) === 'true'

  const { error } = await supabase
    .from('webhook_endpoints')
    .update({ name, url, events, is_active: isActive })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/settings/webhooks')
  return { ok: true }
}

export async function deleteWebhookEndpoint(id: string): Promise<{ error: string } | { ok: true }> {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  const perm = ensureDirekturMutation(profile)
  if (perm) return { error: perm }

  const { error } = await supabase.from('webhook_endpoints').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/settings/webhooks')
  return { ok: true }
}

export async function fetchWebhookDeliveryLogsForSettings(
  webhookId: string,
  filter: 'all' | 'success' | 'failed',
  page: number,
): Promise<{ error: string | null; rows: WebhookDeliveryLog[]; total: number }> {
  const profile = await loadMutationProfile()
  const perm = ensureDirekturMutation(profile)
  if (perm) return { error: perm, rows: [], total: 0 }

  const { rows, total } = await listWebhookDeliveryLogs(webhookId, filter, page, 20)
  return { error: null, rows, total }
}
