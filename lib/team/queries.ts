// Server-side query helpers for the Team / Freelancer module.

import { createServerClient } from '@/lib/supabase/server'
import type { ActiveStatus, AvailabilityStatus, RateType, SystemRole, WorkerType } from '@/types/database'

export type TeamAvailabilityRow = {
  id: string
  full_name: string
  photo_url: string | null
  availability_status: AvailabilityStatus | null
  skill_tags: string[]
  functional_role: string | null
  discipline: string | null
}

export type TeamMember = {
  id:                   string
  full_name:            string
  email:                string
  phone:                string | null
  system_role:          SystemRole | null
  functional_role:      string | null
  discipline:           string | null
  worker_type:          WorkerType | null
  active_status:        ActiveStatus
  availability_status:  AvailabilityStatus
  joined_date:          string | null
  expected_rate:        number | null
  approved_rate:        number | null
  rate_type:            RateType | null
  currency_code:        string
  bank_name:            string | null
  bank_account_name:    string | null
  bank_account_number:  string | null
  ewallet_type:         string | null
  ewallet_number:       string | null
  city:                 string | null
  portfolio_link:       string | null
  notes_internal:       string | null
  skill_tags:           string[]
  profile_completed_at: string | null
  photo_url:            string | null
  google_email:         string | null
  is_active:            boolean
  created_at:           string
  updated_at:           string
}

const TEAM_SELECT = `
  id, full_name, email, google_email, phone,
  system_role, functional_role, discipline, worker_type,
  active_status, availability_status, joined_date,
  expected_rate, approved_rate, rate_type, currency_code,
  bank_name, bank_account_name, bank_account_number,
  ewallet_type, ewallet_number,
  city, portfolio_link, notes_internal,
  skill_tags, profile_completed_at,
  photo_url, is_active, created_at, updated_at
`.trim()

/** Active members — availability / identity fields only (manajer); uses RPC so RLS does not need full-row SELECT. */
export async function getTeamAvailabilityForManajer(): Promise<TeamAvailabilityRow[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase.rpc('list_team_availability_for_manajer')
  if (error) throw new Error(error.message)
  const rows = (data ?? []) as {
    id: string
    full_name: string
    photo_url: string | null
    availability_status: string | null
    skill_tags: string[] | null
    functional_role: string | null
    discipline: string | null
  }[]
  return rows.map((r) => ({
    id: r.id,
    full_name: r.full_name,
    photo_url: r.photo_url,
    availability_status: (r.availability_status as AvailabilityStatus | null) ?? null,
    skill_tags: r.skill_tags ?? [],
    functional_role: r.functional_role,
    discipline: r.discipline,
  }))
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('profiles')
    .select(TEAM_SELECT)
    .order('full_name', { ascending: true })

  if (error) return []
  return (data ?? []) as unknown as TeamMember[]
}

export async function getMemberById(id: string): Promise<TeamMember | null> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('profiles')
    .select(TEAM_SELECT)
    .eq('id', id)
    .single()

  if (error) return null
  return data as unknown as TeamMember
}

export type TalentMetrics = {
  userId: string
  projectCount: number
  completedTasks: number
  onTimeTasks: number
  onTimePct: number | null
  totalPaid: number
  totalPending: number
  currencyCode: string
}

/** Fetch talent metrics for all members in one batch */
export async function getAllTalentMetrics(): Promise<Record<string, TalentMetrics>> {
  const supabase = await createServerClient()

  const [tasksRes, compRes] = await Promise.all([
    supabase
      .from('tasks')
      .select('assigned_to_user_id, due_date, completed_date, status')
      .eq('status', 'done')
      .not('assigned_to_user_id', 'is', null),
    supabase
      .from('compensation_records')
      .select('member_id, subtotal_amount, currency_code, status'),
  ])

  const tasks = (tasksRes.data ?? []) as { assigned_to_user_id: string; due_date: string | null; completed_date: string | null; status: string }[]
  const comps = (compRes.data ?? []) as { member_id: string; subtotal_amount: number; currency_code: string; status: string }[]

  const metrics: Record<string, TalentMetrics> = {}

  function ensure(userId: string, currencyCode = 'IDR'): TalentMetrics {
    if (!metrics[userId]) {
      metrics[userId] = { userId, projectCount: 0, completedTasks: 0, onTimeTasks: 0, onTimePct: null, totalPaid: 0, totalPending: 0, currencyCode }
    }
    return metrics[userId]
  }

  for (const t of tasks) {
    if (!t.assigned_to_user_id) continue
    const m = ensure(t.assigned_to_user_id)
    m.completedTasks++
    if (t.due_date && t.completed_date && t.completed_date <= t.due_date) {
      m.onTimeTasks++
    }
  }

  for (const c of comps) {
    if (!c.member_id) continue
    const m = ensure(c.member_id, c.currency_code)
    if (c.status === 'paid') m.totalPaid += c.subtotal_amount ?? 0
    else if (c.status !== 'cancelled') m.totalPending += c.subtotal_amount ?? 0
  }

  // Calculate on-time %
  for (const m of Object.values(metrics)) {
    if (m.completedTasks > 0) {
      m.onTimePct = Math.round((m.onTimeTasks / m.completedTasks) * 100)
    }
  }

  return metrics
}
