// TypeScript types mirroring the PRD data model
// These are type stubs — full Supabase-generated types added in later stages

export type UserRole = 'admin' | 'staff'
export type SystemRole = 'admin' | 'coordinator' | 'reviewer' | 'member'
export type WorkerType = 'internal' | 'freelancer' | 'subcontractor'
export type ActiveStatus = 'active' | 'inactive' | 'archived'
export type AvailabilityStatus = 'available' | 'partially_available' | 'unavailable' | 'on_leave'
export type RateType = 'hourly' | 'daily' | 'per_task' | 'per_deliverable' | 'per_project' | 'monthly_fixed'

export interface UserProfile {
  id: string
  full_name: string
  email: string
  role: UserRole
  discipline: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // V2 team/freelancer fields
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
  // Sprint 02 onboarding fields
  profile_completed_at: string | null
  skill_tags: string[]
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
  estimated_complexity: string | null
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
  external_reference_url: string | null
  discipline: string
  project_type: string
  scope_summary: string | null
  start_date: string
  target_due_date: string
  actual_completion_date: string | null
  project_lead_user_id: string
  reviewer_user_id: string | null
  priority: string
  status: string
  progress_percent: number
  waiting_on: string | null
  google_drive_folder_id: string | null
  google_drive_folder_link: string | null
  notes_internal: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  project_id: string
  parent_task_id: string | null
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
  drive_link: string | null
  notes: string | null
  created_by: string
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

export interface ProjectFile {
  id: string
  project_id: string
  task_id: string | null
  deliverable_id: string | null
  file_name: string
  file_category: string
  provider: string
  manual_link: string | null
  external_file_id: string | null
  google_drive_folder_id: string | null
  google_web_view_link: string | null
  mime_type: string | null
  extension: string | null
  revision_number: number | null
  version_label: string | null
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
