// Server-side query helpers for the Intakes module
import { createServerClient } from '@/lib/supabase/server'
import type { Intake } from '@/types/database'

export type IntakeWithClient = Intake & {
  clients: { id: string; client_name: string; client_code: string } | null
  converted_project: { id: string; project_code: string; name: string } | null
}

export async function getIntakes(opts?: {
  search?: string
  status?: string
  source?: string
  discipline?: string
}): Promise<IntakeWithClient[]> {
  const supabase = await createServerClient()

  let query = supabase
    .from('intakes')
    .select('*, clients(id, client_name, client_code), converted_project:projects!intakes_converted_project_id_fk(id, project_code, name)')
    .order('received_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (opts?.status && opts.status !== 'all') {
    query = query.eq('status', opts.status)
  }
  if (opts?.source && opts.source !== 'all') {
    query = query.eq('source', opts.source)
  }
  if (opts?.discipline && opts.discipline !== 'all') {
    query = query.eq('discipline', opts.discipline)
  }
  if (opts?.search) {
    query = query.or(
      `title.ilike.%${opts.search}%,temp_client_name.ilike.%${opts.search}%,intake_code.ilike.%${opts.search}%`
    )
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as IntakeWithClient[]
}

export async function getIntakeById(id: string): Promise<IntakeWithClient | null> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('intakes')
    .select('*, clients(id, client_name, client_code), converted_project:projects!intakes_converted_project_id_fk(id, project_code, name)')
    .eq('id', id)
    .single()

  if (error) return null
  return data as unknown as IntakeWithClient
}

export async function getIntakesByClientId(clientId: string): Promise<Intake[]> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('intakes')
    .select('*')
    .eq('client_id', clientId)
    .order('received_date', { ascending: false })

  if (error) return []
  return (data ?? []) as Intake[]
}
