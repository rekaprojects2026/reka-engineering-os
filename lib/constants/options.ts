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
  { value: 'lead_engineer',  label: 'Lead Engineer' },
  { value: 'reviewer',       label: 'Reviewer' },
  { value: 'contributor',    label: 'Contributor' },
  { value: 'drafter',        label: 'Drafter' },
  { value: 'coordinator',    label: 'Coordinator' },
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
