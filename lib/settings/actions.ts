'use server'

/**
 * lib/settings/actions.ts
 * Admin-guarded server actions for managing setting_options rows.
 */

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { getSessionProfile, requireRole } from '@/lib/auth/session'
import type { SettingDomain } from './domains'

// ── Helpers ──────────────────────────────────────────────────

async function adminGuard() {
  const profile = await getSessionProfile()
  requireRole(profile.system_role, ['admin'])
  return profile
}

// ── Actions ──────────────────────────────────────────────────

export async function upsertSettingOption(formData: FormData) {
  await adminGuard()

  const id       = formData.get('id') as string | null
  const domain   = formData.get('domain') as SettingDomain
  const value    = (formData.get('value') as string).trim()
  const label    = (formData.get('label') as string).trim()
  const sortRaw  = formData.get('sort_order') as string
  const sort_order = sortRaw ? parseInt(sortRaw, 10) : 0
  const is_active  = formData.get('is_active') !== 'false'

  if (!domain || !value || !label) {
    return { error: 'Domain, value, and label are required.' }
  }

  const supabase = await createServerClient()

  if (id) {
    const { error } = await supabase
      .from('setting_options')
      .update({ value, label, sort_order, is_active })
      .eq('id', id)

    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('setting_options')
      .insert({ domain, value, label, sort_order, is_active })

    if (error) return { error: error.message }
  }

  revalidatePath('/settings', 'page')
  return { error: null }
}

export async function deleteSettingOption(id: string) {
  await adminGuard()

  const supabase = await createServerClient()
  const { error } = await supabase
    .from('setting_options')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/settings', 'page')
  return { error: null }
}

export async function toggleSettingOption(id: string, is_active: boolean) {
  await adminGuard()

  const supabase = await createServerClient()
  const { error } = await supabase
    .from('setting_options')
    .update({ is_active })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/settings', 'page')
  return { error: null }
}
