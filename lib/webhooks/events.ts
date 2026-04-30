export const WEBHOOK_EVENTS = {
  'project.created': 'Project baru dibuat',
  'project.status_changed': 'Status project berubah',
  'project.completed': 'Project selesai',
  'invoice.created': 'Invoice baru dibuat',
  'invoice.paid': 'Invoice lunas',
  'payment.received': 'Pembayaran diterima',
  'task.completed': 'Task selesai',
} as const

export type WebhookEventType = keyof typeof WEBHOOK_EVENTS
