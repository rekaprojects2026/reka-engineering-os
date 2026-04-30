import Link from 'next/link'
import { getFxRates } from '@/lib/fx/queries'
import { FxRatesSection } from '@/components/modules/finance/FxRatesSection'
import { PageHeader } from '@/components/layout/PageHeader'
import { getSessionProfile } from '@/lib/auth/session'
import { isFinance } from '@/lib/auth/permissions'

export const metadata = { title: 'FX Rates — ReKa Engineering OS' }

export default async function FxRatesPage() {
  const [rates, profile] = await Promise.all([getFxRates(), getSessionProfile()])
  const financeCanMutate = isFinance(profile.system_role)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kurs valuta asing"
        subtitle="Kelola rate USD/IDR dan pasangan lain untuk konversi invoice & laporan."
      />
      <p className="text-[0.8125rem] text-[var(--color-text-muted)]">
        <Link href="/settings?tab=finance" className="text-[var(--color-primary)] no-underline hover:underline">
          ← Kembali ke ringkasan Finance di Settings
        </Link>
      </p>
      <FxRatesSection initialRates={rates} financeCanMutate={financeCanMutate} />
    </div>
  )
}
