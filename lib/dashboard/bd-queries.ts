/**
 * BD dashboard — pipeline metrics from intakes and outreach.
 */

import { createServerClient } from '@/lib/supabase/server'

function startOfUtcMonth(d: Date): string {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0)).toISOString()
}

export type BDIntakePipelineRow = {
  id: string
  intake_code: string
  title: string
  status: string
  discipline: string
  budget_estimate: number | null
  budget_currency: string
  received_date: string
  clients: { client_name: string } | null
  temp_client_name: string | null
}

export type BDOutreachRow = {
  id: string
  company_name: string
  status: string
  updated_at: string
  contact_channel: string | null
  contact_value: string | null
}

export type BDDashboardData = {
  newLeadsThisMonth: number
  intakesPipelineCount: number
  outreachActiveCount: number
  conversionRatePct: number
  intakePipeline: BDIntakePipelineRow[]
  outreachBoard: BDOutreachRow[]
}

export async function getBDDashboardData(): Promise<BDDashboardData> {
  const supabase = await createServerClient()
  const monthStart = startOfUtcMonth(new Date())

  const [
    newLeads,
    pipelineStatuses,
    outreachAll,
    convertedThisMonth,
    totalIntakesThisMonth,
    intakeRows,
    outreachRows,
  ] = await Promise.all([
    supabase
      .from('intakes')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', monthStart),

    supabase
      .from('intakes')
      .select('*', { count: 'exact', head: true })
      .in('status', ['new', 'awaiting_info', 'qualified']),

    supabase.from('outreach_companies').select('id, status'),

    supabase
      .from('intakes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'converted')
      .gte('updated_at', monthStart),

    supabase.from('intakes').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),

    supabase
      .from('intakes')
      .select(
        'id, intake_code, title, status, discipline, budget_estimate, budget_currency, received_date, clients(client_name), temp_client_name',
      )
      .in('status', ['new', 'awaiting_info', 'qualified'])
      .order('received_date', { ascending: false })
      .limit(25),

    supabase
      .from('outreach_companies')
      .select('id, company_name, status, updated_at, contact_channel, contact_value')
      .order('updated_at', { ascending: false })
      .limit(30),
  ])

  const outreachActive = (outreachAll.data ?? []).filter(
    (r) => r.status && !['declined', 'converted'].includes(String(r.status)),
  ).length

  const totalMonth = totalIntakesThisMonth.count ?? 0
  const converted = convertedThisMonth.count ?? 0
  const conversionRatePct = totalMonth > 0 ? Math.round((converted / totalMonth) * 1000) / 10 : 0

  const outreachBoard = ((outreachRows.data ?? []) as unknown as BDOutreachRow[]).filter(
    (r) => r.status && !['declined', 'converted'].includes(String(r.status)),
  )

  return {
    newLeadsThisMonth: newLeads.count ?? 0,
    intakesPipelineCount: pipelineStatuses.count ?? 0,
    outreachActiveCount: outreachActive,
    conversionRatePct,
    intakePipeline: (intakeRows.data ?? []) as unknown as BDIntakePipelineRow[],
    outreachBoard,
  }
}
