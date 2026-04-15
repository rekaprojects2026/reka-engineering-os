import { StatusBadge } from '@/components/shared/StatusBadge'
import { CLIENT_STATUSES } from '@/lib/constants/statuses'
import type { StatusVariant } from '@/lib/constants/statuses'

interface ClientStatusBadgeProps {
  status: string
}

const STATUS_MAP: Record<string, { label: string; variant: StatusVariant }> = {
  lead:     CLIENT_STATUSES.LEAD,
  active:   CLIENT_STATUSES.ACTIVE,
  inactive: CLIENT_STATUSES.INACTIVE,
  archived: CLIENT_STATUSES.ARCHIVED,
}

export function ClientStatusBadge({ status }: ClientStatusBadgeProps) {
  const config = STATUS_MAP[status] ?? { label: status, variant: 'neutral' as StatusVariant }
  return <StatusBadge label={config.label} variant={config.variant} />
}
