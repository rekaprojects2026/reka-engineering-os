'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { generateApiKey } from '@/lib/api/auth'
import { isApiKeyScope } from '@/lib/api/scopes'
import { loadMutationProfile, ensureDirekturMutation } from '@/lib/auth/mutation-policy'

export async function createApiKey(formData: FormData): Promise<{ error: string } | { rawKey: string }> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await loadMutationProfile()
  const perm = ensureDirekturMutation(profile)
  if (perm) return { error: perm }

  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: 'Name is required.' }

  const scopeValues = formData.getAll('scope').map((v) => String(v))
  const scopes = scopeValues.filter(isApiKeyScope)
  if (scopes.length === 0) return { error: 'Select at least one scope.' }

  const { raw, hash, prefix } = generateApiKey()

  const { error } = await supabase.from('api_keys').insert({
    name,
    key_hash: hash,
    key_prefix: prefix,
    created_by: user.id,
    scopes,
    is_active: true,
  })

  if (error) return { error: error.message }

  revalidatePath('/settings/api-keys')
  return { rawKey: raw }
}

export async function setApiKeyActive(id: string, isActive: boolean): Promise<{ error: string } | { ok: true }> {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  const perm = ensureDirekturMutation(profile)
  if (perm) return { error: perm }

  const { error } = await supabase.from('api_keys').update({ is_active: isActive }).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/settings/api-keys')
  return { ok: true }
}

export async function deleteApiKey(id: string): Promise<{ error: string } | { ok: true }> {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  const perm = ensureDirekturMutation(profile)
  if (perm) return { error: perm }

  const { error } = await supabase.from('api_keys').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/settings/api-keys')
  return { ok: true }
}
