import { getSessionProfile, requireRole } from '@/lib/auth/session'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { getPaymentAccounts } from '@/lib/payment-accounts/queries'
import { getUsdToIdrRate } from '@/lib/fx/queries'
import { getProfilesForPayslipForm } from '@/lib/payslips/queries'
import { createPayslip } from '@/lib/payslips/actions'
import { PayslipForm } from '@/components/modules/payslips/PayslipForm'

export const metadata = { title: 'Generate payslip — ReKa Engineering OS' }

export default async function NewPayslipPage() {
  const sp = await getSessionProfile()
  requireRole(sp.system_role, ['direktur', 'finance'])

  const [members, accounts, fxRate] = await Promise.all([
    getProfilesForPayslipForm(),
    getPaymentAccounts(true),
    getUsdToIdrRate(),
  ])

  return (
    <div>
      <PageHeader title="Generate payslip" subtitle="Buat slip gaji untuk satu anggota tim pada periode tertentu." />
      <SectionCard>
        <PayslipForm members={members} accounts={accounts} fxRate={fxRate} createPayslip={createPayslip} />
      </SectionCard>
    </div>
  )
}
