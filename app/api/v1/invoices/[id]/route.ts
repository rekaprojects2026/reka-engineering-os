import { createAdminClient } from '@/lib/supabase/admin'
import { apiError, apiNotFound, apiSuccess } from '@/lib/api/response'
import { withApiKeyAuth } from '@/lib/api/with-auth'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params
  return withApiKeyAuth(request, 'invoices:read', async () => {
    const supabase = createAdminClient()
    const { data, error } = await supabase.from('client_invoices').select('*').eq('id', id).maybeSingle()

    if (error) return apiError(error.message, 500, 'DATABASE_ERROR')
    if (!data) return apiNotFound('Invoice')

    return apiSuccess(data)
  })
}
