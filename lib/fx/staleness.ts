import type { FxRate } from '@/types/database'

export type FxFreshnessLevel = 'none' | 'ok' | 'amber' | 'red'

/** Hours since the newest `fx_rates.created_at` in the given list (null if empty). */
export function hoursSinceLatestFxRate(rates: FxRate[]): number | null {
  if (!rates.length) return null
  let maxMs = 0
  for (const r of rates) {
    const t = Date.parse(r.created_at)
    if (!Number.isNaN(t)) maxMs = Math.max(maxMs, t)
  }
  if (maxMs === 0) return null
  return (Date.now() - maxMs) / (1000 * 60 * 60)
}

export function fxFreshnessLevel(hoursAgo: number | null): FxFreshnessLevel {
  if (hoursAgo == null) return 'none'
  if (hoursAgo > 48) return 'red'
  if (hoursAgo > 24) return 'amber'
  return 'ok'
}
