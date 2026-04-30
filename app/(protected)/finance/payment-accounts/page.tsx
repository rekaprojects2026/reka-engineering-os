import Link from 'next/link'
import { getPaymentAccounts } from '@/lib/payment-accounts/queries'
import { PaymentAccountsSection } from '@/components/modules/finance/PaymentAccountsSection'
import { PageHeader } from '@/components/layout/PageHeader'
import { getSessionProfile } from '@/lib/auth/session'
import { isFinance } from '@/lib/auth/permissions'

export const metadata = { title: 'Payment Accounts — ReKa Engineering OS' }

export default async function PaymentAccountsPage() {
  const [accounts, profile] = await Promise.all([getPaymentAccounts(), getSessionProfile()])
  const financeCanMutate = isFinance(profile.system_role)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rekening pembayaran"
        subtitle="Saluran penerimaan pembayaran klien (Wise, bank, dll.)."
      />
      <p className="text-[0.8125rem] text-[var(--color-text-muted)]">
        <Link href="/settings?tab=finance" className="text-[var(--color-primary)] no-underline hover:underline">
          ← Kembali ke ringkasan Finance di Settings
        </Link>
      </p>
      <PaymentAccountsSection initialAccounts={accounts} financeCanMutate={financeCanMutate} />
    </div>
  )
}
