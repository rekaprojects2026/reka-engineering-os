import { WEBHOOK_EVENTS, type WebhookEventType } from '@/lib/webhooks/events'

export function listWebhookEventOptionsForUi(): { value: WebhookEventType; label: string }[] {
  return (Object.keys(WEBHOOK_EVENTS) as WebhookEventType[]).map((value) => ({
    value,
    label: WEBHOOK_EVENTS[value],
  }))
}
