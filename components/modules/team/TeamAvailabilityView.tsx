'use client'

import type { TeamAvailabilityRow } from '@/lib/team/queries'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils/formatters'

const AVAILABILITY_LABEL: Record<string, string> = {
  available: 'Tersedia',
  partially_available: 'Sebagian',
  unavailable: 'Tidak tersedia',
  on_leave: 'Cuti',
}

const AVAILABILITY_COLOR: Record<string, string> = {
  available: 'var(--color-success)',
  partially_available: 'var(--color-warning)',
  unavailable: 'var(--color-danger)',
  on_leave: 'var(--color-text-muted)',
}

export type TeamAvailabilityViewProps = {
  members: TeamAvailabilityRow[]
  functionalRoleLabels: Record<string, string>
  disciplineLabels: Record<string, string>
}

export function TeamAvailabilityView({
  members,
  functionalRoleLabels,
  disciplineLabels,
}: TeamAvailabilityViewProps) {
  if (members.length === 0) {
    return (
      <div className="py-16 text-center text-[var(--color-text-muted)]">
        Belum ada anggota tim aktif.
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {members.map((m) => {
        const status = m.availability_status ?? 'unavailable'
        const color = AVAILABILITY_COLOR[status] ?? 'var(--color-text-muted)'
        const label = AVAILABILITY_LABEL[status] ?? status
        const funcLabel = m.functional_role
          ? functionalRoleLabels[m.functional_role] ?? m.functional_role
          : null
        const discLabel = m.discipline ? disciplineLabels[m.discipline] ?? m.discipline : null
        const subtitle = [discLabel, funcLabel].filter(Boolean).join(' · ') || null

        return (
          <div
            key={m.id}
            className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 shrink-0">
                {m.photo_url ? <AvatarImage src={m.photo_url} alt={m.full_name} /> : null}
                <AvatarFallback className="text-sm font-semibold">{getInitials(m.full_name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="truncate text-[0.875rem] font-semibold text-[var(--color-text-primary)]">
                  {m.full_name}
                </div>
                {subtitle && (
                  <div className="truncate text-[0.75rem] capitalize text-[var(--color-text-muted)]">
                    {subtitle}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-1.5">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[0.8125rem] font-medium" style={{ color }}>
                {label}
              </span>
            </div>

            {m.skill_tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {m.skill_tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md px-1.5 py-0.5 text-[0.6875rem] font-medium"
                    style={{
                      backgroundColor: 'var(--color-surface-muted)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {tag}
                  </span>
                ))}
                {m.skill_tags.length > 3 && (
                  <span className="text-[0.6875rem] text-[var(--color-text-muted)]">
                    +{m.skill_tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
