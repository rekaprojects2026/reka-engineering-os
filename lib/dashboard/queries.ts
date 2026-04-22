// Server-side query helpers for the Dashboard.
// All functions are called in parallel from the dashboard server component.

import { createServerClient } from '@/lib/supabase/server'

// ── Helpers ──────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

// ── KPIs ─────────────────────────────────────────────────────────────────────

export type DashboardKpis = {
  activeProjects: number
  openTasks:      number
  overdueTasks:   number
  dueThisWeek:    number
  awaitingReview: number
  waitingClient:  number
  inRevision:     number
}

export async function getDashboardKpis(): Promise<DashboardKpis> {
  const supabase = await createServerClient()
  const today   = todayStr()
  const weekEnd = daysFromNow(7)

  const [activeProj, openTasks, overdue, thisWeek, awaitingRev, waitClient, revision] = await Promise.all([
    // Active projects: everything except completed and cancelled
    supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'completed')
      .neq('status', 'cancelled'),

    // All open (non-done) tasks
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'done'),

    // Overdue tasks: past due date, not done
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .lt('due_date', today)
      .neq('status', 'done'),

    // Due this week: due_date in [today, today+7], not done
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .gte('due_date', today)
      .lte('due_date', weekEnd)
      .neq('status', 'done'),

    // Deliverables awaiting internal review
    supabase
      .from('deliverables')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'internal_review'),

    // Projects waiting on client response
    supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'waiting_client'),

    // Projects in active revision cycle
    supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in_revision'),
  ])

  return {
    activeProjects: activeProj.count  ?? 0,
    openTasks:      openTasks.count   ?? 0,
    overdueTasks:   overdue.count     ?? 0,
    dueThisWeek:    thisWeek.count    ?? 0,
    awaitingReview: awaitingRev.count ?? 0,
    waitingClient:  waitClient.count  ?? 0,
    inRevision:     revision.count    ?? 0,
  }
}

// ── Needs Attention ───────────────────────────────────────────────────────────

export type AttentionTask = {
  id:             string
  title:          string
  due_date:       string | null
  status:         string
  priority:       string
  blocked_reason: string | null
  projects:       { id: string; name: string; project_code: string } | null
  assignee:       { id: string; full_name: string } | null
}

export type AttentionDeliverable = {
  id:       string
  name:     string
  type:     string
  projects: { id: string; name: string; project_code: string } | null
}

export type NeedsAttentionData = {
  overdueTasks:         AttentionTask[]
  blockedTasks:         AttentionTask[]
  revisionDeliverables: AttentionDeliverable[]
}

export async function getNeedsAttention(): Promise<NeedsAttentionData> {
  const supabase  = await createServerClient()
  const today     = todayStr()
  const taskCols  = 'id, title, due_date, status, priority, blocked_reason, projects(id, name, project_code), assignee:profiles!assigned_to_user_id(id, full_name)'

  const [overdue, blocked, revisions] = await Promise.all([
    supabase
      .from('tasks')
      .select(taskCols)
      .lt('due_date', today)
      .neq('status', 'done')
      .order('due_date', { ascending: true })
      .limit(6),

    supabase
      .from('tasks')
      .select(taskCols)
      .eq('status', 'blocked')
      .limit(6),

    supabase
      .from('deliverables')
      .select('id, name, type, projects(id, name, project_code)')
      .eq('status', 'revision_requested')
      .limit(6),
  ])

  return {
    overdueTasks:         (overdue.data    ?? []) as unknown as AttentionTask[],
    blockedTasks:         (blocked.data    ?? []) as unknown as AttentionTask[],
    revisionDeliverables: (revisions.data  ?? []) as unknown as AttentionDeliverable[],
  }
}

/** Same shapes as getNeedsAttention, scoped to tasks/deliverables in the given projects. */
export async function getNeedsAttentionForProjects(projectIds: string[]): Promise<NeedsAttentionData> {
  if (projectIds.length === 0) {
    return { overdueTasks: [], blockedTasks: [], revisionDeliverables: [] }
  }
  const supabase = await createServerClient()
  const today = todayStr()
  const taskCols =
    'id, title, due_date, status, priority, blocked_reason, projects(id, name, project_code), assignee:profiles!assigned_to_user_id(id, full_name)'

  const [overdue, blocked, revisions] = await Promise.all([
    supabase
      .from('tasks')
      .select(taskCols)
      .in('project_id', projectIds)
      .lt('due_date', today)
      .neq('status', 'done')
      .order('due_date', { ascending: true })
      .limit(6),

    supabase
      .from('tasks')
      .select(taskCols)
      .in('project_id', projectIds)
      .eq('status', 'blocked')
      .limit(6),

    supabase
      .from('deliverables')
      .select('id, name, type, projects(id, name, project_code)')
      .in('project_id', projectIds)
      .eq('status', 'revision_requested')
      .limit(6),
  ])

  return {
    overdueTasks: (overdue.data ?? []) as unknown as AttentionTask[],
    blockedTasks: (blocked.data ?? []) as unknown as AttentionTask[],
    revisionDeliverables: (revisions.data ?? []) as unknown as AttentionDeliverable[],
  }
}

// ── Urgent Projects ───────────────────────────────────────────────────────────

export type UrgentProject = {
  id:               string
  project_code:     string
  name:             string
  status:           string
  priority:         string
  target_due_date:  string
  progress_percent: number
  clients:          { id: string; client_name: string } | null
  lead:             { id: string; full_name: string }   | null
}

export async function getUrgentProjects(): Promise<UrgentProject[]> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('projects')
    .select('id, project_code, name, status, priority, target_due_date, progress_percent, clients(id, client_name), lead:profiles!project_lead_user_id(id, full_name)')
    .neq('status', 'completed')
    .neq('status', 'cancelled')
    .order('target_due_date', { ascending: true })
    .limit(8)

  if (error) return []
  return (data ?? []) as unknown as UrgentProject[]
}

// ── Upcoming Deadlines ────────────────────────────────────────────────────────

export type UpcomingTask = {
  id:       string
  title:    string
  due_date: string
  priority: string
  status:   string
  projects: { id: string; name: string; project_code: string } | null
  assignee: { id: string; full_name: string } | null
}

export type UpcomingProject = {
  id:              string
  project_code:    string
  name:            string
  target_due_date: string
  status:          string
  priority:        string
  lead:            { id: string; full_name: string } | null
}

export type UpcomingDeadlinesData = {
  tasks:    UpcomingTask[]
  projects: UpcomingProject[]
}

export async function getUpcomingDeadlines(): Promise<UpcomingDeadlinesData> {
  const supabase   = await createServerClient()
  const today      = todayStr()
  const twoWeeks   = daysFromNow(14)
  const fourWeeks  = daysFromNow(28)

  const [tasks, projects] = await Promise.all([
    // Tasks due in the next 14 days, not yet done
    supabase
      .from('tasks')
      .select('id, title, due_date, priority, status, projects(id, name, project_code), assignee:profiles!assigned_to_user_id(id, full_name)')
      .gte('due_date', today)
      .lte('due_date', twoWeeks)
      .neq('status', 'done')
      .order('due_date', { ascending: true })
      .limit(10),

    // Projects due in the next 28 days, still active
    supabase
      .from('projects')
      .select('id, project_code, name, target_due_date, status, priority, lead:profiles!project_lead_user_id(id, full_name)')
      .gte('target_due_date', today)
      .lte('target_due_date', fourWeeks)
      .neq('status', 'completed')
      .neq('status', 'cancelled')
      .order('target_due_date', { ascending: true })
      .limit(8),
  ])

  return {
    tasks:    (tasks.data    ?? []) as unknown as UpcomingTask[],
    projects: (projects.data ?? []) as unknown as UpcomingProject[],
  }
}

// ── Team Workload ─────────────────────────────────────────────────────────────

export type WorkloadUser = {
  id:           string
  full_name:    string
  openTasks:    number
  overdueTasks: number
  label:        'Low' | 'Normal' | 'High' | 'Overloaded'
}

export async function getTeamWorkload(): Promise<WorkloadUser[]> {
  const supabase = await createServerClient()
  const today    = todayStr()

  const [profilesRes, tasksRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('is_active', true)
      .order('full_name', { ascending: true }),

    // All open tasks — only columns needed for the computation
    supabase
      .from('tasks')
      .select('assigned_to_user_id, due_date, status')
      .neq('status', 'done'),
  ])

  const profiles = profilesRes.data ?? []
  const tasks    = tasksRes.data    ?? []

  return profiles
    .map((profile) => {
      const mine       = tasks.filter((t) => t.assigned_to_user_id === profile.id)
      const openTasks  = mine.length
      const overdueTasks = mine.filter((t) => t.due_date && t.due_date < today).length

      let label: WorkloadUser['label'] = 'Low'
      if (openTasks >= 3  && openTasks < 8)  label = 'Normal'
      if (openTasks >= 8  && openTasks < 13) label = 'High'
      if (openTasks >= 13)                   label = 'Overloaded'

      return { id: profile.id, full_name: profile.full_name, openTasks, overdueTasks, label }
    })
    .filter((u) => u.openTasks > 0)              // only show users with active assignments
    .sort((a, b) => b.openTasks - a.openTasks)   // highest load first
}

// ── Open task pipeline (non-done tasks by status) ─────────────────────────────

const PIPELINE_STATUSES = ['to_do', 'in_progress', 'review', 'revision', 'blocked'] as const
export type TaskPipelineStatus = (typeof PIPELINE_STATUSES)[number]

export type OpenTaskStatusCounts = Record<TaskPipelineStatus, number>

export async function getOpenTaskStatusCounts(): Promise<OpenTaskStatusCounts> {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('tasks')
    .select('status')
    .in('status', PIPELINE_STATUSES as unknown as string[])

  const out = { to_do: 0, in_progress: 0, review: 0, revision: 0, blocked: 0 } as OpenTaskStatusCounts
  for (const row of data ?? []) {
    const s = row.status as TaskPipelineStatus
    if (s in out) out[s]++
  }
  return out
}

/** Same as getOpenTaskStatusCounts but scoped to project IDs (empty → all zeros). */
export async function getOpenTaskStatusCountsForProjects(projectIds: string[]): Promise<OpenTaskStatusCounts> {
  if (projectIds.length === 0) {
    return { to_do: 0, in_progress: 0, review: 0, revision: 0, blocked: 0 }
  }
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('tasks')
    .select('status')
    .in('status', PIPELINE_STATUSES as unknown as string[])
    .in('project_id', projectIds)

  const out = { to_do: 0, in_progress: 0, review: 0, revision: 0, blocked: 0 } as OpenTaskStatusCounts
  for (const row of data ?? []) {
    const s = row.status as TaskPipelineStatus
    if (s in out) out[s]++
  }
  return out
}

// ── Deadline buckets (next 7 days vs 8–14 days) ──────────────────────────────

export type DeadlineBuckets = {
  week1: { tasks: number; projects: number }
  week2: { tasks: number; projects: number }
}

export async function getDeadlineBuckets(): Promise<DeadlineBuckets> {
  const supabase = await createServerClient()
  const today   = todayStr()
  const w2End   = daysFromNow(14)
  const w1End   = daysFromNow(7)

  const [tasksRes, projectsRes] = await Promise.all([
    supabase
      .from('tasks')
      .select('due_date')
      .gte('due_date', today)
      .lte('due_date', w2End)
      .neq('status', 'done'),
    supabase
      .from('projects')
      .select('target_due_date')
      .gte('target_due_date', today)
      .lte('target_due_date', w2End)
      .neq('status', 'completed')
      .neq('status', 'cancelled'),
  ])

  let w1Tasks = 0, w2Tasks = 0
  for (const t of tasksRes.data ?? []) {
    if (t.due_date <= w1End) w1Tasks++; else w2Tasks++
  }
  let w1Proj = 0, w2Proj = 0
  for (const p of projectsRes.data ?? []) {
    if (p.target_due_date <= w1End) w1Proj++; else w2Proj++
  }

  return {
    week1: { tasks: w1Tasks, projects: w1Proj },
    week2: { tasks: w2Tasks, projects: w2Proj },
  }
}

export async function getDeadlineBucketsForProjects(projectIds: string[]): Promise<DeadlineBuckets> {
  if (projectIds.length === 0) {
    return {
      week1: { tasks: 0, projects: 0 },
      week2: { tasks: 0, projects: 0 },
    }
  }
  const supabase = await createServerClient()
  const today  = todayStr()
  const w2End  = daysFromNow(14)
  const w1End  = daysFromNow(7)

  const [tasksRes, projectsRes] = await Promise.all([
    supabase
      .from('tasks')
      .select('due_date')
      .in('project_id', projectIds)
      .gte('due_date', today)
      .lte('due_date', w2End)
      .neq('status', 'done'),
    supabase
      .from('projects')
      .select('target_due_date')
      .in('id', projectIds)
      .gte('target_due_date', today)
      .lte('target_due_date', w2End)
      .neq('status', 'completed')
      .neq('status', 'cancelled'),
  ])

  let w1Tasks = 0, w2Tasks = 0
  for (const t of tasksRes.data ?? []) {
    if (t.due_date <= w1End) w1Tasks++; else w2Tasks++
  }
  let w1Proj = 0, w2Proj = 0
  for (const p of projectsRes.data ?? []) {
    if (p.target_due_date <= w1End) w1Proj++; else w2Proj++
  }

  return {
    week1: { tasks: w1Tasks, projects: w1Proj },
    week2: { tasks: w2Tasks, projects: w2Proj },
  }
}

// ── Payment snapshot (admin) ─────────────────────────────────────────────────

export type PaymentSnapshot = {
  unpaidCount: number
  partialCount: number
  paidCount: number
  /** Sum of balances on unpaid + partial rows only (operational exposure). */
  totalOutstanding: number
  outstandingUnpaidAmount: number
  outstandingPartialAmount: number
}

export async function getPaymentSnapshot(): Promise<PaymentSnapshot> {
  const supabase = await createServerClient()
  const [unpaid, partial, paid, openRows] = await Promise.all([
    supabase.from('payment_records').select('*', { count: 'exact', head: true }).eq('payment_status', 'unpaid'),
    supabase.from('payment_records').select('*', { count: 'exact', head: true }).eq('payment_status', 'partial'),
    supabase.from('payment_records').select('*', { count: 'exact', head: true }).eq('payment_status', 'paid'),
    supabase.from('payment_records').select('balance, payment_status').in('payment_status', ['unpaid', 'partial']),
  ])

  const rows = openRows.data ?? []
  let outstandingUnpaidAmount = 0
  let outstandingPartialAmount = 0
  for (const r of rows) {
    const b = Number(r.balance)
    if (Number.isNaN(b)) continue
    if (r.payment_status === 'unpaid') outstandingUnpaidAmount += b
    else if (r.payment_status === 'partial') outstandingPartialAmount += b
  }
  const totalOutstanding = outstandingUnpaidAmount + outstandingPartialAmount

  return {
    unpaidCount: unpaid.count ?? 0,
    partialCount: partial.count ?? 0,
    paidCount: paid.count ?? 0,
    totalOutstanding,
    outstandingUnpaidAmount,
    outstandingPartialAmount,
  }
}

// ── Waiting on client (for attention queue) ───────────────────────────────────

export type WaitingClientProjectRow = {
  id: string
  project_code: string
  name: string
  target_due_date: string
  clients: { client_name: string } | null
}

export async function getWaitingOnClientProjects(): Promise<WaitingClientProjectRow[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('projects')
    .select('id, project_code, name, target_due_date, clients(client_name)')
    .eq('status', 'waiting_client')
    .order('target_due_date', { ascending: true })
    .limit(6)

  if (error) return []
  return (data ?? []) as unknown as WaitingClientProjectRow[]
}

export async function getWaitingOnClientProjectsForProjects(projectIds: string[]): Promise<WaitingClientProjectRow[]> {
  if (projectIds.length === 0) return []
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('projects')
    .select('id, project_code, name, target_due_date, clients(client_name)')
    .in('id', projectIds)
    .eq('status', 'waiting_client')
    .order('target_due_date', { ascending: true })
    .limit(6)

  if (error) return []
  return (data ?? []) as unknown as WaitingClientProjectRow[]
}

// ── Team workload scoped to projects ────────────────────────────────────────

export async function getTeamWorkloadForProjects(projectIds: string[]): Promise<WorkloadUser[]> {
  if (projectIds.length === 0) return []
  const supabase = await createServerClient()
  const today = todayStr()

  const [profilesRes, tasksRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('is_active', true)
      .order('full_name', { ascending: true }),

    supabase
      .from('tasks')
      .select('assigned_to_user_id, due_date, status')
      .in('project_id', projectIds)
      .neq('status', 'done'),
  ])

  const profiles = profilesRes.data ?? []
  const tasks = tasksRes.data ?? []

  return profiles
    .map((profile) => {
      const mine = tasks.filter((t) => t.assigned_to_user_id === profile.id)
      const openTasks = mine.length
      const overdueTasks = mine.filter((t) => t.due_date && t.due_date < today).length

      let label: WorkloadUser['label'] = 'Low'
      if (openTasks >= 3 && openTasks < 8) label = 'Normal'
      if (openTasks >= 8 && openTasks < 13) label = 'High'
      if (openTasks >= 13) label = 'Overloaded'

      return { id: profile.id, full_name: profile.full_name, openTasks, overdueTasks, label }
    })
    .filter((u) => u.openTasks > 0)
    .sort((a, b) => b.openTasks - a.openTasks)
}
