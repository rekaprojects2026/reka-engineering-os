import { unstable_cache } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase/server'
import { workLogMonthRange } from '@/lib/work-logs/month-range'

export type WorkLogRow = {
  id: string
  taskId: string
  taskTitle: string
  projectId: string
  projectCode: string
  memberId: string
  memberName: string
  logDate: string
  hoursLogged: number
  description: string | null
}

export type MemberUtilizationRow = {
  memberId: string
  memberName: string
  totalHours: number
  logCount: number
}

const MEMBER_PROFILE = 'profiles!work_logs_member_id_fkey'

function pickNestedTitle(v: { title: string } | { title: string }[] | null): string | null {
  if (!v) return null
  const row = Array.isArray(v) ? v[0] : v
  return row?.title ?? null
}

function pickNestedProjectCode(v: { project_code: string } | { project_code: string }[] | null): string | null {
  if (!v) return null
  const row = Array.isArray(v) ? v[0] : v
  return row?.project_code ?? null
}

function pickNestedFullName(v: { full_name: string } | { full_name: string }[] | null): string | null {
  if (!v) return null
  const row = Array.isArray(v) ? v[0] : v
  return row?.full_name ?? null
}

async function _getMyWorkLogs(
  supabase: SupabaseClient,
  userId: string,
  monthIso: string,
): Promise<WorkLogRow[]> {
  const { start, endExclusive } = workLogMonthRange(monthIso)

  const { data } = await supabase
    .from('work_logs')
    .select(`
      id, log_date, hours_logged, description,
      task_id, project_id, member_id,
      tasks ( title ),
      projects ( project_code ),
      ${MEMBER_PROFILE} ( full_name )
    `)
    .eq('member_id', userId)
    .gte('log_date', start)
    .lt('log_date', endExclusive)
    .order('log_date', { ascending: false })

  type Raw = {
    id: string
    log_date: string
    hours_logged: number | string
    description: string | null
    task_id: string
    project_id: string
    member_id: string
    tasks: { title: string } | { title: string }[] | null
    projects: { project_code: string } | { project_code: string }[] | null
    profiles: { full_name: string } | { full_name: string }[] | null
  }

  return ((data ?? []) as Raw[]).map((r) => ({
    id: r.id,
    taskId: r.task_id,
    taskTitle: pickNestedTitle(r.tasks) ?? '—',
    projectId: r.project_id,
    projectCode: pickNestedProjectCode(r.projects) ?? '—',
    memberId: r.member_id,
    memberName: pickNestedFullName(r.profiles) ?? '—',
    logDate: r.log_date,
    hoursLogged: Number(r.hours_logged),
    description: r.description,
  }))
}

export async function getMyWorkLogs(userId: string, monthIso: string): Promise<WorkLogRow[]> {
  const supabase = await createServerClient()
  return unstable_cache(
    () => _getMyWorkLogs(supabase, userId, monthIso),
    ['work-logs-own', userId, monthIso.slice(0, 10)],
    { revalidate: 300, tags: ['work-logs'] },
  )()
}

async function _getMemberUtilization(supabase: SupabaseClient, monthIso: string): Promise<MemberUtilizationRow[]> {
  const { start, endExclusive } = workLogMonthRange(monthIso)

  const { data } = await supabase
    .from('work_logs')
    .select(`member_id, hours_logged, ${MEMBER_PROFILE} ( full_name )`)
    .gte('log_date', start)
    .lt('log_date', endExclusive)

  type Raw = {
    member_id: string
    hours_logged: number | string
    profiles: { full_name: string } | { full_name: string }[] | null
  }

  const map = new Map<string, { name: string; hours: number; count: number }>()
  for (const r of (data ?? []) as Raw[]) {
    const existing = map.get(r.member_id)
    const hrs = Number(r.hours_logged)
    if (existing) {
      existing.hours += hrs
      existing.count += 1
    } else {
      map.set(r.member_id, {
        name: pickNestedFullName(r.profiles) ?? 'Unknown',
        hours: hrs,
        count: 1,
      })
    }
  }

  return Array.from(map.entries())
    .map(([memberId, v]) => ({
      memberId,
      memberName: v.name,
      totalHours: v.hours,
      logCount: v.count,
    }))
    .sort((a, b) => b.totalHours - a.totalHours)
}

export async function getMemberUtilization(monthIso: string): Promise<MemberUtilizationRow[]> {
  const supabase = await createServerClient()
  return unstable_cache(
    () => _getMemberUtilization(supabase, monthIso),
    ['work-logs-utilization', monthIso.slice(0, 10)],
    { revalidate: 300, tags: ['work-logs'] },
  )()
}
