'use client'

import { formatMoney } from '@/lib/utils/formatters'

interface MoneyDisplayProps {
  amount: number | string | null | undefined
  currency: string
  fxRateToIDR?: number | null
  showConversion?: boolean
  className?: string
  size?: 'sm' | 'base' | 'lg'
}

/**
 * Displays an amount with optional IDR conversion below.
 * Primary amount shown in given currency, conversion in muted text.
 */
export function MoneyDisplay({
  amount,
  currency,
  fxRateToIDR,
  showConversion = true,
  className = '',
  size = 'base',
}: MoneyDisplayProps) {
  if (amount == null || amount === '') return <span style={{ color: 'var(--color-text-muted)' }}>—</span>

  const n = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(n)) return <span style={{ color: 'var(--color-text-muted)' }}>—</span>

  const primaryText = formatMoney(n, currency)

  let conversionText: string | null = null
  if (showConversion && fxRateToIDR && currency !== 'IDR') {
    const idrEquiv = n * fxRateToIDR
    const idrFormatter = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
    conversionText = `~${idrFormatter.format(idrEquiv)}`
  }

  const primarySize =
    size === 'sm' ? '0.75rem' : size === 'lg' ? '1rem' : '0.8125rem'
  const conversionSize = size === 'lg' ? '0.75rem' : '0.6875rem'

  return (
    <span className={className} style={{ display: 'inline-flex', flexDirection: 'column', gap: '1px' }}>
      <span style={{ fontSize: primarySize, fontWeight: 500, color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
        {primaryText}
      </span>
      {conversionText && (
        <span style={{ fontSize: conversionSize, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
          {conversionText}
        </span>
      )}
    </span>
  )
}
