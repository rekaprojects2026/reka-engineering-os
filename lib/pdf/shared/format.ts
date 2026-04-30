import type { Currency } from '@/types/database'

const idr = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
})
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const eur = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })
const sgd = new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD' })

export function formatMoney(amount: number, currency: Currency): string {
  switch (currency) {
    case 'USD':
      return usd.format(amount)
    case 'EUR':
      return eur.format(amount)
    case 'SGD':
      return sgd.format(amount)
    default:
      return idr.format(amount)
  }
}

export function formatDateID(iso: string | null | Date): string {
  if (iso == null || iso === '') return '—'
  const d = typeof iso === 'string' ? new Date(iso) : iso
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(d)
}

export function periodLabelId(month: number, year: number): string {
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(
    new Date(year, month - 1, 1),
  )
}
