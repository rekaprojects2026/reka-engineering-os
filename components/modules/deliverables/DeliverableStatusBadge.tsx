import { StatusBadge } from '@/components/shared/StatusBadge'
import type { StatusVariant } from '@/lib/constants/statuses'

const VARIANT: Record<string, StatusVariant> = {
  draft:              'neutral',
  internal_review:    'review',
  ready_to_submit:    'active',
  sent_to_client:     'active',
  revision_requested: 'danger',
  approved:           'success',
  final_issued:       'success',
}

const LABEL: Record<string, string> = {
  draft:              'Draft',
  internal_review:    'Internal Review',
  ready_to_submit:    'Ready to Submit',
  sent_to_client:     'Sent to Client',
  revision_requested: 'Revision Requested',
  approved:           'Approved',
  final_issued:       'Final Issued',
}

export function DeliverableStatusBadge({ status }: { status: string }) {
  return (
    <StatusBadge
      label={LABEL[status] ?? status}
      variant={VARIANT[status] ?? 'neutral'}
      dot
    />
  )
}
