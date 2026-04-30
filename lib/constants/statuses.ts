// Status values and their display metadata
// Used by StatusBadge and all module pages

export const CLIENT_STATUSES = {
  LEAD:     { label: 'Lead',     variant: 'neutral'  },
  ACTIVE:   { label: 'Active',   variant: 'success'  },
  INACTIVE: { label: 'Inactive', variant: 'review'   },
  ARCHIVED: { label: 'Archived', variant: 'danger'   },
} as const

export const INTAKE_STATUSES = {
  NEW:           { label: 'New',           variant: 'neutral'  },
  AWAITING_INFO: { label: 'Awaiting Info', variant: 'review'   },
  QUALIFIED:     { label: 'Qualified',     variant: 'active'   },
  REJECTED:      { label: 'Rejected',      variant: 'danger'   },
  CLOSED:        { label: 'Closed',         variant: 'neutral'  },
  CONVERTED:     { label: 'Converted',     variant: 'success'  },
} as const

export const TERMIN_STATUSES = {
  BELUM_DIMULAI:         { label: 'Belum Dimulai',          variant: 'neutral'  },
  SIAP_DIKLAIM:          { label: 'Siap Diklaim',           variant: 'active'   },
  MENUNGGU_VERIFIKASI:   { label: 'Menunggu Verifikasi',    variant: 'review'   },
  INVOICE_DITERBITKAN:   { label: 'Invoice Diterbitkan',    variant: 'active'   },
  MENUNGGU_TTD_CLIENT:   { label: 'Menunggu TTD Client',    variant: 'review'   },
  MENUNGGU_PEMBAYARAN:   { label: 'Menunggu Pembayaran',    variant: 'review'   },
  LUNAS:                 { label: 'Lunas',                  variant: 'success'  },
} as const

export const PROJECT_STATUSES = {
  PENDING_APPROVAL: { label: 'Pending Approval', variant: 'review'   },
  REJECTED:         { label: 'Rejected',         variant: 'danger'   },
  NEW:             { label: 'New',             variant: 'neutral'  },
  READY_TO_START:  { label: 'Ready to Start',  variant: 'neutral'  },
  ONGOING:         { label: 'Ongoing',          variant: 'active'   },
  INTERNAL_REVIEW: { label: 'Internal Review',  variant: 'review'   },
  WAITING_CLIENT:  { label: 'Waiting Client',   variant: 'review'   },
  IN_REVISION:     { label: 'In Revision',      variant: 'review'   },
  ON_HOLD:         { label: 'On Hold',           variant: 'neutral'  },
  COMPLETED:       { label: 'Completed',         variant: 'success'  },
  CANCELLED:       { label: 'Cancelled',         variant: 'danger'   },
} as const

export const TASK_STATUSES = {
  TODO:        { label: 'To Do',      variant: 'neutral'  },
  IN_PROGRESS: { label: 'In Progress', variant: 'active'  },
  REVIEW:      { label: 'Review',      variant: 'review'  },
  REVISION:    { label: 'Revision',    variant: 'review'  },
  BLOCKED:     { label: 'Blocked',     variant: 'danger'  },
  DONE:        { label: 'Done',        variant: 'success' },
} as const

export const DELIVERABLE_STATUSES = {
  DRAFT:              { label: 'Draft',               variant: 'neutral'  },
  INTERNAL_REVIEW:    { label: 'Internal Review',      variant: 'review'   },
  READY_TO_SUBMIT:    { label: 'Ready to Submit',      variant: 'active'   },
  SENT_TO_CLIENT:     { label: 'Sent to Client',       variant: 'active'   },
  REVISION_REQUESTED: { label: 'Revision Requested',   variant: 'review'   },
  APPROVED:           { label: 'Approved',              variant: 'success'  },
  FINAL_ISSUED:       { label: 'Final Issued',          variant: 'success'  },
} as const

export const COMPENSATION_STATUSES = {
  DRAFT:     { label: 'Draft',     variant: 'neutral'  },
  CONFIRMED: { label: 'Confirmed', variant: 'active'   },
  PAID:      { label: 'Paid',      variant: 'success'  },
  CANCELLED: { label: 'Cancelled', variant: 'danger'   },
} as const

export const PAYMENT_STATUSES = {
  UNPAID:  { label: 'Unpaid',  variant: 'danger'  },
  PARTIAL: { label: 'Partial', variant: 'review'  },
  PAID:    { label: 'Paid',    variant: 'success' },
} as const

export type StatusVariant = 'neutral' | 'active' | 'review' | 'success' | 'danger'
