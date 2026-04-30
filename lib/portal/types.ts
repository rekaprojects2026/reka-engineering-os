export type ClientPortalTokenRow = {
  id: string
  project_id: string
  token: string
  label: string | null
  expires_at: string | null
  is_active: boolean
  created_at: string
  last_accessed_at: string | null
}
