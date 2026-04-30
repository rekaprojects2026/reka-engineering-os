'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { loadMutationProfile, ensureTD } from '@/lib/auth/mutation-policy'
import { isDirektur, isFinance, isTD } from '@/lib/auth/permissions'
import { buildProfilePayload } from '@/lib/team/helpers'
import type { SystemRole } from '@/types/database'

// ── Create member ──────────────────────────────────────────────
// Creates auth user (admin API) then updates the auto-created profile.

export async function createMember(formData: FormData) {
  const supabase = await createServerClient()
  const sessionProfile = await loadMutationProfile()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const perm = ensureTD(sessionProfile)
  if (perm) return { error: perm }

  const email     = (formData.get('email') as string)?.trim().toLowerCase()
  const full_name = (formData.get('full_name') as string)?.trim()

  if (!email)     return { error: 'Email is required.' }
  if (!full_name) return { error: 'Full name is required.' }

  const profile = buildProfilePayload(formData)

  const admin = createAdminClient()

  // 1. Create the auth user — email_confirm skips verification email
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name },
  })

  if (authError) return { error: authError.message }

  const newUserId = authData.user.id

  // 2. Update the auto-created profile (trigger fires on auth user insert)
  //    profile_completed_at set now — admin-created profiles are considered complete
  const { error: profileError } = await admin
    .from('profiles')
    .update({ ...profile, email, profile_completed_at: new Date().toISOString() })
    .eq('id', newUserId)

  if (profileError) {
    // Best-effort cleanup: remove the orphan auth user
    await admin.auth.admin.deleteUser(newUserId)
    return { error: profileError.message }
  }

  revalidatePath('/team')
  redirect(`/team/${newUserId}`)
}

// ── Fields only admin can set ────────────────────────────────

const ADMIN_ONLY_FIELDS = [
  'system_role',
  'worker_type',
  'active_status',
  'joined_date',
  'rate_type',
  'currency_code',
  'expected_rate',
  'approved_rate',
  'notes_internal',
] as const

// ── Update member ──────────────────────────────────────────────

export async function updateMember(id: string, formData: FormData) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = buildProfilePayload(formData)
  if (!profile.full_name) return { error: 'Full name is required.' }

  const isSelf = user.id === id
  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('system_role')
    .eq('id', user.id)
    .single()
  const callerRole = callerProfile?.system_role ?? 'member'
  const callerCanManageOthers = isTD(callerRole) || isFinance(callerRole)

  if (isSelf && !callerCanManageOthers) {
    for (const field of ADMIN_ONLY_FIELDS) {
      delete (profile as Record<string, unknown>)[field]
    }
  }

  if (!isSelf && !callerCanManageOthers) {
    return { error: 'Only Technical Director or Finance can edit other members.' }
  }

  const admin = createAdminClient()

  if (!isSelf) {
    const { data: targetRow } = await admin.from('profiles').select('system_role').eq('id', id).maybeSingle()
    const targetRole = targetRow?.system_role as SystemRole | null | undefined
    // TD must not change org-tier / pay fields on the Direktur account; Finance may still do so.
    if (isDirektur(targetRole) && isTD(callerRole) && !isFinance(callerRole)) {
      for (const field of ADMIN_ONLY_FIELDS) {
        delete (profile as Record<string, unknown>)[field]
      }
    }
  }

  const { error } = await admin
    .from('profiles')
    .update(profile)
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/team')
  revalidatePath(`/team/${id}`)

  if (isSelf) {
    redirect('/my-profile')
  }
  redirect(`/team/${id}`)
}
