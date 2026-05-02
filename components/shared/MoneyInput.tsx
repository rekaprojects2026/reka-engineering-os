'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils/cn'

interface CurrencyOption {
  value: string
  label: string
}

interface MoneyInputProps {
  name: string
  currencyName?: string
  defaultAmount?: number | null
  defaultCurrency?: string
  /** When set, replaces the default IDR/USD pair (e.g. contract currencies). */
  currencies?: readonly CurrencyOption[]
  fxRateToIDR?: number | null
  label?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
}

/**
 * Combined currency selector + amount input.
 * Shows IDR conversion hint when USD is selected.
 */
const DEFAULT_CURRENCIES: CurrencyOption[] = [
  { value: 'IDR', label: 'IDR' },
  { value: 'USD', label: 'USD' },
]

export function MoneyInput({
  name,
  currencyName,
  defaultAmount,
  defaultCurrency = 'IDR',
  currencies,
  fxRateToIDR,
  label,
  required = false,
  disabled = false,
  placeholder = '0',
}: MoneyInputProps) {
  const [currency, setCurrency] = useState(defaultCurrency)
  const [amount, setAmount] = useState<string>(
    defaultAmount != null ? String(defaultAmount) : ''
  )

  const currencyOptions = currencies ?? DEFAULT_CURRENCIES

  const conversionText =
    currency === 'USD' && fxRateToIDR && amount
      ? (() => {
          const n = parseFloat(amount)
          if (isNaN(n)) return null
          const idrFormatter = new Intl.NumberFormat('id-ID', {
            style: 'currency', currency: 'IDR',
            minimumFractionDigits: 0, maximumFractionDigits: 0,
          })
          return `~${idrFormatter.format(n * fxRateToIDR)}`
        })()
      : null

  return (
    <div className="flex flex-col gap-[var(--space-form-field-gap)]">
      {label && (
        <label className="block text-[0.8125rem] font-medium text-[var(--text-secondary-neutral)]">
          {label}
          {required && <span className="ml-[3px] text-[var(--brand-accent)]">*</span>}
        </label>
      )}
      <div className="flex items-center">
        <select
          name={currencyName ?? `${name}_currency`}
          value={currency}
          onChange={e => setCurrency(e.target.value)}
          disabled={disabled}
          className={cn(
            'h-9 cursor-pointer rounded-l-[var(--radius-control)] border border-r-0 border-[var(--input-border)] bg-[var(--input-bg)] px-2 text-[0.75rem] font-semibold text-[var(--text-secondary-neutral)] outline-none transition-colors duration-150',
            'focus:border-[var(--input-focus-border)] focus:bg-[var(--input-bg-focus)] focus:ring-2 focus:ring-[color:var(--input-focus-ring)]',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
          {currencyOptions.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <input
          type="number"
          name={name}
          value={amount}
          onChange={e => setAmount(e.target.value)}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          min="0"
          step="any"
          className={cn(
            'h-9 flex-1 rounded-r-[var(--radius-control)] border border-[var(--input-border)] bg-[var(--input-bg)] px-[10px] text-[0.8125rem] text-[var(--text-primary-neutral)] outline-none transition-colors duration-150',
            'focus:border-[var(--input-focus-border)] focus:bg-[var(--input-bg-focus)] focus:ring-2 focus:ring-[color:var(--input-focus-ring)]',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        />
      </div>
      {conversionText && (
        <p className="text-[0.6875rem] text-[var(--text-muted-neutral)]">
          {conversionText} (rate: 1 USD = Rp {fxRateToIDR?.toLocaleString('id-ID')})
        </p>
      )}
    </div>
  )
}
