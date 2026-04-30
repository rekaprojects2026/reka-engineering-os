// Date formatting utilities

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const relativeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

/** Format a date as "15 Apr 2026" */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  return dateFormatter.format(new Date(date))
}

/** Short relative time for activity feeds and comments, e.g. "12m ago", "3h ago". */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const diffMs = Date.now() - new Date(date).getTime()
  if (diffMs < 0) return 'just now'
  const sec = Math.floor(diffMs / 1000)
  const min = Math.floor(sec / 60)
  const hr = Math.floor(min / 60)
  const day = Math.floor(hr / 24)
  if (sec < 45) return 'just now'
  if (min < 60) return `${min}m ago`
  if (hr < 24) return `${hr}h ago`
  if (day < 7) return `${day}d ago`
  return formatDate(date)
}

/** Format a date relative to now, e.g. "3 days ago" */
export function formatRelativeDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const diffMs = new Date(date).getTime() - Date.now()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (Math.abs(diffDays) < 1) return 'today'
  if (Math.abs(diffDays) < 7) return relativeFormatter.format(diffDays, 'day')
  if (Math.abs(diffDays) < 30) return relativeFormatter.format(Math.round(diffDays / 7), 'week')
  return relativeFormatter.format(Math.round(diffDays / 30), 'month')
}

/** Truncate long strings with ellipsis */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength).trimEnd() + '…'
}

/** Human-readable byte size (binary units). */
export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return '—'
  const units = ['B', 'KB', 'MB', 'GB'] as const
  let n = bytes
  let i = 0
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i++
  }
  if (i === 0) return `${Math.round(n)} ${units[i]}`
  const rounded = n < 10 ? Math.round(n * 10) / 10 : Math.round(n)
  return `${rounded} ${units[i]}`
}

/** Get initials from a full name, e.g. "John Doe" → "JD" */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('')
}

const idrFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

/** Format a number as IDR currency, e.g. 2500000 → "Rp 2.500.000" */
export function formatIDR(amount: number | string | null | undefined): string {
  if (amount == null || amount === '') return '—'
  const n = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(n)) return '—'
  return idrFormatter.format(n)
}

/** Format a number as USD currency, e.g. 1000 → "USD 1,000" */
export function formatUSD(amount: number | string | null | undefined): string {
  if (amount == null || amount === '') return '—'
  const n = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(n)) return '—'
  return 'USD ' + usdFormatter.format(n).replace('$', '').trim()
}

/** Format amount in a given currency */
export function formatMoney(
  amount: number | string | null | undefined,
  currency: string = 'IDR'
): string {
  if (amount == null || amount === '') return '—'
  const n = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(n)) return '—'
  if (currency === 'IDR') return idrFormatter.format(n)
  if (currency === 'USD') return 'USD ' + usdFormatter.format(n).replace('$', '').trim()
  return `${currency} ${n.toLocaleString()}`
}

/**
 * Format amount with conversion hint.
 * e.g. formatMoneyWithConversion(1000, 'USD', 16400) → "USD 1,000 (~Rp 16.400.000)"
 */
export function formatMoneyWithConversion(
  amount: number | string | null | undefined,
  currency: string,
  fxRateToIDR: number | null | undefined,
  showConversion = true
): string {
  const primary = formatMoney(amount, currency)
  if (primary === '—') return '—'

  if (!showConversion || !fxRateToIDR || currency === 'IDR') return primary

  const n = typeof amount === 'string' ? parseFloat(amount as string) : (amount as number)
  if (isNaN(n)) return primary

  const idrEquiv = n * fxRateToIDR
  return `${primary} (~${idrFormatter.format(idrEquiv)})`
}

/** Compact number format for dashboard widgets, e.g. 1500000 → "1.5M" */
export function formatCompact(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toString()
}
