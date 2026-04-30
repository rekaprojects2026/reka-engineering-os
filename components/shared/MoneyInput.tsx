'use client'

import { useState, useEffect } from 'react'
import { formatMoney } from '@/lib/utils/formatters'

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

  const inputStyle: React.CSSProperties = {
    height: '36px',
    flex: 1,
    borderRadius: '0 var(--radius-control) var(--radius-control) 0',
    border: '1px solid var(--color-border)',
    borderLeft: 'none',
    backgroundColor: disabled ? 'var(--color-surface-muted)' : 'var(--color-surface)',
    color: 'var(--color-text-primary)',
    padding: '0 10px',
    fontSize: '0.8125rem',
    outline: 'none',
  }

  const selectStyle: React.CSSProperties = {
    height: '36px',
    padding: '0 8px',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-control) 0 0 var(--radius-control)',
    backgroundColor: 'var(--color-surface-muted)',
    color: 'var(--color-text-secondary)',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
    outline: 'none',
  }

  return (
    <div>
      {label && (
        <label
          style={{ display: 'block', marginBottom: '6px', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}
        >
          {label}{required && <span style={{ color: 'var(--color-danger)', marginLeft: '3px' }}>*</span>}
        </label>
      )}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <select
          name={currencyName ?? `${name}_currency`}
          value={currency}
          onChange={e => setCurrency(e.target.value)}
          disabled={disabled}
          style={selectStyle}
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
          style={inputStyle}
          onFocus={e => (e.target.style.boxShadow = '0 0 0 2px var(--color-primary)')}
          onBlur={e => (e.target.style.boxShadow = 'none')}
        />
      </div>
      {conversionText && (
        <p style={{ marginTop: '4px', fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
          {conversionText} (rate: 1 USD = Rp {fxRateToIDR?.toLocaleString('id-ID')})
        </p>
      )}
    </div>
  )
}
