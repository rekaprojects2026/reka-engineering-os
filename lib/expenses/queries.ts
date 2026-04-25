import { unstable_cache } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase/server'

export type ExpenseRow = {
  id: string
  projectId: string
  projectCode: string
  taskId: string | null
  taskTitle: string | null
  category: string
  description: string
  amount: number
  currencyCode: string
  expenseDate: string
  receiptUrl: string | null
  submittedById: string
  submittedByName: string
  status: 'pending' | 'approved' | 'rejected'
  approvedByName: string | null
  rejectionNote: string | null
}

const SUBMITTER = 'submitter:profiles!project_expenses_submitted_by_fkey'
const APPROVER = 'approver:profiles!project_expenses_approved_by_fkey'

function pickOne<T extends Record<string, unknown>>(
  v: T | T[] | null | undefined,
  key: keyof T,
): string | null {
  if (!v) return null
  const row = Array.isArray(v) ? v[0] : v
  const val = row?.[key]
  return typeof val === 'string' ? val : null
}

type RawExpense = {
  id: string
  project_id: string
  task_id: string | null
  category: string
  description: string
  amount: number | string
  currency_code: string
  expense_date: string
  receipt_url: string | null
  submitted_by: string
  status: string
  rejection_note: string | null
  projects: { project_code: string } | { project_code: string }[] | null
  tasks: { title: string } | { title: string }[] | null
  submitter: { full_name: string } | { full_name: string }[] | null
  approver: { full_name: string } | { full_name: string }[] | null
}

function mapExpense(r: RawExpense): ExpenseRow {
  const st: ExpenseRow['status'] =
    r.status === 'approved' || r.status === 'rejected' || r.status === 'pending' ? r.status : 'pending'
  return {
    id: r.id,
    projectId: r.project_id,
    projectCode: pickOne(r.projects, 'project_code') ?? '—',
    taskId: r.task_id,
    taskTitle: pickOne(r.tasks, 'title'),
    category: r.category,
    description: r.description,
    amount: Number(r.amount),
    currencyCode: r.currency_code,
    expenseDate: r.expense_date,
    receiptUrl: r.receipt_url,
    submittedById: r.submitted_by,
    submittedByName: pickOne(r.submitter, 'full_name') ?? '—',
    status: st,
    approvedByName: pickOne(r.approver, 'full_name'),
    rejectionNote: r.rejection_note,
  }
}

const SELECT_FIELDS = `
  id, project_id, task_id, category, description, amount, currency_code,
  expense_date, receipt_url, submitted_by, status, rejection_note,
  projects ( project_code ),
  tasks ( title ),
  ${SUBMITTER} ( full_name ),
  ${APPROVER} ( full_name )
`

async function _getMyExpenses(supabase: SupabaseClient, userId: string): Promise<ExpenseRow[]> {
  const { data } = await supabase
    .from('project_expenses')
    .select(SELECT_FIELDS)
    .eq('submitted_by', userId)
    .order('expense_date', { ascending: false })
    .range(0, 199)

  return ((data ?? []) as RawExpense[]).map(mapExpense)
}

export async function getMyExpenses(userId: string): Promise<ExpenseRow[]> {
  const supabase = await createServerClient()
  return unstable_cache(
    () => _getMyExpenses(supabase, userId),
    ['expenses-own', userId],
    { revalidate: 300, tags: ['expenses'] },
  )()
}

async function _getAllExpenses(supabase: SupabaseClient, status?: string): Promise<ExpenseRow[]> {
  let query = supabase
    .from('project_expenses')
    .select(SELECT_FIELDS)
    .order('expense_date', { ascending: false })
    .range(0, 199)

  if (status) query = query.eq('status', status)

  const { data } = await query
  return ((data ?? []) as RawExpense[]).map(mapExpense)
}

export async function getAllExpenses(status?: string): Promise<ExpenseRow[]> {
  const supabase = await createServerClient()
  return unstable_cache(
    () => _getAllExpenses(supabase, status),
    ['expenses-all', status ?? 'all'],
    { revalidate: 300, tags: ['expenses'] },
  )()
}

function expenseToUsd(amount: number, currencyCode: string | null, usdToIdr: number): number {
  const cur = (currencyCode ?? 'IDR').toUpperCase()
  if (cur === 'USD') return amount
  return usdToIdr > 0 ? amount / usdToIdr : amount
}

/** Aggregate approved expenses per project in USD (caller supplies Supabase + rate — safe inside `unstable_cache`). */
export async function aggregateApprovedExpensesUsd(
  supabase: SupabaseClient,
  usdToIdr: number,
): Promise<Map<string, number>> {
  const { data } = await supabase
    .from('project_expenses')
    .select('project_id, amount, currency_code')
    .eq('status', 'approved')

  const map = new Map<string, number>()
  for (const row of data ?? []) {
    const pid = row.project_id as string
    const usd = expenseToUsd(Number(row.amount ?? 0), row.currency_code as string, usdToIdr)
    map.set(pid, (map.get(pid) ?? 0) + usd)
  }
  return map
}
