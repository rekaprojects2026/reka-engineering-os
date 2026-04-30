import { StatusBadge } from '@/components/shared/StatusBadge'
import { PROJECT_STATUSES } from '@/lib/constants/statuses'

// Maps a project status DB value (e.g. "ongoing") to the correct badge
const STATUS_MAP: Record<string, { label: string; variant: 'neutral' | 'active' | 'review' | 'success' | 'danger' }> = {
  pending_approval: PROJECT_STATUSES.PENDING_APPROVAL,
  rejected:         PROJECT_STATUSES.REJECTED,
  new:              PROJECT_STATUSES.NEW,
  ready_to_start:   PROJECT_STATUSES.READY_TO_START,
  ongoing:          PROJECT_STATUSES.ONGOING,
  internal_review:  PROJECT_STATUSES.INTERNAL_REVIEW,
  waiting_client:   PROJECT_STATUSES.WAITING_CLIENT,
  in_revision:      PROJECT_STATUSES.IN_REVISION,
  on_hold:          PROJECT_STATUSES.ON_HOLD,
  completed:        PROJECT_STATUSES.COMPLETED,
  cancelled:        PROJECT_STATUSES.CANCELLED,
}

export function ProjectStatusBadge({ status }: { status: string }) {
  const config = STATUS_MAP[status] ?? { label: status, variant: 'neutral' as const }
  return <StatusBadge label={config.label} variant={config.variant} dot />
}
