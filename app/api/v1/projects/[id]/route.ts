import { createAdminClient } from '@/lib/supabase/admin'
import { apiError, apiNotFound, apiSuccess } from '@/lib/api/response'
import { withApiKeyAuth } from '@/lib/api/with-auth'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params
  return withApiKeyAuth(request, 'projects:read', async () => {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('projects')
      .select(
        'id, project_code, name, status, start_date, target_due_date, actual_completion_date, client_id, project_lead_user_id, priority, scope_summary, created_at, updated_at',
      )
      .eq('id', id)
      .maybeSingle()

    if (error) return apiError(error.message, 500, 'DATABASE_ERROR')
    if (!data) return apiNotFound('Project')

    return apiSuccess(data)
  })
}
