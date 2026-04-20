import { createServerClient } from '@/lib/supabase/server'

export type MemberOption = { id: string; full_name: string }
export type ProjectOption = { id: string; name: string }

export function moneyInt(n: number): number {
  return Math.round(Number.isFinite(n) ? n : 0)
}

export function buildCompensationPayload(formData: FormData) {
  const qty = parseFloat(formData.get('qty') as string) || 1
  const rate_amount = moneyInt(parseFloat(formData.get('rate_amount') as string) || 0)
  const subtotal_amount = moneyInt(qty * rate_amount)

  return {
    member_id: formData.get('member_id') as string,
    project_id: formData.get('project_id') as string,
    task_id: (formData.get('task_id') as string) || null,
    deliverable_id: (formData.get('deliverable_id') as string) || null,
    rate_type: formData.get('rate_type') as string,
    qty,
    rate_amount,
    subtotal_amount,
    currency_code: (formData.get('currency_code') as string) || 'IDR',
    status: (formData.get('status') as string) || 'draft',
    period_label: (formData.get('period_label') as string)?.trim() || null,
    work_date: (formData.get('work_date') as string) || null,
    notes: (formData.get('notes') as string)?.trim() || null,
  }
}

export async function getMemberOptions(): Promise<MemberOption[]> {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('active_status', 'active')
    .order('full_name')

  return (data ?? []) as MemberOption[]
}

export async function getProjectOptions(): Promise<ProjectOption[]> {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('projects')
    .select('id, name')
    .order('name')

  return (data ?? []) as ProjectOption[]
}
