import { validateApiKey } from '@/lib/api/auth'
import { logApiRequest } from '@/lib/api/log-request'
import { apiForbidden, apiUnauthorized } from '@/lib/api/response'
import type { ApiKeyScope } from '@/lib/api/scopes'

function clientIp(request: Request): string | null {
  const xf = request.headers.get('x-forwarded-for')
  if (xf) return xf.split(',')[0]?.trim() ?? null
  return request.headers.get('x-real-ip')
}

export async function withApiKeyAuth(
  request: Request,
  scope: ApiKeyScope,
  handler: (ctx: { keyId: string }) => Promise<Response>,
): Promise<Response> {
  const path = new URL(request.url).pathname
  const method = request.method
  const ip = clientIp(request)

  const auth = await validateApiKey(request.headers.get('Authorization'))
  if (!auth.valid) {
    const res = apiUnauthorized()
    void logApiRequest({
      apiKeyId: null,
      method,
      path,
      statusCode: res.status,
      ipAddress: ip,
    })
    return res
  }

  if (!auth.scopes.includes(scope)) {
    const res = apiForbidden()
    void logApiRequest({
      apiKeyId: auth.keyId,
      method,
      path,
      statusCode: res.status,
      ipAddress: ip,
    })
    return res
  }

  const res = await handler({ keyId: auth.keyId })
  void logApiRequest({
    apiKeyId: auth.keyId,
    method,
    path,
    statusCode: res.status,
    ipAddress: ip,
  })
  return res
}
