import type { SupabaseClient } from '@supabase/supabase-js'
import type { Project } from '@/types/database'

type ProjectTerminSlice = Pick<
  Project,
  'id' | 'source_type' | 'status' | 'contract_value' | 'contract_currency' | 'has_retention' | 'retention_percentage'
>

/** Creates milestone rows once for approved DOMESTIC projects with a contract value. */
export async function ensureDefaultTerminsForProject(
  supabase: SupabaseClient,
  p: ProjectTerminSlice,
): Promise<{ error?: string }> {
  if (p.source_type !== 'DOMESTIC' || p.status !== 'new') return {}
  if (p.contract_value == null || Number(p.contract_value) <= 0) return {}

  const { count, error: cErr } = await supabase
    .from('project_termins')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', p.id)

  if (cErr) return { error: cErr.message }
  if ((count ?? 0) > 0) return {}

  const { error } = await supabase.rpc('generate_default_termins', {
    p_project_id: p.id,
    p_contract_value: Number(p.contract_value),
    p_currency: p.contract_currency || 'IDR',
    p_has_retention: Boolean(p.has_retention),
    p_retention_pct: Number(p.retention_percentage ?? 5),
  })

  if (error) return { error: error.message }
  return {}
}
