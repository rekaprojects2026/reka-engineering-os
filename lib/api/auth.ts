import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

export type ApiKeyValidationResult =
  | { valid: true; keyId: string; scopes: string[] }
  | { valid: false; error: string }

/**
 * Validate API key from Authorization header.
 * Format: `Bearer rek_...`
 */
export async function validateApiKey(authHeader: string | null): Promise<ApiKeyValidationResult> {
  if (!authHeader?.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing or invalid Authorization header' }
  }

  const rawKey = authHeader.slice(7).trim()
  if (!rawKey.startsWith('rek_')) {
    return { valid: false, error: 'Invalid API key format' }
  }

  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')

  const supabase = createAdminClient()
  const { data: apiKey, error } = await supabase
    .from('api_keys')
    .select('id, is_active, expires_at, scopes')
    .eq('key_hash', keyHash)
    .maybeSingle()

  if (error) return { valid: false, error: 'Invalid API key' }
  if (!apiKey) return { valid: false, error: 'Invalid API key' }
  if (!apiKey.is_active) return { valid: false, error: 'API key is disabled' }
  if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
    return { valid: false, error: 'API key has expired' }
  }

  const scopes = Array.isArray(apiKey.scopes) ? apiKey.scopes : []

  void supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', apiKey.id)

  return { valid: true, keyId: apiKey.id, scopes }
}

export function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const random = crypto.randomBytes(32).toString('hex')
  const raw = `rek_${random}`
  const hash = crypto.createHash('sha256').update(raw).digest('hex')
  const prefix = raw.slice(0, 12)
  return { raw, hash, prefix }
}
