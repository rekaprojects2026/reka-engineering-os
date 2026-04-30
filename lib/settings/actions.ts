'use server'

/**
 * lib/settings/actions.ts
 * Admin-guarded server actions for managing setting_options rows.
 */

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getSessionProfile, requireRole } from '@/lib/auth/session'
import { loadMutationProfile, MUTATION_FORBIDDEN } from '@/lib/auth/mutation-policy'
import { isDirektur, isTD } from '@/lib/auth/permissions'
import type { FileNamingConfig } from '@/lib/files/naming'
import type { SettingDomain } from './domains'

const FILE_NAMING_KEYS = [
  'project_prefix',
  'separator',
  'revision_format',
  'discipline_codes',
  'doc_type_codes',
] as const satisfies readonly (keyof FileNamingConfig)[]

// ── Helpers ──────────────────────────────────────────────────

async function adminGuard() {
  const profile = await getSessionProfile()
  requireRole(profile.system_role, ['technical_director'])
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
  revalidateTag('dashboard')
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
  revalidateTag('dashboard')
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
  revalidateTag('dashboard')
  return { error: null }
}

const FILE_NAMING_KEY_SET = new Set<string>(FILE_NAMING_KEYS)

export async function updateFileNamingConfig(
  updates: Partial<FileNamingConfig>,
): Promise<{ error?: string }> {
  const profile = await loadMutationProfile()
  if (!isTD(profile.system_role)) return { error: MUTATION_FORBIDDEN }

  const supabase = await createServerClient()

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) continue
    if (!FILE_NAMING_KEY_SET.has(key)) continue

    const { error } = await supabase
      .from('file_naming_config')
      .update({
        config_value: value,
        updated_by: profile.id,
        updated_at: new Date().toISOString(),
      })
      .eq('config_key', key)

    if (error) return { error: error.message }
  }

  revalidatePath('/settings', 'page')
  revalidatePath('/files', 'page')
  revalidateTag('dashboard')
  return {}
}

export async function saveDriveRootFolderName(formData: FormData): Promise<void> {
  const profile = await loadMutationProfile()
  if (!isTD(profile.system_role) && !isDirektur(profile.system_role)) {
    redirect(`/settings?tab=finance&drive_error=${encodeURIComponent('Only Technical Director or Direktur can update this setting.')}`)
  }
  const name = (formData.get('drive_root_folder_name') as string)?.trim()
  if (!name) {
    redirect(`/settings?tab=finance&drive_error=${encodeURIComponent('Root folder name is required.')}`)
  }

  const supabase = await createServerClient()
  const { error } = await supabase
    .from('file_naming_config')
    .update({
      config_value: name,
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    })
    .eq('config_key', 'drive_root_folder_name')

  if (error) {
    redirect(`/settings?tab=finance&drive_error=${encodeURIComponent(error.message)}`)
  }
  revalidatePath('/settings', 'page')
  redirect('/settings?tab=finance&drive_root_saved=1')
}

export async function saveProjectPrefixSettings(formData: FormData): Promise<void> {
  await adminGuard()
  const project_prefix = (formData.get('project_prefix') as string)?.trim()
  const separator = (formData.get('separator') as string)?.trim()
  if (!project_prefix) {
    redirect(`/settings?tab=system&prefix_err=${encodeURIComponent('Project prefix is required.')}`)
  }
  const res = await updateFileNamingConfig({
    project_prefix,
    separator: separator && separator.length > 0 ? separator : '-',
  })
  if (res.error) {
    redirect(`/settings?tab=system&prefix_err=${encodeURIComponent(res.error)}`)
  }
  redirect('/settings?tab=system&saved=1')
}
