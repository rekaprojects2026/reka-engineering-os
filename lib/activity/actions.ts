// Activity log write helper.
// Called from server action files after state-changing mutations.
// Not a server action itself — only invoked server-side.

import { createServerClient } from '@/lib/supabase/server'

export async function logActivity(opts: {
  entity_type: string
  entity_id:   string
  action_type: string
  user_id:     string
  note?:       string
}): Promise<void> {
  try {
    const supabase = await createServerClient()
    await supabase.from('activity_logs').insert({
      entity_type: opts.entity_type,
      entity_id:   opts.entity_id,
      action_type: opts.action_type,
      user_id:     opts.user_id,
      note:        opts.note ?? null,
    })
  } catch {
    // Fire-and-forget — activity logging must never break a primary operation.
  }
}
