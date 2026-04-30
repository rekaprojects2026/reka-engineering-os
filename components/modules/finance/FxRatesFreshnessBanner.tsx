'use client'

import type { FxFreshnessLevel } from '@/lib/fx/staleness'

function formatAge(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} menit`
  if (hours < 24) return `${Math.round(hours)} jam`
  return `${Math.round(hours / 24)} hari`
}

export function FxRatesFreshnessBanner({
  hoursSinceUpdate,
  level,
}: {
  hoursSinceUpdate: number | null
  level: FxFreshnessLevel
}) {
  if (level === 'none') {
    return (
      <p
        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-2.5 text-[0.8125rem] text-[var(--color-text-muted)]"
        role="status"
      >
        Belum ada baris kurs. Tambahkan manual atau jalankan job harian fetch FX.
      </p>
    )
  }

  const color =
    level === 'red'
      ? 'var(--color-danger)'
      : level === 'amber'
        ? 'var(--color-warning)'
        : 'var(--color-text-secondary)'
  const bg =
    level === 'red'
      ? 'var(--color-danger-subtle)'
      : level === 'amber'
        ? 'var(--color-warning-subtle)'
        : 'var(--color-surface-muted)'

  return (
    <p
      className="rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-[0.8125rem]"
      style={{ color, backgroundColor: bg }}
      role="status"
    >
      Kurs terakhir diperbarui:{' '}
      <strong>{hoursSinceUpdate != null ? formatAge(hoursSinceUpdate) : '—'} lalu</strong>
      {level === 'amber' && ' — periksa cron fetch harian.'}
      {level === 'red' && ' — data mungkin basi; segera perbarui atau perbaiki integrasi.'}
    </p>
  )
}
