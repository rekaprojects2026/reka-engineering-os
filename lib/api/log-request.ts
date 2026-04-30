import { createAdminClient } from '@/lib/supabase/admin'

export async function logApiRequest(params: {
  apiKeyId: string | null
  method: string
  path: string
  statusCode: number
  ipAddress: string | null
}): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('api_request_logs').insert({
    api_key_id: params.apiKeyId,
    method: params.method,
    path: params.path,
    status_code: params.statusCode,
    ip_address: params.ipAddress,
  })
  if (error) console.error('[api_request_logs]', error.message)
}
