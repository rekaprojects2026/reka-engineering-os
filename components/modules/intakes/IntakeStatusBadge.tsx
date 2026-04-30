import { StatusBadge } from '@/components/shared/StatusBadge'
import { INTAKE_STATUSES } from '@/lib/constants/statuses'
import type { StatusVariant } from '@/lib/constants/statuses'

interface IntakeStatusBadgeProps {
  status: string
}

const STATUS_MAP: Record<string, { label: string; variant: StatusVariant }> = {
  new:           INTAKE_STATUSES.NEW,
  awaiting_info: INTAKE_STATUSES.AWAITING_INFO,
  qualified:     INTAKE_STATUSES.QUALIFIED,
  rejected:      INTAKE_STATUSES.REJECTED,
  closed:        INTAKE_STATUSES.CLOSED,
  converted:     INTAKE_STATUSES.CONVERTED,
}

export function IntakeStatusBadge({ status }: IntakeStatusBadgeProps) {
  const config = STATUS_MAP[status] ?? { label: status, variant: 'neutral' as StatusVariant }
  return <StatusBadge label={config.label} variant={config.variant} dot />
}
