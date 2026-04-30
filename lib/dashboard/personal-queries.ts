/**
 * Personal dashboards — Member, Senior (reviewer), Freelancer (isolated task list).
 */

import { createServerClient } from '@/lib/supabase/server'
import {
  getMemberDashboard,
  getReviewerDashboard,
  type ScopedDeliverable,
  type ScopedKpis,
  type ScopedPayment,
  type ScopedTask,
} from '@/lib/dashboard/role-queries'

export type PersonalDashboardVariant = 'member' | 'senior' | 'freelancer'

export type FreelancerTask = {
  id: string
  title: string
  due_date: string | null
  status: string
  priority: string
}

export type PersonalDashboardData =
  | {
      variant: 'member'
      kpis: ScopedKpis
      tasks: ScopedTask[]
      deliverables: ScopedDeliverable[]
      payments: ScopedPayment[]
    }
  | {
      variant: 'senior'
      kpis: ScopedKpis
      tasks: ScopedTask[]
      deliverables: ScopedDeliverable[]
      payments: ScopedPayment[]
    }
  | {
      variant: 'freelancer'
      kpis: ScopedKpis
      tasks: FreelancerTask[]
      deliverables: ScopedDeliverable[]
      payments: ScopedPayment[]
    }

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

async function getFreelancerDashboard(userId: string) {
  const supabase = await createServerClient()
  const today = todayStr()
  const weekEnd = daysFromNow(7)
  const taskSelect = 'id, title, due_date, status, priority'

  const [myOpenTasks, myOverdueTasks, myDueThisWeek, myRecentTasks, myDeliverables, myPayments] = await Promise.all([
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
      .limit(15),

    supabase
      .from('deliverables')
      .select('id, name, type, status')
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

  const deliverablesRaw = (myDeliverables.data ?? []) as { id: string; name: string; type: string; status: string }[]
  const deliverables: ScopedDeliverable[] = deliverablesRaw.map((d) => ({
    ...d,
    projects: null,
  }))

  return {
    kpis: {
      activeProjects: 0,
      openTasks: myOpenTasks.count ?? 0,
      overdueTasks: myOverdueTasks.count ?? 0,
      dueThisWeek: myDueThisWeek.count ?? 0,
      awaitingReview: 0,
    } as ScopedKpis,
    tasks: (myRecentTasks.data ?? []) as FreelancerTask[],
    deliverables,
    payments: (myPayments.data ?? []) as ScopedPayment[],
  }
}

export async function getPersonalDashboardData(
  userId: string,
  variant: PersonalDashboardVariant,
): Promise<PersonalDashboardData> {
  if (variant === 'senior') {
    const d = await getReviewerDashboard(userId)
    return { variant: 'senior', ...d }
  }
  if (variant === 'freelancer') {
    const d = await getFreelancerDashboard(userId)
    return { variant: 'freelancer', ...d }
  }
  const d = await getMemberDashboard(userId)
  return { variant: 'member', ...d }
}
