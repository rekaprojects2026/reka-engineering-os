import { Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { SectionCard } from '@/components/shared/SectionCard'
import { SectionHeader } from '@/components/layout/PageHeader'
import { createPaymentAccount, deletePaymentAccount, togglePaymentAccount } from '@/lib/payment-accounts/actions'
import { cn } from '@/lib/utils/cn'
import type { PaymentAccount } from '@/types/database'

const thClass =
  'border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3.5 py-2.5 text-left text-[0.6875rem] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] whitespace-nowrap'
const tdClass = 'px-3.5 py-2.5 text-[0.8125rem] text-[var(--color-text-secondary)] whitespace-nowrap'
const controlClass =
  'h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[0.8125rem] text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20'

export function PaymentAccountsSection({
  initialAccounts,
  financeCanMutate,
}: {
  initialAccounts: PaymentAccount[]
  financeCanMutate: boolean
}) {
  return (
    <div className="space-y-4">
      <SectionCard noPadding className="overflow-hidden">
        <div className="border-b border-[var(--color-border)] px-6 py-4">
          <SectionHeader title="Payment Accounts" className="mb-0" />
          <p className="mt-1 text-[0.8125rem] text-[var(--color-text-muted)]">
            Channels where client payments are received (Wise, PayPal, bank accounts).
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Name', 'Type', 'Currency', 'Identifier', 'Active', ''].map((h) => (
                  <th key={h} className={thClass}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {initialAccounts.length === 0 && (
                <tr>
                  <td colSpan={6} className={cn(tdClass, 'py-8 text-center text-[var(--color-text-muted)]')}>
                    No accounts yet.
                  </td>
                </tr>
              )}
              {initialAccounts.map((acct) => (
                <tr
                  key={acct.id}
                  className={cn('transition-colors hover:bg-[var(--color-surface-muted)]', !acct.is_active && 'opacity-50')}
                >
                  <td className={cn(tdClass, 'font-medium text-[var(--color-text-primary)]')}>{acct.name}</td>
                  <td className={cn(tdClass, 'capitalize')}>{acct.account_type}</td>
                  <td className={cn(tdClass, 'font-mono font-semibold')}>{acct.currency}</td>
                  <td className={cn(tdClass, 'text-[var(--color-text-muted)]')}>{acct.account_identifier ?? '—'}</td>
                  <td className={cn(tdClass, 'w-20')}>
                    {financeCanMutate ? (
                      <form action={togglePaymentAccount.bind(null, acct.id, acct.is_active)}>
                        <button
                          type="submit"
                          className={cn(
                            'cursor-pointer border-none bg-transparent p-0.5',
                            acct.is_active ? 'text-[var(--color-success)]' : 'text-[var(--color-text-muted)]',
                          )}
                        >
                          {acct.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                        </button>
                      </form>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className={cn(tdClass, 'w-12 text-right')}>
                    {financeCanMutate ? (
                      <form action={deletePaymentAccount.bind(null, acct.id)}>
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
          <SectionHeader title="Add Payment Account" />
          <form action={createPaymentAccount} className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[0.75rem] font-medium text-[var(--color-text-muted)]">Name</label>
              <input name="name" required placeholder="e.g. Wise USD" className={cn(controlClass, 'w-40')} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[0.75rem] font-medium text-[var(--color-text-muted)]">Type</label>
              <select name="account_type" className={cn(controlClass, 'w-32')}>
                <option value="wise">Wise</option>
                <option value="paypal">PayPal</option>
                <option value="bank">Bank</option>
                <option value="ewallet">E-Wallet</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[0.75rem] font-medium text-[var(--color-text-muted)]">Currency</label>
              <select name="currency" className={cn(controlClass, 'w-24')}>
                <option value="USD">USD</option>
                <option value="IDR">IDR</option>
                <option value="EUR">EUR</option>
                <option value="SGD">SGD</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[0.75rem] font-medium text-[var(--color-text-muted)]">Account Identifier</label>
              <input name="account_identifier" placeholder="email / account no." className={cn(controlClass, 'w-52')} />
            </div>
            <input type="hidden" name="sort_order" value={initialAccounts.length + 1} />
            <button
              type="submit"
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[var(--color-primary)] px-4 text-[0.8125rem] font-medium text-[var(--color-primary-fg)]"
            >
              <Plus size={14} /> Add Account
            </button>
          </form>
        </SectionCard>
      )}
    </div>
  )
}
