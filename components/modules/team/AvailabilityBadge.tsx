import type { AvailabilityStatus } from '@/types/database'

const CONFIG: Record<AvailabilityStatus, { label: string; bg: string; color: string }> = {
  available:           { label: 'Available',        bg: '#DCFCE7', color: '#16A34A' },
  partially_available: { label: 'Partial',          bg: '#FEF3C7', color: '#D97706' },
  unavailable:         { label: 'Unavailable',      bg: '#FEE2E2', color: '#DC2626' },
  on_leave:            { label: 'On Leave',         bg: '#F1F5F9', color: '#64748B' },
}

export function AvailabilityBadge({ status }: { status: AvailabilityStatus }) {
  const cfg = CONFIG[status] ?? CONFIG.unavailable
  return (
    <span
      style={{
        display:      'inline-flex',
        alignItems:   'center',
        padding:      '2px 8px',
        borderRadius: '9999px',
        fontSize:     '0.6875rem',
        fontWeight:   600,
        whiteSpace:   'nowrap',
        backgroundColor: cfg.bg,
        color:           cfg.color,
      }}
    >
      {cfg.label}
    </span>
  )
}
