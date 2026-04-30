import { SYSTEM_ROLE_LABELS } from '@/lib/constants/options'

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-rose-100 text-rose-800',
  direktur: 'bg-blue-100 text-blue-800',
  technical_director: 'bg-purple-100 text-purple-800',
  finance: 'bg-green-100 text-green-800',
  manajer: 'bg-amber-100 text-amber-800',
  bd: 'bg-cyan-100 text-cyan-800',
  senior: 'bg-orange-100 text-orange-800',
  member: 'bg-gray-100 text-gray-700',
  freelancer: 'bg-slate-100 text-slate-600',
}

export function RoleBadge({ role }: { role: string | null | undefined }) {
  if (!role) return <span className="text-[var(--color-text-muted)]">—</span>
  const label = SYSTEM_ROLE_LABELS[role] ?? role
  const color = ROLE_COLORS[role] ?? 'bg-gray-100 text-gray-700'
  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${color}`}>
      {label}
    </span>
  )
}
