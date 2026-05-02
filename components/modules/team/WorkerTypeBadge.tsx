import type { CSSProperties } from 'react'
import type { WorkerType } from '@/types/database'

const CONFIG: Record<WorkerType, { label: string; bg: string; color: string }> = {
  internal:      { label: 'Internal',      bg: '#E8EEF8', color: '#142D50' },
  freelancer:    { label: 'Freelancer',    bg: '#F3F4F6', color: '#B45309' },
  subcontractor: { label: 'Subcontractor', bg: '#F0F0F0', color: '#8A8A8A' },
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
  const cfg = CONFIG[type] ?? { label: type, bg: '#F0F0F0', color: '#8A8A8A' }
  return (
    <span style={{ ...badgeStyle, backgroundColor: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  )
}
