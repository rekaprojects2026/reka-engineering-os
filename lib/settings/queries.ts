/**
 * lib/settings/queries.ts
 * Server-side queries for the setting_options table.
 * Falls back to hardcoded arrays when the DB has no rows for a domain.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase/server'
import { type SettingDomain, DOMAIN_FALLBACKS, DOMAIN_LABELS, SETTING_DOMAINS } from './domains'
import { DEFAULT_FILE_NAMING, type FileNamingConfig } from '@/lib/files/naming'

export interface SettingOption {
  id: string
  domain: string
  value: string
  label: string
  sort_order: number
  is_active: boolean
  created_at: string
}

/**
 * Returns active options for a given domain.
 * If no rows exist in DB, returns the hardcoded fallback.
 */
export async function getSettingOptions(
  domain: SettingDomain,
  existingClient?: SupabaseClient,
): Promise<{ value: string; label: string }[]> {
  const supabase = existingClient ?? (await createServerClient())
  const { data, error } = await supabase
    .from('setting_options')
    .select('value, label')
    .eq('domain', domain)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error || !data || data.length === 0) {
    return DOMAIN_FALLBACKS[domain] ?? []
  }

  return data
}

/**
 * Returns ALL options (including inactive) for admin management.
 */
export async function getSettingOptionsFull(
  domain: SettingDomain,
): Promise<SettingOption[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('setting_options')
    .select('*')
    .eq('domain', domain)
    .order('sort_order', { ascending: true })

  if (error || !data) return []
  return data as unknown as SettingOption[]
}

/**
 * Returns all distinct domains currently stored in the DB.
 */
export async function getStoredDomains(): Promise<string[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('setting_options')
    .select('domain')

  if (error || !data) return []

  const unique = [...new Set(data.map((r: { domain: string }) => r.domain))]
  return unique.sort()
}

export interface WorkloadThresholds {
  lowMax: number
  normalMax: number
  highMax: number
}

/** Upper bounds for open-task counts: &lt; lowMax → Low, etc. Defaults 3/8/13. */
export async function getWorkloadThresholds(existingClient?: SupabaseClient): Promise<WorkloadThresholds> {
  const opts = await getSettingOptions('workload_thresholds', existingClient)
  const nums = opts
    .map((o) => Number(o.value))
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b)
  if (nums.length >= 3) {
    return { lowMax: nums[0]!, normalMax: nums[1]!, highMax: nums[2]! }
  }
  return { lowMax: 3, normalMax: 8, highMax: 13 }
}

/**
 * Returns the canonical list of domains (from code), enriched with
 * a count of DB rows per domain.
 */
export async function getDomainSummary(): Promise<
  { domain: SettingDomain; label: string; count: number }[]
> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('setting_options')
    .select('domain')

  const countMap: Record<string, number> = {}
  if (!error && data) {
    for (const row of data) {
      countMap[row.domain] = (countMap[row.domain] ?? 0) + 1
    }
  }

  return SETTING_DOMAINS.map((d) => ({
    domain: d,
    label: DOMAIN_LABELS[d],
    count: countMap[d] ?? 0,
  }))
}

/** Row-backed file naming parameters (used by Settings + file upload). */
const DEFAULT_DRIVE_ROOT = 'Projects'

/** Parent folder name under My Drive for auto-created project hierarchies. */
export async function getDriveRootFolderName(existingClient?: SupabaseClient): Promise<string> {
  const supabase = existingClient ?? (await createServerClient())
  const { data, error } = await supabase
    .from('file_naming_config')
    .select('config_value')
    .eq('config_key', 'drive_root_folder_name')
    .maybeSingle()

  if (error || !data?.config_value?.trim()) return DEFAULT_DRIVE_ROOT
  return data.config_value.trim()
}

export async function isGoogleWorkspaceDriveConnected(existingClient?: SupabaseClient): Promise<boolean> {
  const supabase = existingClient ?? (await createServerClient())
  const { data } = await supabase
    .from('google_workspace_tokens')
    .select('refresh_token')
    .eq('id', 'default')
    .maybeSingle()
  return Boolean(data?.refresh_token)
}

export async function getFileNamingConfig(): Promise<FileNamingConfig> {
  const supabase = await createServerClient()
  const { data, error } = await supabase.from('file_naming_config').select('config_key, config_value')

  if (error || !data?.length) {
    return { ...DEFAULT_FILE_NAMING }
  }

  const map: Record<string, string> = {}
  for (const row of data as { config_key: string; config_value: string }[]) {
    map[row.config_key] = row.config_value
  }

  return {
    project_prefix: map.project_prefix ?? DEFAULT_FILE_NAMING.project_prefix,
    separator: map.separator ?? DEFAULT_FILE_NAMING.separator,
    revision_format: map.revision_format ?? DEFAULT_FILE_NAMING.revision_format,
    discipline_codes: map.discipline_codes ?? DEFAULT_FILE_NAMING.discipline_codes,
    doc_type_codes: map.doc_type_codes ?? DEFAULT_FILE_NAMING.doc_type_codes,
  }
}
