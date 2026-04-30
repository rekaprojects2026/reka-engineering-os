/**
 * Dashboard data for Manajer — scoped to projects where user is project lead.
 */

import { createServerClient } from '@/lib/supabase/server'
import type { ScopedDeliverable, ScopedKpis, ScopedTask } from '@/lib/dashboard/role-queries'
import {
  getDeadlineBucketsForProjects,
  getNeedsAttentionForProjects,
  getOpenTaskStatusCountsForProjects,
  getTeamWorkloadForProjects,
  getWaitingOnClientProjectsForProjects,
  type DeadlineBuckets,
  type NeedsAttentionData,
  type OpenTaskStatusCounts,
  type WaitingClientProjectRow,
  type WorkloadUser,
} from '@/lib/dashboard/queries'
import { getRecentActivity, type ActivityLogEntry } from '@/lib/activity/queries'

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

async function getLeadProjectIds(userId: string): Promise<string[]> {
  const supabase = await createServerClient()
  const { data } = await supabase.from('projects').select('id').eq('project_lead_user_id', userId)
  return (data ?? []).map((r) => r.id as string)
}

export type ManajerTerminRow = {
  id: string
  termin_number: number
  label: string
  percentage: number
  amount: number | null
  currency: string
  status: string
  project_id: string
  projects: { id: string; name: string; project_code: string } | null
}

export type ManajerDashboardData = {
  kpis: ScopedKpis
  tasks: ScopedTask[]
  deliverables: ScopedDeliverable[]
  projectIds: string[]
  readyTermins: ManajerTerminRow[]
}

export async function getManajerDashboardData(userId: string): Promise<ManajerDashboardData> {
  const supabase = await createServerClient()
  const today = todayStr()
  const weekEnd = daysFromNow(7)
  const projIds = await getLeadProjectIds(userId)
  const taskSelect = 'id, title, due_date, status, priority, projects(id, name, project_code)'

  if (projIds.length === 0) {
    return {
      kpis: { activeProjects: 0, openTasks: 0, overdueTasks: 0, dueThisWeek: 0, awaitingReview: 0 },
      tasks: [],
      deliverables: [],
      projectIds: [],
      readyTermins: [],
    }
  }

  const [
    activeProj,
    openTasks,
    overdueTasks,
    dueThisWeek,
    awaitingRev,
    recentTasks,
    recentDeliverables,
    terminsRes,
  ] = await Promise.all([
    supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .in('id', projIds)
      .neq('status', 'completed')
      .neq('status', 'cancelled'),

    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .in('project_id', projIds)
      .neq('status', 'done'),

    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .in('project_id', projIds)
      .lt('due_date', today)
      .neq('status', 'done'),

    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .in('project_id', projIds)
      .gte('due_date', today)
      .lte('due_date', weekEnd)
      .neq('status', 'done'),

    supabase
      .from('deliverables')
      .select('*', { count: 'exact', head: true })
      .in('project_id', projIds)
      .eq('status', 'internal_review'),

    supabase
      .from('tasks')
      .select(taskSelect)
      .in('project_id', projIds)
      .neq('status', 'done')
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(10),

    supabase
      .from('deliverables')
      .select('id, name, type, status, projects(id, name, project_code)')
      .in('project_id', projIds)
      .neq('status', 'approved')
      .neq('status', 'issued')
      .order('created_at', { ascending: false })
      .limit(8),

    supabase
      .from('project_termins')
      .select(
        'id, termin_number, label, percentage, amount, currency, status, project_id, projects(id, name, project_code)',
      )
      .in('project_id', projIds)
      .eq('status', 'SIAP_DIKLAIM')
      .order('termin_number', { ascending: true })
      .limit(12),
  ])

  return {
    kpis: {
      activeProjects: activeProj.count ?? 0,
      openTasks: openTasks.count ?? 0,
      overdueTasks: overdueTasks.count ?? 0,
      dueThisWeek: dueThisWeek.count ?? 0,
      awaitingReview: awaitingRev.count ?? 0,
    },
    tasks: (recentTasks.data ?? []) as unknown as ScopedTask[],
    deliverables: (recentDeliverables.data ?? []) as unknown as ScopedDeliverable[],
    projectIds: projIds,
    readyTermins: (terminsRes.data ?? []) as unknown as ManajerTerminRow[],
  }
}

export type ManajerProjectRow = {
  id: string
  project_code: string
  name: string
  status: string
  priority: string
  target_due_date: string
  progress_percent: number
  is_problematic: boolean
  problem_note: string | null
}

export type ManajerDashboardFull = {
  base: ManajerDashboardData
  projectsTable: ManajerProjectRow[]
  pipeline: OpenTaskStatusCounts
  buckets: DeadlineBuckets
  attention: NeedsAttentionData
  waiting: WaitingClientProjectRow[]
  workload: WorkloadUser[]
  activity: ActivityLogEntry[]
}

export async function getManajerDashboardFull(userId: string): Promise<ManajerDashboardFull> {
  const [base, projectsTable] = await Promise.all([getManajerDashboardData(userId), getManajerProjectsTable(userId)])
  const ids = base.projectIds
  if (ids.length === 0) {
    return {
      base,
      projectsTable,
      pipeline: { to_do: 0, in_progress: 0, review: 0, revision: 0, blocked: 0 },
      buckets: { week1: { tasks: 0, projects: 0 }, week2: { tasks: 0, projects: 0 } },
      attention: { overdueTasks: [], blockedTasks: [], revisionDeliverables: [] },
      waiting: [],
      workload: [],
      activity: [],
    }
  }
  const [pipeline, buckets, attention, waiting, workload, activity] = await Promise.all([
    getOpenTaskStatusCountsForProjects(userId, ids),
    getDeadlineBucketsForProjects(userId, ids),
    getNeedsAttentionForProjects(userId, ids),
    getWaitingOnClientProjectsForProjects(userId, ids),
    getTeamWorkloadForProjects(userId, ids),
    getRecentActivity(14),
  ])
  return { base, projectsTable, pipeline, buckets, attention, waiting, workload, activity }
}

export async function getManajerProjectsTable(userId: string): Promise<ManajerProjectRow[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('projects')
    .select('id, project_code, name, status, priority, target_due_date, progress_percent, is_problematic, problem_note')
    .eq('project_lead_user_id', userId)
    .neq('status', 'cancelled')
    .order('target_due_date', { ascending: true })
    .limit(40)

  if (error) return []
  return (data ?? []) as ManajerProjectRow[]
}
