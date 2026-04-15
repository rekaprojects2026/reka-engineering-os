// Server-side query helpers for the Clients module
import { createServerClient } from '@/lib/supabase/server'
import type { Client } from '@/types/database'

export async function getClients(opts?: {
  search?: string
  status?: string
  source?: string
}): Promise<Client[]> {
  const supabase = await createServerClient()

  let query = supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })

  if (opts?.status && opts.status !== 'all') {
    query = query.eq('status', opts.status)
  }
  if (opts?.source && opts.source !== 'all') {
    query = query.eq('source_default', opts.source)
  }
  if (opts?.search) {
    query = query.or(
      `client_name.ilike.%${opts.search}%,primary_contact_name.ilike.%${opts.search}%,client_code.ilike.%${opts.search}%`
    )
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as Client[]
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
