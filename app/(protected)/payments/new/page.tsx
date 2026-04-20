import { getSessionProfile, requireRole } from '@/lib/auth/session'
import { PageHeader }  from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { PaymentForm } from '@/components/modules/payments/PaymentForm'
import { getMemberOptions } from '@/lib/compensation/helpers'
import { createPayment } from '@/lib/payments/actions'
import { getSettingOptions } from '@/lib/settings/queries'

export const metadata = { title: 'New Payment — ReKa Engineering OS' }

export default async function NewPaymentPage() {
  const _sp = await getSessionProfile()
  requireRole(_sp.system_role, ['admin'])

  const [members, paymentMethodOptions] = await Promise.all([
    getMemberOptions(),
    getSettingOptions('payment_method'),
  ])

  return (
    <div>
      <PageHeader
        title="New Payment Record"
        subtitle="Track a payment to a team member or freelancer."
      />
      <SectionCard>
        <PaymentForm
          members={members}
          action={createPayment}
          submitLabel="Create Payment"
          paymentMethodOptions={paymentMethodOptions}
        />
      </SectionCard>
    </div>
  )
}
