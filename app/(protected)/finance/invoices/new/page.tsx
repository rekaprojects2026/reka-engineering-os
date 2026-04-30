import { getSessionProfile, requireRole } from '@/lib/auth/session'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { getClientsForSelect } from '@/lib/clients/queries'
import { getPaymentAccounts } from '@/lib/payment-accounts/queries'
import { getUsdToIdrRate } from '@/lib/fx/queries'
import { createInvoice } from '@/lib/invoices/actions'
import { createServerClient } from '@/lib/supabase/server'
import { InvoiceNewForm } from '@/components/modules/invoices/InvoiceNewForm'

export const metadata = { title: 'New Invoice — ReKa Engineering OS' }

export default async function NewInvoicePage() {
  const sp = await getSessionProfile()
  requireRole(sp.system_role, ['direktur', 'finance'])

  const supabase = await createServerClient()
  const [clients, accounts, fxRate, { data: projectsRaw }] = await Promise.all([
    getClientsForSelect(),
    getPaymentAccounts(true),
    getUsdToIdrRate(),
    supabase
      .from('projects')
      .select('id, name, project_code, client_id')
      .in('status', ['ready_to_start', 'ongoing', 'internal_review', 'waiting_client', 'in_revision', 'completed'])
      .order('created_at', { ascending: false }),
  ])

  const projects = (projectsRaw ?? []) as { id: string; name: string; project_code: string; client_id: string | null }[]

  async function handleCreate(formData: FormData) {
    'use server'
    const result = await createInvoice(formData)
    return result ? { id: result.id } : null
  }

  return (
    <div>
      <PageHeader
        title="New Invoice"
        subtitle="Create a client invoice and record incoming payment details."
      />
      <SectionCard>
        <InvoiceNewForm
          clients={clients}
          projects={projects}
          accounts={accounts}
          fxRate={fxRate}
          createInvoice={handleCreate}
        />
      </SectionCard>
    </div>
  )
}
