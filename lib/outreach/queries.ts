import { createServerClient } from '@/lib/supabase/server'
import type { OutreachCompany } from '@/types/database'

export type OutreachWithIntake = OutreachCompany & {
  intakes: { intake_code: string; title: string } | null
}

interface GetOutreachOptions {
  search?: string
  status?: string
  channel?: string
}

export async function getOutreachCompanies(opts: GetOutreachOptions = {}): Promise<OutreachWithIntake[]> {
  const supabase = await createServerClient()
  let query = supabase
    .from('outreach_companies')
    .select('*, intakes(intake_code, title)')
    .order('created_at', { ascending: false })

  if (opts.search) {
    query = query.ilike('company_name', `%${opts.search}%`)
  }
  if (opts.status) query = query.eq('status', opts.status)
  if (opts.channel) query = query.eq('contact_channel', opts.channel)

  const { data } = await query
  return (data as OutreachWithIntake[]) ?? []
}

export async function getOutreachById(id: string): Promise<OutreachWithIntake | null> {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('outreach_companies')
    .select('*, intakes(intake_code, title)')
    .eq('id', id)
    .single()
  return (data as OutreachWithIntake) ?? null
}
