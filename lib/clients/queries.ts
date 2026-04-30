// Server-side query helpers for the Clients module
import { createServerClient } from '@/lib/supabase/server'
import { getAssignedProjectIdsForUser } from '@/lib/projects/queries'
import type { Client } from '@/types/database'

export interface GetClientsResult {
  rows: Client[]
  count: number
}

export async function getClients(opts?: {
  search?: string
  status?: string
  source?: string
  page?: number
  pageSize?: number
}): Promise<GetClientsResult> {
  const supabase = await createServerClient()

  const paginate = opts?.page != null && opts?.pageSize != null
  const page = opts?.page ?? 1
  const pageSize = opts?.pageSize ?? 50
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('clients')
    .select('*', paginate ? { count: 'exact' } : undefined)
    .order('created_at', { ascending: false })

  if (opts?.status && opts.status !== 'all') {
    query = query.eq('status', opts.status)
  }
  if (opts?.source && opts.source !== 'all') {
    query = query.eq('source_default', opts.source)
  }
  if (opts?.search) {
    query = query.or(
      `client_name.ilike.%${opts.search}%,primary_contact_name.ilike.%${opts.search}%,client_code.ilike.%${opts.search}%`,
    )
  }

  if (paginate) {
    query = query.range(from, to)
  }

  const { data, error, count } = await query
  if (error) throw new Error(error.message)
  const rows = (data ?? []) as Client[]
  return { rows, count: paginate ? count ?? 0 : rows.length }
}

export async function getClientsForSelect(): Promise<{ id: string; client_name: string; client_code: string }[]> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('clients')
    .select('id, client_name, client_code')
    .in('status', ['lead', 'active'])
    .order('client_name', { ascending: true })

  if (error) return []
  return data ?? []
}

/** Clients linked to projects the coordinator is assigned to (project edit / scoped ops). */
export async function getClientsForCoordinatorScopedSelect(
  coordinatorUserId: string,
): Promise<{ id: string; client_name: string; client_code: string }[]> {
  const projectIds = await getAssignedProjectIdsForUser(coordinatorUserId)
  if (projectIds.length === 0) return []

  const supabase = await createServerClient()
  const { data: projects, error: pe } = await supabase
    .from('projects')
    .select('client_id')
    .in('id', projectIds)

  if (pe || !projects?.length) return []

  const clientIds = [...new Set(projects.map((p) => p.client_id).filter(Boolean))] as string[]
  if (clientIds.length === 0) return []

  const { data, error } = await supabase
    .from('clients')
    .select('id, client_name, client_code')
    .in('id', clientIds)
    .in('status', ['lead', 'active'])
    .order('client_name', { ascending: true })

  if (error) return []
  return data ?? []
}

export async function getClientById(id: string): Promise<Client | null> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data as Client
}
