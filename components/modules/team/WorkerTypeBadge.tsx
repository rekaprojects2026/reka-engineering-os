import type { CSSProperties } from 'react'
import type { WorkerType } from '@/types/database'

const CONFIG: Record<WorkerType, { label: string; bg: string; color: string }> = {
  internal:      { label: 'Internal',      bg: '#E8EEF8', color: '#142D50' },
  freelancer:    { label: 'Freelancer',    bg: '#FFFBEB', color: '#B45309' },
  subcontractor: { label: 'Subcontractor', bg: '#F1EFE8', color: '#6A6666' },
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

export function WorkerTypeBadge({ type }: { type: WorkerType }) {
  const cfg = CONFIG[type] ?? { label: type, bg: '#F1EFE8', color: '#6A6666' }
  return (
    <span style={{ ...badgeStyle, backgroundColor: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  )
}
