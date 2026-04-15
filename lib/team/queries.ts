// Server-side query helpers for the Team / Freelancer module.

import { createServerClient } from '@/lib/supabase/server'
import type { ActiveStatus, AvailabilityStatus, RateType, SystemRole, WorkerType } from '@/types/database'

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
  city:                 string | null
  portfolio_link:       string | null
  notes_internal:       string | null
  is_active:            boolean
  created_at:           string
  updated_at:           string
}

const TEAM_SELECT = `
  id, full_name, email, phone,
  system_role, functional_role, discipline, worker_type,
  active_status, availability_status, joined_date,
  expected_rate, approved_rate, rate_type, currency_code,
  city, portfolio_link, notes_internal,
  is_active, created_at, updated_at
`.trim()

export async function getTeamMembers(): Promise<TeamMember[]> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('profiles')
    .select(TEAM_SELECT)
    .order('full_name', { ascending: true })

  if (error) return []
  return (data ?? []) as TeamMember[]
}

export async function getMemberById(id: string): Promise<TeamMember | null> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('profiles')
    .select(TEAM_SELECT)
    .eq('id', id)
    .single()

  if (error) return null
  return data as TeamMember
}
