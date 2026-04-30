/**
 * Technical Director dashboard — org-wide operational metrics (no finance-only modules).
 */

import { createServerClient } from '@/lib/supabase/server'
import {
  getDashboardKpis,
  getDeadlineBuckets,
  getNeedsAttention,
  getOpenTaskStatusCounts,
  getTeamWorkload,
  getWaitingOnClientProjects,
  type DashboardKpis,
  type DeadlineBuckets,
  type NeedsAttentionData,
  type OpenTaskStatusCounts,
  type WaitingClientProjectRow,
  type WorkloadUser,
} from '@/lib/dashboard/queries'
import { getRecentActivity, type ActivityLogEntry } from '@/lib/activity/queries'

export type ProblematicProjectRow = {
  id: string
  project_code: string
  name: string
  status: string
  target_due_date: string
  progress_percent: number
  problem_note: string | null
}

export type DeliverableReviewRow = {
  id: string
  name: string
  type: string
  status: string
  submitted_to_client_date: string | null
  projects: { id: string; name: string; project_code: string } | null
  prepared_by_user: { full_name: string } | null
}

export type ProjectStatusBoardRow = {
  id: string
  project_code: string
  name: string
  status: string
  target_due_date: string
  progress_percent: number
  priority: string
}

export type TDDashboardData = {
  kpis: DashboardKpis
  tasksInProgress: number
  deliverablesPendingReview: number
  problemProjects: ProblematicProjectRow[]
  projectBoard: ProjectStatusBoardRow[]
  deliverablesForReview: DeliverableReviewRow[]
  teamWorkload: WorkloadUser[]
  attention: NeedsAttentionData
  waitingClient: WaitingClientProjectRow[]
  pipeline: OpenTaskStatusCounts
  buckets: DeadlineBuckets
  activity: ActivityLogEntry[]
}

export async function getTDDashboardData(viewerId: string): Promise<TDDashboardData> {
  const supabase = await createServerClient()

  const [
    kpis,
    pipeline,
    buckets,
    attention,
    waitingClient,
    activity,
    workload,
    tasksInProg,
    delivReview,
    problems,
    board,
    deliverablesForReview,
  ] = await Promise.all([
    getDashboardKpis(viewerId),
    getOpenTaskStatusCounts(viewerId),
    getDeadlineBuckets(viewerId),
    getNeedsAttention(viewerId),
    getWaitingOnClientProjects(viewerId),
    getRecentActivity(18),
    getTeamWorkload(viewerId),
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in_progress'),

    supabase
      .from('deliverables')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'internal_review'),

    supabase
      .from('projects')
      .select('id, project_code, name, status, target_due_date, progress_percent, problem_note')
      .eq('is_problematic', true)
      .neq('status', 'cancelled')
      .order('target_due_date', { ascending: true })
      .limit(12),

    supabase
      .from('projects')
      .select('id, project_code, name, status, target_due_date, progress_percent, priority')
      .neq('status', 'completed')
      .neq('status', 'cancelled')
      .order('target_due_date', { ascending: true })
      .limit(24),

    supabase
      .from('deliverables')
      .select(
        'id, name, type, status, submitted_to_client_date, projects(id, name, project_code), prepared_by_user:profiles!prepared_by_user_id(full_name)',
      )
      .eq('status', 'internal_review')
      .order('created_at', { ascending: true })
      .limit(15),
  ])

  const projectBoard = ((board.data ?? []) as unknown as ProjectStatusBoardRow[]).sort((a, b) =>
    a.target_due_date.localeCompare(b.target_due_date),
  )

  return {
    kpis,
    tasksInProgress: tasksInProg.count ?? 0,
    deliverablesPendingReview: delivReview.count ?? 0,
    problemProjects: (problems.data ?? []) as unknown as ProblematicProjectRow[],
    projectBoard,
    deliverablesForReview: (deliverablesForReview.data ?? []) as unknown as DeliverableReviewRow[],
    teamWorkload: workload,
    attention,
    waitingClient,
    pipeline,
    buckets,
    activity,
  }
}
