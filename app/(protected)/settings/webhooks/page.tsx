import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { WebhooksSettingsClient } from '@/components/modules/settings/WebhooksSettingsClient'
import { getSessionProfile } from '@/lib/auth/session'
import { isDirektur } from '@/lib/auth/permissions'
import { listWebhookEventOptionsForUi } from '@/lib/webhooks/event-options'
import { listWebhookEndpoints } from '@/lib/webhooks/queries'

export const metadata = { title: 'Webhooks — Settings' }

export default async function WebhooksSettingsPage() {
  const sp = await getSessionProfile()
  if (!isDirektur(sp.system_role)) redirect('/access-denied')

  const endpoints = await listWebhookEndpoints()
  const eventOptions = listWebhookEventOptionsForUi()

  return (
    <div>
      <PageHeader
        title="Webhooks"
        subtitle="Outbound HTTPS notifications when OS events occur."
        breadcrumb={{ label: 'Settings', href: '/settings?tab=system' }}
      />
      <WebhooksSettingsClient initialEndpoints={endpoints} eventOptions={eventOptions} />
    </div>
  )
}
