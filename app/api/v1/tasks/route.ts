import { createAdminClient } from '@/lib/supabase/admin'
import { apiError, apiSuccess } from '@/lib/api/response'
import { withApiKeyAuth } from '@/lib/api/with-auth'

export async function GET(request: Request) {
  return withApiKeyAuth(request, 'tasks:read', async () => {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('project_id')
    if (!projectId) {
      return apiError('project_id query parameter is required', 400, 'BAD_REQUEST')
    }

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)), 100)

    const supabase = createAdminClient()
    const { data, error, count } = await supabase
      .from('tasks')
      .select(
        'id, project_id, title, status, priority, due_date, completed_date, assigned_to_user_id, created_at',
        { count: 'exact' },
      )
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (error) return apiError(error.message, 500, 'DATABASE_ERROR')

    return apiSuccess(data ?? [], { total: count ?? 0, page, limit })
  })
}
