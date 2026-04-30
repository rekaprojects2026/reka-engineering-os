/**
 * Dropdown options used across forms and filters.
 *
 * @deprecated For values that exist in `setting_options`, prefer `getSettingOptions(domain)`
 * from `@/lib/settings/queries` in a Server Component and pass `{ value, label }[]` into client forms.
 * This file remains as a safety net for enums not stored in Settings (statuses, roles, etc.).
 */
// Dropdown options used across forms and filters

export const DISCIPLINES = [
  { value: 'mechanical',  label: 'Mechanical' },
  { value: 'civil',       label: 'Civil' },
  { value: 'structural',  label: 'Structural' },
  { value: 'electrical',  label: 'Electrical' },
  { value: 'other',       label: 'Other' },
] as const

export const SOURCE_PLATFORMS = [
  { value: 'upwork',    label: 'Upwork' },
  { value: 'fiverr',    label: 'Fiverr' },
  { value: 'direct',    label: 'Direct' },
  { value: 'referral',  label: 'Referral' },
  { value: 'other',     label: 'Other' },
] as const

export const TEAM_ROLES = [
  { value: 'lead',      label: 'Lead' },
  { value: 'engineer',  label: 'Engineer' },
  { value: 'drafter',   label: 'Drafter' },
  { value: 'checker',   label: 'Checker' },
  { value: 'support',   label: 'Support' },
] as const

export const PROJECT_SOURCE_TYPES = [
  { value: 'DOMESTIC', label: 'Domestic (Direct)' },
  { value: 'PLATFORM', label: 'Platform (Fiverr/Upwork)' },
] as const

export const CONTRACT_CURRENCY_OPTIONS = [
  { value: 'IDR', label: 'IDR' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'SGD', label: 'SGD' },
] as const

export const TERMIN_STATUS_OPTIONS = [
  { value: 'BELUM_DIMULAI',       label: 'Belum Dimulai' },
  { value: 'SIAP_DIKLAIM',        label: 'Siap Diklaim' },
  { value: 'MENUNGGU_VERIFIKASI', label: 'Menunggu Verifikasi' },
  { value: 'INVOICE_DITERBITKAN', label: 'Invoice Diterbitkan' },
  { value: 'MENUNGGU_TTD_CLIENT', label: 'Menunggu TTD Client' },
  { value: 'MENUNGGU_PEMBAYARAN', label: 'Menunggu Pembayaran' },
  { value: 'LUNAS',               label: 'Lunas' },
] as const

export const PROJECT_PHASES = [
  { value: 'INISIASI',              label: 'Fase 1 — Inisiasi' },
  { value: 'KONSEP',                label: 'Fase 2 — Konsep / Schematic' },
  { value: 'DESIGN_DEVELOPMENT',    label: 'Fase 3 — Design Development' },
  { value: 'CONSTRUCTION_DOCUMENT', label: 'Fase 4 — Construction Document' },
  { value: 'RENDERING',             label: 'Fase 5 — Rendering & Presentasi' },
  { value: 'CONSTRUCTION_ADMIN',    label: 'Fase 6 — Construction Admin' },
] as const

export const PROJECT_STATUS_OPTIONS = [
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'rejected',         label: 'Rejected' },
  { value: 'new',              label: 'New' },
  { value: 'ready_to_start',   label: 'Ready to Start' },
  { value: 'ongoing',          label: 'Ongoing' },
  { value: 'internal_review',  label: 'Internal Review' },
  { value: 'waiting_client',   label: 'Waiting Client' },
  { value: 'in_revision',      label: 'In Revision' },
  { value: 'on_hold',          label: 'On Hold' },
  { value: 'completed',        label: 'Completed' },
  { value: 'cancelled',        label: 'Cancelled' },
] as const

export const WAITING_ON_OPTIONS = [
  { value: 'none',     label: 'None' },
  { value: 'internal', label: 'Internal' },
  { value: 'client',   label: 'Client' },
  { value: 'vendor',   label: 'Vendor' },
] as const

export const PRIORITY_OPTIONS = [
  { value: 'low',    label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high',   label: 'High' },
  { value: 'urgent', label: 'Urgent' },
] as const

export const PROJECT_TYPES = [
  { value: 'design',        label: 'Design' },
  { value: 'analysis',      label: 'Analysis' },
  { value: 'drawing',       label: 'Drawing' },
  { value: 'consultation',  label: 'Consultation' },
  { value: 'inspection',    label: 'Inspection' },
  { value: 'other',         label: 'Other' },
] as const

export const USER_ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'staff', label: 'Staff' },
] as const

// ── V2 Team / Freelancer options ──────────────────────────────

export const SYSTEM_ROLES = [
  { value: 'owner', label: 'Owner' },
  { value: 'direktur', label: 'Direktur' },
  { value: 'technical_director', label: 'Technical Director' },
  { value: 'finance', label: 'Finance' },
  { value: 'manajer', label: 'Manajer' },
  { value: 'bd', label: 'Business Development' },
  { value: 'senior', label: 'Senior' },
  { value: 'member', label: 'Member' },
  { value: 'freelancer', label: 'Freelancer' },
] as const

/** Display labels for system_role badges */
export const SYSTEM_ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  direktur: 'Direktur',
  technical_director: 'Technical Director',
  finance: 'Finance',
  manajer: 'Manajer',
  bd: 'BD',
  senior: 'Senior',
  member: 'Member',
  freelancer: 'Freelancer',
}

export const WORKER_TYPES = [
  { value: 'internal',      label: 'Internal' },
  { value: 'freelancer',    label: 'Freelancer' },
  { value: 'subcontractor', label: 'Subcontractor' },
] as const

export const ACTIVE_STATUS_OPTIONS = [
  { value: 'active',   label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' },
] as const

export const AVAILABILITY_STATUS_OPTIONS = [
  { value: 'available',           label: 'Available' },
  { value: 'partially_available', label: 'Partially Available' },
  { value: 'unavailable',         label: 'Unavailable' },
  { value: 'on_leave',            label: 'On Leave' },
] as const

export const RATE_TYPE_OPTIONS = [
  { value: 'hourly',          label: 'Per Hour' },
  { value: 'daily',           label: 'Per Day' },
  { value: 'per_task',        label: 'Per Task' },
  { value: 'per_deliverable', label: 'Per Deliverable' },
  { value: 'per_project',     label: 'Per Project' },
  { value: 'monthly_fixed',   label: 'Monthly Fixed' },
] as const

export const FUNCTIONAL_ROLES = [
  { value: 'civil_engineer',       label: 'Civil Engineer' },
  { value: 'structural_engineer',  label: 'Structural Engineer' },
  { value: 'mechanical_engineer',  label: 'Mechanical Engineer' },
  { value: 'electrical_engineer',  label: 'Electrical Engineer' },
  { value: 'drafter',              label: 'Drafter' },
  { value: 'bim_modeler',          label: 'BIM Modeler' },
  { value: 'cad_freelancer',       label: 'CAD Freelancer' },
  { value: 'checker',              label: 'Checker' },
  { value: 'estimator',            label: 'Estimator' },
  { value: 'project_manager',      label: 'Project Manager' },
  { value: 'admin_ops',            label: 'Admin Ops' },
  { value: 'other',                label: 'Other' },
] as const

export const CLIENT_TYPES = [
  { value: 'company',    label: 'Company' },
  { value: 'individual', label: 'Individual' },
  { value: 'freelancer', label: 'Freelancer' },
  { value: 'government', label: 'Government' },
  { value: 'other',      label: 'Other' },
] as const

export const CLIENT_STATUSES_OPTIONS = [
  { value: 'lead',     label: 'Lead' },
  { value: 'active',   label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' },
] as const

export const COMPLEXITY_OPTIONS = [
  { value: 'low',     label: 'Low' },
  { value: 'medium',  label: 'Medium' },
  { value: 'high',    label: 'High' },
  { value: 'unknown', label: 'Unknown' },
] as const

export const INTAKE_STATUS_OPTIONS = [
  { value: 'new',           label: 'New' },
  { value: 'awaiting_info', label: 'Awaiting Info' },
  { value: 'qualified',     label: 'Qualified' },
  { value: 'rejected',      label: 'Rejected' },
  { value: 'closed',        label: 'Closed' },
  { value: 'converted',     label: 'Converted' },
] as const

export const TASK_STATUS_OPTIONS = [
  { value: 'to_do',        label: 'To Do' },
  { value: 'in_progress',  label: 'In Progress' },
  { value: 'review',       label: 'Review' },
  { value: 'revision',     label: 'Revision' },
  { value: 'blocked',      label: 'Blocked' },
  { value: 'done',         label: 'Done' },
] as const

export const TASK_CATEGORY_OPTIONS = [
  { value: 'brief_review',         label: 'Brief Review' },
  { value: 'reference_collection', label: 'Reference Collection' },
  { value: 'modeling',             label: 'Modeling' },
  { value: 'drafting',             label: 'Drafting' },
  { value: 'calculation',          label: 'Calculation' },
  { value: 'checking',             label: 'Checking' },
  { value: 'boq',                  label: 'BOQ' },
  { value: 'report_writing',       label: 'Report Writing' },
  { value: 'revision',             label: 'Revision' },
  { value: 'coordination',         label: 'Coordination' },
  { value: 'submission_prep',      label: 'Submission Prep' },
  { value: 'admin',                label: 'Admin' },
] as const

export const DELIVERABLE_STATUS_OPTIONS = [
  { value: 'draft',              label: 'Draft' },
  { value: 'internal_review',    label: 'Internal Review' },
  { value: 'ready_to_submit',    label: 'Ready to Submit' },
  { value: 'sent_to_client',     label: 'Sent to Client' },
  { value: 'revision_requested', label: 'Revision Requested' },
  { value: 'approved',           label: 'Approved' },
  { value: 'final_issued',       label: 'Final Issued' },
] as const

export const DELIVERABLE_TYPE_OPTIONS = [
  { value: 'drawing',            label: 'Drawing' },
  { value: '3d_model',           label: '3D Model' },
  { value: 'report',             label: 'Report' },
  { value: 'boq',                label: 'BOQ' },
  { value: 'calculation_sheet',  label: 'Calculation Sheet' },
  { value: 'presentation',       label: 'Presentation' },
  { value: 'specification',      label: 'Specification' },
  { value: 'revision_package',   label: 'Revision Package' },
  { value: 'submission_package', label: 'Submission Package' },
] as const

export const FILE_CATEGORY_OPTIONS = [
  { value: 'reference',            label: 'Reference' },
  { value: 'draft',                label: 'Draft' },
  { value: 'working_file',        label: 'Working File' },
  { value: 'review_copy',         label: 'Review Copy' },
  { value: 'final',               label: 'Final' },
  { value: 'submission',          label: 'Submission' },
  { value: 'supporting_document', label: 'Supporting Document' },
] as const

export const FILE_PROVIDER_OPTIONS = [
  { value: 'manual',       label: 'Manual Link' },
  { value: 'google_drive', label: 'Google Drive' },
  { value: 'r2',           label: 'Cloudflare R2' },
] as const

// ── V2 Sprint 03 — Compensation / Payment options ───────────

export const COMPENSATION_STATUS_OPTIONS = [
  { value: 'draft',     label: 'Draft' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'paid',      label: 'Paid' },
  { value: 'cancelled', label: 'Cancelled' },
] as const

export const PAYMENT_STATUS_OPTIONS = [
  { value: 'unpaid',  label: 'Unpaid' },
  { value: 'partial', label: 'Partial' },
  { value: 'paid',    label: 'Paid' },
] as const

export const PAYMENT_METHOD_OPTIONS = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'ewallet',       label: 'E-Wallet' },
  { value: 'cash',          label: 'Cash' },
  { value: 'other',         label: 'Other' },
] as const

export const WORK_BASIS_OPTIONS = [
  { value: 'hourly',          label: 'Per Hour' },
  { value: 'daily',           label: 'Per Day' },
  { value: 'per_task',        label: 'Per Task' },
  { value: 'per_deliverable', label: 'Per Deliverable' },
  { value: 'per_project',     label: 'Per Project' },
] as const
