import { createServerClient } from '@/lib/supabase/server'

export type ProjectPhase = {
  id: string
  project_id: string
  name: string
  description: string | null
  start_date: string | null
  end_date: string | null
  status: 'active' | 'completed' | 'on_hold'
  sort_order: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export async function getProjectPhases(projectId: string): Promise<ProjectPhase[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('project_phases')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as ProjectPhase[]
}

export async function getPhaseById(id: string): Promise<ProjectPhase | null> {
  const supabase = await createServerClient()
  const { data, error } = await supabase.from('project_phases').select('*').eq('id', id).maybeSingle()

  if (error || !data) return null
  return data as ProjectPhase
}
