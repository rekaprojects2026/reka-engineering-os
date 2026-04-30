import type { CSSProperties } from 'react'
import type { AvailabilityStatus } from '@/types/database'

const CONFIG: Record<AvailabilityStatus, { label: string; bg: string; color: string }> = {
  available:           { label: 'Available',   bg: '#ECFDF3', color: '#166534' },
  partially_available: { label: 'Partial',     bg: '#FFFBEB', color: '#B45309' },
  unavailable:         { label: 'Unavailable', bg: '#F8E9E8', color: '#851E1E' },
  on_leave:            { label: 'On Leave',    bg: '#F1EFE8', color: '#6A6666' },
}

const badgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '2px 10px',
  borderRadius: 'var(--radius-pill)',
  fontSize: '0.6875rem',
  fontWeight: 600,
  whiteSpace: 'nowrap',
  letterSpacing: '0.01em',
}

export function AvailabilityBadge({ status }: { status: AvailabilityStatus }) {
  const cfg = CONFIG[status] ?? CONFIG.unavailable
  return (
    <span style={{ ...badgeStyle, backgroundColor: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  )
}
