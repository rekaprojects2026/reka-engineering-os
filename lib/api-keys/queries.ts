import { createServerClient } from '@/lib/supabase/server'
import type { ApiKey } from '@/types/database'

export type ApiKeyListRow = Pick<
  ApiKey,
  'id' | 'name' | 'key_prefix' | 'created_by' | 'last_used_at' | 'expires_at' | 'is_active' | 'scopes' | 'created_at'
>

export async function listApiKeys(): Promise<ApiKeyListRow[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('api_keys')
    .select('id, name, key_prefix, created_by, last_used_at, expires_at, is_active, scopes, created_at')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as ApiKeyListRow[]
}
