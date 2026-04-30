import { StatusBadge } from '@/components/shared/StatusBadge'
import type { StatusVariant } from '@/lib/constants/statuses'
import type { PaymentStatus } from '@/types/database'

const CONFIG: Record<PaymentStatus, { label: string; variant: StatusVariant }> = {
  unpaid:  { label: 'Unpaid',  variant: 'danger'  },
  partial: { label: 'Partial', variant: 'review'  },
  paid:    { label: 'Paid',    variant: 'success' },
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const c = CONFIG[status] ?? CONFIG.unpaid
  return <StatusBadge label={c.label} variant={c.variant} dot />
}
