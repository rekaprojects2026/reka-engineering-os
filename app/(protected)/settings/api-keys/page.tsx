import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { ApiKeysSettingsClient } from '@/components/modules/settings/ApiKeysSettingsClient'
import { getSessionProfile } from '@/lib/auth/session'
import { isDirektur } from '@/lib/auth/permissions'
import { listScopeOptionsForUi } from '@/lib/api-keys/ui-options'
import { listApiKeys } from '@/lib/api-keys/queries'

export const metadata = { title: 'API keys — Settings' }

export default async function ApiKeysSettingsPage() {
  const sp = await getSessionProfile()
  if (!isDirektur(sp.system_role)) redirect('/access-denied')

  const keys = await listApiKeys()
  const scopeOptions = listScopeOptionsForUi()

  return (
    <div>
      <PageHeader
        title="API keys"
        subtitle="Manage keys for the public REST API (Bearer auth)."
        breadcrumb={{ label: 'Settings', href: '/settings?tab=system' }}
      />
      <ApiKeysSettingsClient initialKeys={keys} scopeOptions={scopeOptions} />
    </div>
  )
}
