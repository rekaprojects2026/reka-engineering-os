import Decimal from 'decimal.js'
import { createServerClient } from '@/lib/supabase/server'
import type { SessionProfile } from '@/lib/auth/session'
import { isManajer } from '@/lib/auth/permissions'

export type MemberOption = { id: string; full_name: string }
export type ProjectOption = { id: string; name: string }

/** Project statuses eligible for new compensation lines (excludes completed / cancelled / stale pipeline). */
export const ACTIVE_COMPENSATION_PROJECT_STATUSES = [
  'new',
  'ready_to_start',
  'ongoing',
  'internal_review',
  'in_revision',
  'waiting_client',
] as const

/**
 * Multiply qty × rate dan bulatkan ke integer (satuan terkecil — rupiah).
 * Gunakan untuk kalkulasi monetary di compensation / invoice line items agar konsisten dan bebas floating-point error.
 */
export function calcMoneyProduct(qty: number | string, rate: number | string): number {
  return new Decimal(qty).mul(rate).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber()
}

export function calcMoneyPercent(base: number | string, percent: number | string): number {
  return new Decimal(base).mul(percent).div(100).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber()
}

export function moneyInt(n: number): number {
  return Math.round(Number.isFinite(n) ? n : 0)
}

/** Fields from form that map to `compensation_records` insert/update (workflow columns added in actions). */
export type CompensationFormPayload = {
  member_id: string
  project_id: string
  task_id: string | null
  deliverable_id: string | null
  rate_type: string
  qty: number
  rate_amount: number
  subtotal_amount: number
  currency_code: string
  status: string
  period_label: string | null
  work_date: string | null
  notes: string | null
}

export type BuildPayloadResult = { ok: true; payload: CompensationFormPayload } | { ok: false; error: string }

export function buildCompensationPayload(formData: FormData, _profile: SessionProfile): BuildPayloadResult {
  const memberId = formData.get('member_id')?.toString().trim()
  const projectId = formData.get('project_id')?.toString().trim()
  const qtyRaw = formData.get('qty')?.toString().trim()
  const rateRaw = formData.get('rate_amount')?.toString().trim()
  const rateTypeRaw = formData.get('rate_type')?.toString().trim()

  if (!memberId) return { ok: false, error: 'Anggota tim wajib dipilih.' }
  if (!projectId) return { ok: false, error: 'Proyek wajib dipilih.' }
  if (!rateTypeRaw) return { ok: false, error: 'Tipe tarif wajib dipilih.' }
  if (!qtyRaw || Number.isNaN(Number(qtyRaw)) || Number(qtyRaw) <= 0) {
    return { ok: false, error: 'Kuantitas harus lebih dari 0.' }
  }
  if (!rateRaw || Number.isNaN(Number(rateRaw)) || Number(rateRaw) <= 0) {
    return { ok: false, error: 'Tarif harus lebih dari 0.' }
  }

  const qty = Number(qtyRaw)
  const rate = Number(rateRaw)
  const rate_amount = moneyInt(rate)
  const subtotal_amount = calcMoneyProduct(qty, rate_amount)

  const payload: CompensationFormPayload = {
    member_id: memberId,
    project_id: projectId,
    task_id: (formData.get('task_id') as string)?.trim() || null,
    deliverable_id: (formData.get('deliverable_id') as string)?.trim() || null,
    rate_type: rateTypeRaw,
    qty,
    rate_amount,
    subtotal_amount,
    currency_code: (formData.get('currency_code') as string)?.trim() || 'IDR',
    status: (formData.get('status') as string)?.trim() || 'draft',
    period_label: (formData.get('period_label') as string)?.trim() || null,
    work_date: (formData.get('work_date') as string)?.trim() || null,
    notes: (formData.get('notes') as string)?.trim() || null,
  }

  return { ok: true, payload }
}

/** Fields proposers may update on their own drafts (no status / workflow columns). */
export function buildProposerCompensationUpdatePayload(
  formData: FormData,
  profile: SessionProfile,
): BuildPayloadResult {
  const built = buildCompensationPayload(formData, profile)
  if (!built.ok) return built
  const b = built.payload
  return {
    ok: true,
    payload: {
      ...b,
    },
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
  const { data, error } = await supabase
    .from('projects')
    .select('id, name')
    .in('status', [...ACTIVE_COMPENSATION_PROJECT_STATUSES])
    .order('name')

  if (error) throw error
  return (data ?? []) as ProjectOption[]
}

export async function getProjectOptionsForCompensation(profile: SessionProfile): Promise<ProjectOption[]> {
  const supabase = await createServerClient()
  if (isManajer(profile.system_role)) {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name')
      .in('status', [...ACTIVE_COMPENSATION_PROJECT_STATUSES])
      .eq('project_lead_user_id', profile.id)
      .order('name')
    if (error) throw error
    return (data ?? []) as ProjectOption[]
  }
  const { data, error } = await supabase
    .from('projects')
    .select('id, name')
    .in('status', [...ACTIVE_COMPENSATION_PROJECT_STATUSES])
    .order('name')
  if (error) throw error
  return (data ?? []) as ProjectOption[]
}

export async function getMemberOptionsForCompensation(profile: SessionProfile): Promise<MemberOption[]> {
  if (!isManajer(profile.system_role)) {
    return getMemberOptions()
  }

  const supabase = await createServerClient()
  const { data: leads } = await supabase.from('projects').select('id').eq('project_lead_user_id', profile.id)
  const projectIds = (leads ?? []).map((p) => p.id as string)
  if (projectIds.length === 0) return []

  const { data: assignments } = await supabase
    .from('project_team_assignments')
    .select('user_id')
    .in('project_id', projectIds)

  const userIds = [...new Set((assignments ?? []).map((a) => a.user_id as string))]
  if (userIds.length === 0) return []

  const { data: profs } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', userIds)
    .eq('active_status', 'active')
    .order('full_name')

  return (profs ?? []) as MemberOption[]
}

const ACTIVE_STATUS_LIST = ACTIVE_COMPENSATION_PROJECT_STATUSES as readonly string[]

/**
 * Return null kalau valid. Return string error message kalau invalid.
 * Dipanggil untuk semua role proposer — cek tim & status proyek; cek lead hanya untuk Manajer.
 */
export async function validateCompensationProposal(
  profile: SessionProfile,
  projectId: string,
  memberId: string,
): Promise<string | null> {
  const supabase = await createServerClient()

  const { data: project, error: projectErr } = await supabase
    .from('projects')
    .select('id, status, project_lead_user_id')
    .eq('id', projectId)
    .maybeSingle()

  if (projectErr) return 'Gagal membaca data proyek.'
  if (!project) return 'Proyek tidak ditemukan.'
  if (!ACTIVE_STATUS_LIST.includes(project.status)) {
    return 'Proyek tidak dalam status aktif.'
  }

  const { data: assign } = await supabase
    .from('project_team_assignments')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', memberId)
    .maybeSingle()

  if (!assign) return 'Anggota harus tercatat di tim proyek ini.'

  if (isManajer(profile.system_role)) {
    if (project.project_lead_user_id !== profile.id) {
      return 'Anda hanya dapat mengajukan kompensasi untuk proyek yang Anda lead.'
    }
  }

  return null
}
