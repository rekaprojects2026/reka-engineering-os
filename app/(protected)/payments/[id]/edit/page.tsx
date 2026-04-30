import { notFound } from 'next/navigation'

import { getSessionProfile, requireRole } from '@/lib/auth/session'
import { PageHeader }  from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { PaymentForm } from '@/components/modules/payments/PaymentForm'
import { getPaymentById } from '@/lib/payments/queries'
import { updatePayment } from '@/lib/payments/actions'
import { getMemberOptions } from '@/lib/compensation/helpers'
import { getSettingOptions } from '@/lib/settings/queries'

interface PageProps { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const record = await getPaymentById(id)
  return {
    title: record
      ? `Edit Payment — ${record.member?.full_name ?? 'Record'} — ReKa Engineering OS`
      : `Not found — ReKa Engineering OS`,
  }
}

export default async function EditPaymentPage({ params }: PageProps) {
  const _sp = await getSessionProfile()
  requireRole(_sp.system_role, ['finance'])

  const { id } = await params
  const [record, members, paymentMethodOptions] = await Promise.all([
    getPaymentById(id),
    getMemberOptions(),
    getSettingOptions('payment_method'),
  ])

  if (!record) notFound()

  const dv: Record<string, string | number | null> = {
    member_id: record.member_id,
    period_label: record.period_label,
    total_due: record.total_due,
    total_paid: record.total_paid,
    currency_code: record.currency_code,
    payment_date: record.payment_date,
    payment_method: record.payment_method,
    payment_reference: record.payment_reference,
    proof_link: record.proof_link,
    notes: record.notes,
  }

  return (
    <div>
      <PageHeader
        title="Edit Payment Record"
        subtitle={record.member?.full_name ?? ''}
      />
      <SectionCard>
        <PaymentForm
          members={members}
          defaultValues={dv}
          action={updatePayment.bind(null, id)}
          submitLabel="Save Changes"
          paymentMethodOptions={paymentMethodOptions}
        />
      </SectionCard>
    </div>
  )
}
