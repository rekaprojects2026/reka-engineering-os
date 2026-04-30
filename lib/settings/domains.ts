/**
 * lib/settings/domains.ts
 * Typed domain constants and fallback map for the setting_options table.
 */

import {
  FUNCTIONAL_ROLES,
  DISCIPLINES,
  WORKER_TYPES,
  PROJECT_TYPES,
  TASK_CATEGORY_OPTIONS,
  DELIVERABLE_TYPE_OPTIONS,
  FILE_CATEGORY_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
} from '@/lib/constants/options'

// ── Domain keys ──────────────────────────────────────────────

export const SETTING_DOMAINS = [
  'functional_role',
  'discipline',
  'worker_type',
  'project_type',
  'task_category',
  'deliverable_type',
  'file_category',
  'payment_method',
  'contact_channel',
  'outreach_channel',
  'source_platform',
  'lead_status',
  'invoice_status',
  'outreach_status',
  'workload_thresholds',
] as const

export type SettingDomain = (typeof SETTING_DOMAINS)[number]

// ── Human-readable labels ────────────────────────────────────

export const DOMAIN_LABELS: Record<SettingDomain, string> = {
  functional_role:  'Functional Roles',
  discipline:       'Disciplines',
  worker_type:      'Worker Types',
  project_type:     'Project Types',
  task_category:    'Task Categories',
  deliverable_type: 'Deliverable Types',
  file_category:    'File Categories',
  payment_method:   'Payment Methods',
  contact_channel:  'Contact Channels',
  outreach_channel: 'Outreach Channels',
  source_platform:  'Source Platforms',
  lead_status:      'Lead Statuses',
  invoice_status:   'Invoice Statuses',
  outreach_status:  'Outreach Statuses',
  workload_thresholds: 'Team workload bands',
}

type OptionPair = { value: string; label: string }

function toPlain(arr: readonly { readonly value: string; readonly label: string }[]): OptionPair[] {
  return arr.map(({ value, label }) => ({ value, label }))
}

export const DOMAIN_FALLBACKS: Record<SettingDomain, OptionPair[]> = {
  functional_role:  toPlain(FUNCTIONAL_ROLES),
  discipline:       toPlain(DISCIPLINES),
  worker_type:      toPlain(WORKER_TYPES),
  project_type:     toPlain(PROJECT_TYPES),
  task_category:    toPlain(TASK_CATEGORY_OPTIONS),
  deliverable_type: toPlain(DELIVERABLE_TYPE_OPTIONS),
  file_category:    toPlain(FILE_CATEGORY_OPTIONS),
  payment_method:   toPlain(PAYMENT_METHOD_OPTIONS),
  contact_channel:  [
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'email', label: 'Email' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'telegram', label: 'Telegram' },
    { value: 'phone', label: 'Phone' },
    { value: 'other', label: 'Other' },
  ],
  outreach_channel: [
    { value: 'upwork', label: 'Upwork' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'email', label: 'Email' },
    { value: 'direct', label: 'Direct' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'other', label: 'Other' },
  ],
  source_platform: [
    { value: 'fiverr', label: 'Fiverr' },
    { value: 'upwork', label: 'Upwork' },
    { value: 'direct', label: 'Direct' },
    { value: 'referral', label: 'Referral' },
    { value: 'other', label: 'Other' },
  ],
  lead_status: [
    { value: 'new', label: 'New' },
    { value: 'awaiting_info', label: 'Awaiting Info' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'converted', label: 'Converted' },
  ],
  invoice_status: [
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'partial', label: 'Partial' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'void', label: 'Void' },
  ],
  outreach_status: [
    { value: 'to_contact', label: 'To Contact' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'replied', label: 'Replied' },
    { value: 'in_discussion', label: 'In Discussion' },
    { value: 'converted', label: 'Converted' },
    { value: 'declined', label: 'Declined' },
  ],
  workload_thresholds: [
    { value: '3', label: 'Low band upper bound (open tasks)' },
    { value: '8', label: 'Normal band upper bound' },
    { value: '13', label: 'High band upper bound' },
  ],
}
