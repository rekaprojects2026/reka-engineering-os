import { Plus, Trash2 } from 'lucide-react'
import { SectionCard } from '@/components/shared/SectionCard'
import { SectionHeader } from '@/components/layout/PageHeader'
import { createFxRate, deleteFxRate } from '@/lib/fx/actions'
import { formatDate } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils/cn'
import type { FxRate } from '@/types/database'
import { fxFreshnessLevel, hoursSinceLatestFxRate } from '@/lib/fx/staleness'
import { FxRatesFreshnessBanner } from '@/components/modules/finance/FxRatesFreshnessBanner'

const thClass =
  'border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3.5 py-2.5 text-left text-[0.6875rem] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] whitespace-nowrap'
const tdClass = 'px-3.5 py-2.5 text-[0.8125rem] text-[var(--color-text-secondary)] whitespace-nowrap'
const controlClass =
  'h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[0.8125rem] text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20'

export function FxRatesSection({
  initialRates,
  financeCanMutate,
}: {
  initialRates: FxRate[]
  financeCanMutate: boolean
}) {
  const hours = hoursSinceLatestFxRate(initialRates)
  const level = fxFreshnessLevel(hours)

  return (
    <div className="space-y-4">
      <FxRatesFreshnessBanner hoursSinceUpdate={hours} level={level} />

      <SectionCard noPadding className="overflow-hidden">
        <div className="border-b border-[var(--color-border)] px-6 py-4">
          <SectionHeader title="Exchange Rates" className="mb-0" />
          <p className="mt-1 text-[0.8125rem] text-[var(--color-text-muted)]">
            Rates are used for USD↔IDR conversions. The most recent entry per currency pair is always used.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['From', 'To', 'Rate', 'Effective Date', 'Notes', ''].map((h) => (
                  <th key={h} className={thClass}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {initialRates.length === 0 && (
                <tr>
                  <td colSpan={6} className={cn(tdClass, 'py-8 text-center text-[var(--color-text-muted)]')}>
                    No rates yet. Add one below.
                  </td>
                </tr>
              )}
              {initialRates.map((r) => (
                <tr key={r.id} className="transition-colors hover:bg-[var(--color-surface-muted)]">
                  <td className={cn(tdClass, 'font-mono font-semibold')}>{r.from_currency}</td>
                  <td className={cn(tdClass, 'font-mono font-semibold')}>{r.to_currency}</td>
                  <td className={cn(tdClass, 'font-medium text-[var(--color-text-primary)]')}>
                    {Number(r.rate).toLocaleString('id-ID')}
                  </td>
                  <td className={tdClass}>{formatDate(r.effective_date)}</td>
                  <td className={cn(tdClass, 'text-[var(--color-text-muted)]')}>{r.notes ?? '—'}</td>
                  <td className={cn(tdClass, 'w-12 text-right')}>
                    {financeCanMutate ? (
                      <form action={deleteFxRate.bind(null, r.id)}>
                        <button
                          type="submit"
                          className="cursor-pointer border-none bg-transparent p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
                        >
                          <Trash2 size={14} />
                        </button>
                      </form>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {financeCanMutate && (
        <SectionCard>
          <SectionHeader title="Add FX Rate" />
          <form action={createFxRate} className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[0.75rem] font-medium text-[var(--color-text-muted)]">From</label>
              <select name="from_currency" defaultValue="USD" className={cn(controlClass, 'w-28')}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="SGD">SGD</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[0.75rem] font-medium text-[var(--color-text-muted)]">To</label>
              <select name="to_currency" defaultValue="IDR" className={cn(controlClass, 'w-28')}>
                <option value="IDR">IDR</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[0.75rem] font-medium text-[var(--color-text-muted)]">Rate</label>
              <input
                name="rate"
                type="number"
                required
                min={0}
                step="any"
                placeholder="16400"
                className={cn(controlClass, 'w-36')}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[0.75rem] font-medium text-[var(--color-text-muted)]">Effective Date</label>
              <input
                name="effective_date"
                type="date"
                required
                className={cn(controlClass, 'w-40')}
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[0.75rem] font-medium text-[var(--color-text-muted)]">Notes</label>
              <input name="notes" placeholder="Optional note" className={cn(controlClass, 'w-48')} />
            </div>
            <button
              type="submit"
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[var(--color-primary)] px-4 text-[0.8125rem] font-medium text-[var(--color-primary-fg)]"
            >
              <Plus size={14} /> Add Rate
            </button>
          </form>
        </SectionCard>
      )}
    </div>
  )
}
