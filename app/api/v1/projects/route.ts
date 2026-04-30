import { createAdminClient } from '@/lib/supabase/admin'
import { apiError, apiSuccess } from '@/lib/api/response'
import { withApiKeyAuth } from '@/lib/api/with-auth'

export async function GET(request: Request) {
  return withApiKeyAuth(request, 'projects:read', async () => {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)), 100)
    const status = searchParams.get('status')

    const supabase = createAdminClient()
    let query = supabase
      .from('projects')
      .select(
        'id, project_code, name, status, start_date, target_due_date, client_id, created_at',
        { count: 'exact' },
      )
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (status) query = query.eq('status', status)

    const { data, error, count } = await query
    if (error) return apiError(error.message, 500, 'DATABASE_ERROR')

    return apiSuccess(data ?? [], { total: count ?? 0, page, limit })
  })
}
