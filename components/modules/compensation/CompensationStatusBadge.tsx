import { StatusBadge } from '@/components/shared/StatusBadge'
import type { StatusVariant } from '@/lib/constants/statuses'
import type { CompensationStatus } from '@/types/database'

const CONFIG: Record<CompensationStatus, { label: string; variant: StatusVariant }> = {
  draft:     { label: 'Draft',     variant: 'neutral' },
  confirmed: { label: 'Confirmed', variant: 'active'  },
  paid:      { label: 'Paid',      variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'danger'  },
}

export function CompensationStatusBadge({ status }: { status: CompensationStatus }) {
  const c = CONFIG[status] ?? CONFIG.draft
  return <StatusBadge label={c.label} variant={c.variant} dot />
}
