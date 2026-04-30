// Server-side query helpers for the Invite / Onboarding module.

import { createAdminClient } from '@/lib/supabase/admin'
import type { Invite } from '@/types/database'

export type InviteWithInviter = Invite & {
  inviter: { full_name: string } | null
}

// ── Admin: list pending invites ───────────────────────────────

export async function getPendingInvites(): Promise<InviteWithInviter[]> {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('invites')
    .select('*, inviter:profiles!invited_by(full_name)')
    .eq('status', 'pending')
    .order('invited_at', { ascending: false })

  if (error) return []
  return (data ?? []) as unknown as InviteWithInviter[]
}

// ── Public: look up invite by token (uses admin to bypass RLS) ─

export async function getInviteByToken(token: string): Promise<Invite | null> {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('invites')
    .select('*')
    .eq('token', token)
    .single()

  if (error) return null
  return data as Invite
}
