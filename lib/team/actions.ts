'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ── Shared profile payload builder ────────────────────────────

function buildProfilePayload(formData: FormData) {
  const rawRate = (v: string) => {
    const n = parseFloat(v)
    return isNaN(n) || v.trim() === '' ? null : n
  }

  return {
    full_name:           (formData.get('full_name') as string).trim(),
    phone:               (formData.get('phone') as string)?.trim()            || null,
    system_role:         (formData.get('system_role') as string)              || null,
    functional_role:     (formData.get('functional_role') as string)?.trim()  || null,
    discipline:          (formData.get('discipline') as string)               || null,
    worker_type:         (formData.get('worker_type') as string)              || null,
    active_status:       (formData.get('active_status') as string)            || 'active',
    availability_status: (formData.get('availability_status') as string)      || 'available',
    joined_date:         (formData.get('joined_date') as string)              || null,
    expected_rate:       rawRate(formData.get('expected_rate') as string),
    approved_rate:       rawRate(formData.get('approved_rate') as string),
    rate_type:           (formData.get('rate_type') as string)                || null,
    currency_code:       (formData.get('currency_code') as string)            || 'IDR',
    city:                (formData.get('city') as string)?.trim()             || null,
    portfolio_link:      (formData.get('portfolio_link') as string)?.trim()   || null,
    notes_internal:      (formData.get('notes_internal') as string)?.trim()   || null,
  }
}

// ── Create member ──────────────────────────────────────────────
// Creates auth user (admin API) then updates the auto-created profile.

export async function createMember(formData: FormData) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

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

// ── Update member ──────────────────────────────────────────────

export async function updateMember(id: string, formData: FormData) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = buildProfilePayload(formData)
  if (!profile.full_name) return { error: 'Full name is required.' }

  // Use admin client to bypass RLS for cross-user updates
  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update(profile)
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/team')
  revalidatePath(`/team/${id}`)
  redirect(`/team/${id}`)
}
