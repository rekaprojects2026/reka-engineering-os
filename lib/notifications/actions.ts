'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'

export async function markNotificationRead(id: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { ok: true }
}

/** Mark a single EngDocs in-app notification read (schema engdocs). */
export async function markEngdocsNotificationRead(id: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .schema('engdocs')
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function markAllNotificationsRead() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const now = new Date().toISOString()

  const [osRes, docsRes] = await Promise.all([
    supabase.from('notifications').update({ read_at: now }).eq('user_id', user.id).is('read_at', null),
    supabase.schema('engdocs').from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false),
  ])

  if (osRes.error) return { error: osRes.error.message }
  if (docsRes.error) return { error: docsRes.error.message }
  revalidatePath('/', 'layout')
  return { ok: true }
}
