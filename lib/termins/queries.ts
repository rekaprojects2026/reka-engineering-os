import { createServerClient } from '@/lib/supabase/server'
import type { ProjectTermin } from '@/types/database'

export async function getTerminsByProject(projectId: string): Promise<ProjectTermin[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('project_termins')
    .select('*')
    .eq('project_id', projectId)
    .order('termin_number', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as ProjectTermin[]
}

export async function getTerminById(id: string): Promise<ProjectTermin | null> {
  const supabase = await createServerClient()
  const { data, error } = await supabase.from('project_termins').select('*').eq('id', id).single()
  if (error) return null
  return data as ProjectTermin
}
