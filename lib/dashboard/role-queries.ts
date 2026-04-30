/**
 * lib/dashboard/role-queries.ts
 * Role-scoped dashboard data fetchers for coordinator, reviewer, and member.
 * Admin uses the existing queries in ./queries.ts unchanged.
 */

import { createServerClient } from '@/lib/supabase/server'

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

// ── Types ────────────────────────────────────────────────────

export type ScopedKpis = {
  activeProjects: number
  openTasks:      number
  overdueTasks:   number
  dueThisWeek:   number
  awaitingReview: number
}

export type ScopedTask = {
  id:       string
  title:    string
  due_date: string | null
  status:   string
  priority: string
  projects: { id: string; name: string; project_code: string } | null
}

export type ScopedDeliverable = {
  id:     string
  name:   string
  type:   string
  status: string
  projects: { id: string; name: string; project_code: string } | null
}

export type ScopedPayment = {
  id:             string
  period_label:   string | null
  total_due:      number
  total_paid:     number
  balance:        number
  payment_status: string
  currency_code:  string
}

// ── Scoping helper ───────────────────────────────────────────

async function getAssignedProjectIds(userId: string): Promise<string[]> {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('project_team_assignments')
    .select('project_id')
    .eq('user_id', userId)
  return (data ?? []).map((r) => r.project_id)
}

// ── Member dashboard ─────────────────────────────────────────

export async function getMemberDashboard(userId: string) {
  const supabase = await createServerClient()
  const today    = todayStr()
  const weekEnd  = daysFromNow(7)
  const taskSelect = 'id, title, due_date, status, priority, projects(id, name, project_code)'

  const [
    myProjects,
    myOpenTasks,
    myOverdueTasks,
    myDueThisWeek,
    myRecentTasks,
    myDeliverables,
    myPayments,
  ] = await Promise.all([
    supabase
      .from('project_team_assignments')
      .select('project_id', { count: 'exact', head: true })
      .eq('user_id', userId),

    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_to_user_id', userId)
      .neq('status', 'done'),

    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_to_user_id', userId)
      .lt('due_date', today)
      .neq('status', 'done'),

    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_to_user_id', userId)
      .gte('due_date', today)
      .lte('due_date', weekEnd)
      .neq('status', 'done'),

    supabase
      .from('tasks')
      .select(taskSelect)
      .eq('assigned_to_user_id', userId)
      .neq('status', 'done')
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(10),

    supabase
      .from('deliverables')
      .select('id, name, type, status, projects(id, name, project_code)')
      .eq('prepared_by_user_id', userId)
      .neq('status', 'approved')
      .neq('status', 'issued')
      .order('created_at', { ascending: false })
      .limit(8),

    supabase
      .from('payment_records')
      .select('id, period_label, total_due, total_paid, balance, payment_status, currency_code')
      .eq('member_id', userId)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  return {
    kpis: {
      activeProjects: myProjects.count  ?? 0,
      openTasks:      myOpenTasks.count  ?? 0,
      overdueTasks:   myOverdueTasks.count ?? 0,
      dueThisWeek:    myDueThisWeek.count ?? 0,
      awaitingReview: 0,
    } as ScopedKpis,
    tasks:        (myRecentTasks.data   ?? []) as unknown as ScopedTask[],
    deliverables: (myDeliverables.data  ?? []) as unknown as ScopedDeliverable[],
    payments:     (myPayments.data      ?? []) as unknown as ScopedPayment[],
    projectIds:   [] as string[],
  }
}

// ── Reviewer dashboard ───────────────────────────────────────

export async function getReviewerDashboard(userId: string) {
  const supabase = await createServerClient()
  const taskSelect = 'id, title, due_date, status, priority, projects(id, name, project_code)'

  const [
    reviewProjects,
    reviewTasks,
    reviewDeliverables,
    myPayments,
  ] = await Promise.all([
    supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('reviewer_user_id', userId)
      .neq('status', 'completed')
      .neq('status', 'cancelled'),

    supabase
      .from('tasks')
      .select(taskSelect)
      .eq('reviewer_user_id', userId)
      .neq('status', 'done')
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(12),

    supabase
      .from('deliverables')
      .select('id, name, type, status, projects(id, name, project_code)')
      .eq('reviewed_by_user_id', userId)
      .in('status', ['internal_review', 'revision_requested'])
      .order('created_at', { ascending: false })
      .limit(10),

    supabase
      .from('payment_records')
      .select('id, period_label, total_due, total_paid, balance, payment_status, currency_code')
      .eq('member_id', userId)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  return {
    kpis: {
      activeProjects: reviewProjects.count ?? 0,
      openTasks:      reviewTasks.data?.length ?? 0,
      overdueTasks:   0,
      dueThisWeek:    0,
      awaitingReview: reviewDeliverables.data?.length ?? 0,
    } as ScopedKpis,
    tasks:        (reviewTasks.data        ?? []) as unknown as ScopedTask[],
    deliverables: (reviewDeliverables.data ?? []) as unknown as ScopedDeliverable[],
    payments:     (myPayments.data         ?? []) as unknown as ScopedPayment[],
    projectIds:   [] as string[],
  }
}

// ── Coordinator dashboard ────────────────────────────────────

export async function getCoordinatorDashboard(userId: string) {
  const supabase = await createServerClient()
  const today    = todayStr()
  const weekEnd  = daysFromNow(7)
  const projIds  = await getAssignedProjectIds(userId)
  const taskSelect = 'id, title, due_date, status, priority, projects(id, name, project_code)'

  if (projIds.length === 0) {
    return {
      kpis: { activeProjects: 0, openTasks: 0, overdueTasks: 0, dueThisWeek: 0, awaitingReview: 0 } as ScopedKpis,
      tasks: [] as ScopedTask[],
      deliverables: [] as ScopedDeliverable[],
      payments: [] as ScopedPayment[],
      projectIds: [] as string[],
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
  ])

  return {
    kpis: {
      activeProjects: activeProj.count   ?? 0,
      openTasks:      openTasks.count    ?? 0,
      overdueTasks:   overdueTasks.count ?? 0,
      dueThisWeek:    dueThisWeek.count ?? 0,
      awaitingReview: awaitingRev.count ?? 0,
    } as ScopedKpis,
    tasks:        (recentTasks.data        ?? []) as unknown as ScopedTask[],
    deliverables: (recentDeliverables.data ?? []) as unknown as ScopedDeliverable[],
    payments:     [] as ScopedPayment[],
    projectIds:   projIds,
  }
}
