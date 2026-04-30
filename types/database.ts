// TypeScript types mirroring the full data model (V2)

export type UserRole = 'admin' | 'staff'

export type SystemRole =
  | 'owner'
  | 'direktur'
  | 'technical_director'
  | 'finance'
  | 'manajer'
  | 'bd'
  | 'senior'
  | 'member'
  | 'freelancer'

/** Three top management roles */
export type ManagementRole = 'direktur' | 'technical_director' | 'finance'

/** Roles that create & lead projects */
export type OpsLeadRole = 'technical_director' | 'manajer'

/** Personal dashboard / own work only */
export type PersonalOnlyRole = 'member' | 'freelancer' | 'senior'
export type WorkerType = 'internal' | 'freelancer' | 'subcontractor'
export type ActiveStatus = 'active' | 'inactive' | 'archived'
export type AvailabilityStatus = 'available' | 'partially_available' | 'unavailable' | 'on_leave'
export type RateType = 'hourly' | 'daily' | 'per_task' | 'per_deliverable' | 'per_project' | 'monthly_fixed'
export type CompensationStatus = 'draft' | 'confirmed' | 'paid' | 'cancelled'
export type PaymentStatus = 'unpaid' | 'partial' | 'paid'
export type InvoiceStatus = 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'void'
export type PayslipStatus = 'draft' | 'sent' | 'paid'
export type OutreachStatus = 'to_contact' | 'contacted' | 'replied' | 'in_discussion' | 'converted' | 'declined'
export type Currency = 'IDR' | 'USD' | 'EUR' | 'SGD'

/** Billing model: domestic milestones vs platform-handled. */
export type ProjectSourceType = 'DOMESTIC' | 'PLATFORM'

/** How Google Drive is set up for a project. */
export type ProjectDriveMode = 'auto' | 'manual' | 'none'

/** Milestone payment lifecycle (DOMESTIC projects). */
export type TerminStatus =
  | 'BELUM_DIMULAI'
  | 'SIAP_DIKLAIM'
  | 'MENUNGGU_VERIFIKASI'
  | 'INVOICE_DITERBITKAN'
  | 'MENUNGGU_TTD_CLIENT'
  | 'MENUNGGU_PEMBAYARAN'
  | 'LUNAS'
export type PaymentAccountType = 'wise' | 'paypal' | 'bank' | 'ewallet' | 'other'

export interface UserProfile {
  id: string
  full_name: string
  email: string
  role: UserRole
  discipline: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  phone: string | null
  system_role: SystemRole | null
  functional_role: string | null
  worker_type: WorkerType | null
  active_status: ActiveStatus
  availability_status: AvailabilityStatus
  joined_date: string | null
  expected_rate: number | null
  approved_rate: number | null
  rate_type: RateType | null
  currency_code: string
  city: string | null
  portfolio_link: string | null
  notes_internal: string | null
  bank_name: string | null
  bank_account_name: string | null
  bank_account_number: string | null
  ewallet_type: string | null
  ewallet_number: string | null
  profile_completed_at: string | null
  skill_tags: string[]
  photo_url: string | null
  /** Google account for Drive sharing when different from login email. */
  google_email: string | null
}

export interface Invite {
  id:          string
  email:       string
  token:       string
  full_name:   string | null
  system_role: SystemRole | null
  worker_type: WorkerType | null
  invited_by:  string | null
  status:      'pending' | 'accepted' | 'expired' | 'revoked'
  invited_at:  string
  accepted_at: string | null
  expires_at:  string
}

export interface Client {
  id: string
  client_code: string
  client_name: string
  client_type: string
  source_default: string
  primary_contact_name: string | null
  primary_contact_email: string | null
  primary_contact_phone: string | null
  company_name: string | null
  notes: string | null
  status: string
  created_at: string
  updated_at: string
}

export interface Intake {
  id: string
  intake_code: string
  client_id: string | null
  temp_client_name: string | null
  source: string
  external_reference_url: string | null
  title: string
  short_brief: string | null
  discipline: string
  project_type: string
  proposed_deadline: string | null
  budget_estimate: number | null
  budget_currency: Currency
  estimated_complexity: string | null
  complexity_score: number | null
  contact_channel: string | null
  contact_value: string | null
  qualification_notes: string | null
  status: string
  received_date: string
  created_by: string
  converted_project_id: string | null
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  project_code: string
  client_id: string
  intake_id: string | null
  name: string
  source: string
  source_platform: string | null
  external_reference_url: string | null
  /** @deprecated Use disciplines; kept for DB backward compatibility */
  discipline: string
  /** Primary engineering disciplines for this project */
  disciplines: string[]
  drive_mode: ProjectDriveMode | null
  drive_construction_admin_created: boolean
  project_type: string
  scope_summary: string | null
  start_date: string
  target_due_date: string
  actual_completion_date: string | null
  project_lead_user_id: string
  reviewer_user_id: string | null
  priority: string
  status: string
  approval_requested_at: string | null
  approval_reviewed_by: string | null
  approval_reviewed_at: string | null
  rejection_note: string | null
  progress_percent: number
  waiting_on: string | null
  is_problematic: boolean
  problem_note: string | null
  google_drive_folder_id: string | null
  google_drive_folder_link: string | null
  notes_internal: string | null
  source_type: ProjectSourceType
  contract_value: number | null
  contract_currency: string
  has_retention: boolean
  retention_percentage: number | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface ProjectTermin {
  id: string
  project_id: string
  termin_number: number
  label: string
  percentage: number
  amount: number | null
  currency: string
  trigger_condition: string | null
  status: TerminStatus
  invoice_id: string | null
  claimed_by: string | null
  claimed_at: string | null
  verified_by: string | null
  verified_at: string | null
  bast_signed_at: string | null
  bast_signed_by: string | null
  client_signed_bast_at: string | null
  paid_at: string | null
  notes: string | null
  is_retention: boolean
  retention_due_date: string | null
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  project_id: string
  parent_task_id: string | null
  /** Optional project phase (sprint) grouping; see project_phases. */
  phase_id: string | null
  /** Nesting: 0 = top-level, parent.depth + 1 for subtasks. */
  depth: number
  /** Order within the same project + parent. */
  sort_order: number
  title: string
  description: string | null
  category: string | null
  phase: string | null
  assigned_to_user_id: string
  reviewer_user_id: string | null
  start_date: string | null
  due_date: string | null
  completed_date: string | null
  estimated_hours: number | null
  actual_hours: number | null
  priority: string
  status: string
  progress_percent: number
  blocked_reason: string | null
  is_problematic: boolean
  problem_note: string | null
  drive_link: string | null
  notes: string | null
  created_by: string
  created_at: string
  updated_at: string
}

/** Per-project wiki note (BlockNote JSON + plain text index). */
export interface ProjectNote {
  id: string
  project_id: string
  title: string
  content: unknown
  content_text: string | null
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

/** Shareable client portal token (opaque URL segment). */
export interface ClientPortalToken {
  id: string
  project_id: string
  token: string
  label: string | null
  expires_at: string | null
  is_active: boolean
  created_by: string | null
  created_at: string
  last_accessed_at: string | null
}

/** Plain-text comment on a task or deliverable (see Phase 01). */
export interface Comment {
  id: string
  task_id: string | null
  deliverable_id: string | null
  parent_id: string | null
  author_id: string
  body: string
  edited_at: string | null
  created_at: string
  updated_at: string
}

export interface Deliverable {
  id: string
  project_id: string
  linked_task_id: string | null
  name: string
  type: string
  revision_number: number
  version_label: string | null
  description: string | null
  status: string
  prepared_by_user_id: string
  reviewed_by_user_id: string | null
  submitted_to_client_date: string | null
  approved_date: string | null
  client_feedback_summary: string | null
  file_link: string | null
  created_at: string
  updated_at: string
}

export type FileProvider = 'manual' | 'google_drive' | 'r2'

export interface ProjectFile {
  id: string
  project_id: string
  task_id: string | null
  deliverable_id: string | null
  file_name: string
  file_code: string | null
  revision_code: string
  discipline_code: string | null
  doc_type_code: string | null
  file_category: string
  provider: string
  manual_link: string | null
  external_file_id: string | null
  google_drive_folder_id: string | null
  google_web_view_link: string | null
  mime_type: string | null
  extension: string | null
  file_size_bytes: number | null
  r2_key: string | null
  r2_url: string | null
  revision_number: number | null
  version_label: string | null
  is_approved_version: boolean
  approved_at: string | null
  approved_by: string | null
  notes: string | null
  uploaded_by_user_id: string
  created_at: string
  updated_at: string
}

export interface ProjectTeamAssignment {
  id: string
  project_id: string
  user_id: string
  team_role: string
  /** Project-scoped discipline; null = all disciplines on the project. */
  discipline: string | null
  assigned_at: string
}

export interface ActivityLog {
  id: string
  entity_type: string
  entity_id: string
  action_type: string
  user_id: string
  note: string | null
  created_at: string
}

/** Daily time logged per member per task (time tracking). */
export interface WorkLog {
  id: string
  task_id: string
  project_id: string
  member_id: string
  log_date: string
  hours_logged: number
  description: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type ProjectExpenseCategory =
  | 'printing'
  | 'survey'
  | 'transport'
  | 'accommodation'
  | 'materials'
  | 'software'
  | 'meals'
  | 'other'

export type ProjectExpenseStatus = 'pending' | 'approved' | 'rejected'

export interface ProjectExpense {
  id: string
  project_id: string
  task_id: string | null
  category: ProjectExpenseCategory
  description: string
  amount: number
  currency_code: string
  expense_date: string
  receipt_url: string | null
  submitted_by: string
  status: ProjectExpenseStatus
  approved_by: string | null
  rejection_note: string | null
  created_at: string
  updated_at: string
}

export interface CompensationRecord {
  id: string
  member_id: string
  project_id: string
  task_id: string | null
  deliverable_id: string | null
  rate_type: RateType
  qty: number
  rate_amount: number
  subtotal_amount: number
  currency_code: string
  status: CompensationStatus
  period_label: string | null
  work_date: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  /** TD / Manajer who proposed this row (Stage D workflow). */
  proposed_by: string | null
  proposed_at: string | null
  return_note: string | null
  finance_note: string | null
  confirmed_by: string | null
  confirmed_at: string | null
  is_monthly_fixed_direct: boolean
}

export interface PaymentRecord {
  id: string
  member_id: string
  period_label: string | null
  total_due: number
  total_paid: number
  balance: number
  currency_code: string
  payment_status: PaymentStatus
  payment_date: string | null
  payment_method: string | null
  payment_reference: string | null
  proof_link: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface FxRate {
  id: string
  from_currency: string
  to_currency: string
  rate: number
  effective_date: string
  notes: string | null
  set_by: string | null
  created_at: string
}

export interface PaymentAccount {
  id: string
  name: string
  account_type: PaymentAccountType
  currency: string
  account_identifier: string | null
  description: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body: string | null
  link: string | null
  read_at: string | null
  created_at: string
}

export interface Payslip {
  id: string
  payslip_code: string
  profile_id: string
  period_month: number
  period_year: number
  base_amount: number
  currency: string
  bonus_amount: number
  deduction_amount: number
  net_amount: number
  payment_account_id: string | null
  status: PayslipStatus
  notes: string | null
  generated_by: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
}

export interface ClientInvoice {
  id: string
  invoice_code: string
  project_id: string | null
  client_id: string | null
  issue_date: string
  due_date: string | null
  currency: Currency
  gross_amount: number
  platform_type: string | null
  platform_fee_pct: number
  platform_fee_amount: number
  gateway_fee_pct: number
  gateway_fee_amount: number
  net_amount: number
  fx_rate_snapshot: number | null
  destination_account_id: string | null
  status: InvoiceStatus
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface InvoiceLineItem {
  id: string
  invoice_id: string
  description: string
  task_id: string | null
  deliverable_id: string | null
  qty: number
  unit_price: number
  subtotal: number
  sort_order: number
  created_at: string
}

export interface IncomingPayment {
  id: string
  invoice_id: string
  payment_date: string
  amount_received: number
  currency: string
  fx_rate_snapshot: number | null
  account_id: string | null
  payment_reference: string | null
  proof_link: string | null
  notes: string | null
  recorded_by: string | null
  created_at: string
}

export interface OutreachCompany {
  id: string
  company_name: string
  contact_person: string | null
  contact_channel: string | null
  contact_value: string | null
  status: OutreachStatus
  last_contact_date: string | null
  next_followup_date: string | null
  converted_intake_id: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface DeadlineChange {
  id: string
  entity_type: 'project' | 'task'
  entity_id: string
  old_due_date: string | null
  new_due_date: string
  reason: string | null
  changed_by: string | null
  changed_at: string
}

export interface SettingOption {
  id: string
  domain: string
  value: string
  label: string
  sort_order: number
  is_active: boolean
  created_at: string
}

/** Public API key (hash stored server-side only). */
export interface ApiKey {
  id: string
  name: string
  key_hash: string
  key_prefix: string
  created_by: string | null
  last_used_at: string | null
  expires_at: string | null
  is_active: boolean
  scopes: string[]
  created_at: string
}

export interface ApiRequestLog {
  id: string
  api_key_id: string | null
  method: string | null
  path: string | null
  status_code: number | null
  ip_address: string | null
  created_at: string
}

export interface WebhookEndpoint {
  id: string
  name: string
  url: string
  secret: string
  events: string[]
  is_active: boolean
  created_by: string | null
  created_at: string
}

export interface WebhookDeliveryLog {
  id: string
  webhook_id: string
  event_type: string
  payload: Record<string, unknown>
  response_status: number | null
  response_body: string | null
  error: string | null
  delivered_at: string
  duration_ms: number | null
}
