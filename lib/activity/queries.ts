// Server-side query helpers for the Activity Log module.
// Used by the dashboard Recent Activity feed.

import { createServerClient } from '@/lib/supabase/server'

export type ActivityLogEntry = {
  id:          string
  entity_type: string
  entity_id:   string
  action_type: string
  note:        string | null
  created_at:  string
  actor:       { full_name: string } | null
}

export async function getRecentActivity(limit = 20): Promise<ActivityLogEntry[]> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('activity_logs')
    .select('id, entity_type, entity_id, action_type, note, created_at, actor:profiles!user_id(full_name)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return []
  return (data ?? []) as unknown as ActivityLogEntry[]
}

export async function getProjectActivity(projectId: string, limit = 30): Promise<ActivityLogEntry[]> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('activity_logs')
    .select('id, entity_type, entity_id, action_type, note, created_at, actor:profiles!user_id(full_name)')
    .eq('entity_id', projectId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return []
  return (data ?? []) as unknown as ActivityLogEntry[]
}
