/** `monthIso` is first day of month, e.g. `2026-04-01`. Returns `[start, endExclusive)` for DB range filters. */
export function workLogMonthRange(monthIso: string): { start: string; endExclusive: string } {
  const key = monthIso.slice(0, 10)
  const ym = key.slice(0, 7)
  const parts = ym.split('-')
  const y = Number(parts[0])
  const m = Number(parts[1])
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) {
    const now = new Date()
    const yy = now.getUTCFullYear()
    const mm = now.getUTCMonth() + 1
    return {
      start: `${yy}-${String(mm).padStart(2, '0')}-01`,
      endExclusive: mm === 12 ? `${yy + 1}-01-01` : `${yy}-${String(mm + 1).padStart(2, '0')}-01`,
    }
  }
  const start = `${y}-${String(m).padStart(2, '0')}-01`
  const endExclusive = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`
  return { start, endExclusive }
}
