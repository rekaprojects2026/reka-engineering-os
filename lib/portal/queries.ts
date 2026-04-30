import { createServerClient } from '@/lib/supabase/server'
import type { ClientPortalTokenRow } from '@/lib/portal/types'

export type { ClientPortalTokenRow }

export async function getPortalTokensForProject(projectId: string): Promise<ClientPortalTokenRow[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('client_portal_tokens')
    .select('id, project_id, token, label, expires_at, is_active, created_at, last_accessed_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as ClientPortalTokenRow[]
}
