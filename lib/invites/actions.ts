'use server'

import { revalidatePath } from 'next/cache'
import { redirect }       from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient }  from '@/lib/supabase/admin'
import { AVAILABILITY_STATUS_OPTIONS } from '@/lib/constants/options'
import { loadMutationProfile, ensureTD } from '@/lib/auth/mutation-policy'
import { isOwner } from '@/lib/auth/permissions'
import { sendInviteEmail } from '@/lib/email/send-invite'
import type { SystemRole } from '@/types/database'

const RESTRICTED_INVITE_ROLES: SystemRole[] = ['owner']

// ── Create invite (admin) ─────────────────────────────────────

export async function createInvite(formData: FormData) {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const perm = ensureTD(profile)
  if (perm) return { error: perm }

  const email     = (formData.get('email') as string)?.trim().toLowerCase()
  const full_name = (formData.get('full_name') as string)?.trim() || null
  const system_role = ((formData.get('system_role') as string) || '').trim() || null
  const worker_type = (formData.get('worker_type') as string) || null

  if (!email) return { error: 'Email is required.' }
  if (system_role && RESTRICTED_INVITE_ROLES.includes(system_role as SystemRole)) {
    return { error: 'Owner role must be assigned manually via Supabase.' }
  }
  if (system_role === 'direktur' && !isOwner(profile.system_role)) {
    return { error: 'Only owner can invite Direktur.' }
  }

  const admin = createAdminClient()

  // Prevent duplicate pending invites for the same email
  const { data: existing } = await admin
    .from('invites')
    .select('id')
    .eq('email', email)
    .eq('status', 'pending')
    .maybeSingle()

  if (existing) return { error: 'A pending invite already exists for this email.' }

  const { data, error } = await admin
    .from('invites')
    .insert({
      email,
      full_name,
      system_role,
      worker_type,
      invited_by: user.id,
    })
    .select('token, expires_at')
    .single()

  if (error) return { error: error.message }

  if (
    !data ||
    typeof data.token !== 'string' ||
    typeof data.expires_at !== 'string'
  ) {
    return { error: 'Failed to create invite.' }
  }

  // Look up inviter's name for the email
  const { data: inviterProfile } = await admin
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle()

  const inviterName = inviterProfile?.full_name ?? 'Tim ReKa'

  // Await so the send finishes on serverless (Vercel).
  const { ok: emailSent } = await sendInviteEmail({
    toEmail: email,
    recipientName: full_name,
    inviterName,
    token: data.token,
    expiresAt: data.expires_at,
  })

  revalidatePath('/team')
  const emailQs = emailSent ? '' : '&emailFailed=1'
  redirect(`/team?invited=${data.token}${emailQs}`)
}

// ── Revoke invite (admin) ─────────────────────────────────────

export async function revokeInvite(id: string) {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const perm = ensureTD(profile)
  if (perm) return { error: perm }

  const admin = createAdminClient()
  const { error } = await admin
    .from('invites')
    .update({ status: 'revoked' })
    .eq('id', id)
    .eq('status', 'pending')

  if (error) return { error: error.message }

  revalidatePath('/team')
}

// ── Activate invite (public — called from onboarding page) ────

export async function activateInvite(token: string, formData: FormData) {
  const full_name       = (formData.get('full_name') as string)?.trim()
  const password        = formData.get('password') as string
  const confirm         = formData.get('confirm_password') as string

  if (!full_name)                    return { error: 'Full name is required.' }
  if (!password || password.length < 8)
    return { error: 'Password must be at least 8 characters.' }
  if (password !== confirm)          return { error: 'Passwords do not match.' }

  const admin = createAdminClient()

  // Fetch and validate invite
  const { data: invite, error: inviteError } = await admin
    .from('invites')
    .select('*')
    .eq('token', token)
    .eq('status', 'pending')
    .single()

  if (inviteError || !invite) return { error: 'This invite link is invalid or has already been used.' }

  if (new Date(invite.expires_at) < new Date()) {
    await admin.from('invites').update({ status: 'expired' }).eq('id', invite.id)
    return { error: 'This invite has expired. Contact your admin for a new one.' }
  }

  // Create auth user (email_confirm: true skips verification email)
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email:         invite.email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  })

  if (authError) return { error: authError.message }

  const userId = authData.user.id

  // Update the auto-created profile with invite-provided fields
  // profile_completed_at intentionally left null — user will complete it
  const { error: profileError } = await admin
    .from('profiles')
    .update({
      full_name,
      email:       invite.email,
      system_role: invite.system_role ?? null,
      worker_type: invite.worker_type ?? null,
      // active_status and approved_rate remain at admin defaults
    })
    .eq('id', userId)

  if (profileError) {
    // Best-effort cleanup
    await admin.auth.admin.deleteUser(userId)
    return { error: 'Failed to create profile. Please try again.' }
  }

  // Mark invite accepted
  await admin
    .from('invites')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', invite.id)

  redirect('/auth/login?activated=1')
}

// ── Complete own profile (authenticated user) ─────────────────
// Only updates self-editable fields. Admin-controlled fields are not touched.

export async function completeProfile(formData: FormData) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const rawSkills = (formData.get('skill_tags') as string)?.trim() ?? ''
  const skillTags = rawSkills
    ? rawSkills.split(',').map((s) => s.trim()).filter(Boolean)
    : []

  const rawRate = parseFloat(formData.get('expected_rate') as string)

  const payload = {
    full_name:            (formData.get('full_name') as string)?.trim()          || undefined,
    phone:                (formData.get('phone') as string)?.trim()              || null,
    city:                 (formData.get('city') as string)?.trim()               || null,
    portfolio_link:       (formData.get('portfolio_link') as string)?.trim()     || null,
    skill_tags:           skillTags,
    availability_status:  (formData.get('availability_status') as string)        || 'available',
    expected_rate:        isNaN(rawRate) ? null : rawRate,
    bank_name:            (formData.get('bank_name') as string)?.trim()          || null,
    bank_account_name:    (formData.get('bank_account_name') as string)?.trim()  || null,
    bank_account_number:  (formData.get('bank_account_number') as string)?.trim()|| null,
    ewallet_type:         (formData.get('ewallet_type') as string)?.trim()       || null,
    ewallet_number:       (formData.get('ewallet_number') as string)?.trim()     || null,
    profile_completed_at: new Date().toISOString(),
  }

  // Validate availability value
  const validAvailability = AVAILABILITY_STATUS_OPTIONS.map((o) => o.value)
  if (!validAvailability.includes(payload.availability_status as never)) {
    payload.availability_status = 'available'
  }

  // Session-based client — RLS enforces user can only update own profile
  const { error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/my-profile')
  revalidatePath('/team')
  redirect('/dashboard')
}
