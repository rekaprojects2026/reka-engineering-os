import { StatusBadge } from '@/components/shared/StatusBadge'
import type { StatusVariant } from '@/lib/constants/statuses'

const VARIANT: Record<string, StatusVariant> = {
  to_do:       'neutral',
  in_progress: 'active',
  review:      'review',
  revision:    'danger',
  blocked:     'danger',
  done:        'success',
}

const LABEL: Record<string, string> = {
  to_do:       'To Do',
  in_progress: 'In Progress',
  review:      'Review',
  revision:    'Revision',
  blocked:     'Blocked',
  done:        'Done',
}

export function TaskStatusBadge({ status }: { status: string }) {
  return (
    <StatusBadge
      label={LABEL[status] ?? status}
      variant={VARIANT[status] ?? 'neutral'}
      dot
    />
  )
}
