import type { SupabaseClient } from '@supabase/supabase-js'

/** Direktur: unread "project_pending_approval" for this project link (badge + list highlight). */
export async function markProjectPendingApprovalNotificationsRead(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
): Promise<void> {
  const link = `/projects/${projectId}`
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('type', 'project_pending_approval')
    .eq('link', link)
    .is('read_at', null)

  if (error) {
    console.error('[notifications] markProjectPendingApprovalNotificationsRead:', error.message)
  }
}
