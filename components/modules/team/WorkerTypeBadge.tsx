import type { WorkerType } from '@/types/database'

const CONFIG: Record<WorkerType, { label: string; bg: string; color: string }> = {
  internal:      { label: 'Internal',      bg: '#DBEAFE', color: '#1D4ED8' },
  freelancer:    { label: 'Freelancer',    bg: '#EDE9FE', color: '#7C3AED' },
  subcontractor: { label: 'Subcontractor', bg: '#FEF3C7', color: '#D97706' },
}

export function WorkerTypeBadge({ type }: { type: WorkerType }) {
  const cfg = CONFIG[type] ?? { label: type, bg: '#F1F5F9', color: '#64748B' }
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
