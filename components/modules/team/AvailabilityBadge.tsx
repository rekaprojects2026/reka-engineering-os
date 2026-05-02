import type { CSSProperties } from 'react'
import type { AvailabilityStatus } from '@/types/database'

const CONFIG: Record<AvailabilityStatus, { label: string; bg: string; color: string }> = {
  available:           { label: 'Available',   bg: '#ECFDF3', color: '#166534' },
  partially_available: { label: 'Partial',     bg: '#F3F4F6', color: '#B45309' },
  unavailable:         { label: 'Unavailable', bg: '#FEF2F2', color: '#991B1B' },
  on_leave:            { label: 'On Leave',    bg: '#F0F0F0', color: '#8A8A8A' },
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
