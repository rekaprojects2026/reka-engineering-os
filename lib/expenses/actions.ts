'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import {
  loadMutationProfile,
  ensureExpenseReviewMutation,
  ensureExpenseSubmitMutation,
} from '@/lib/auth/mutation-policy'
import { userCanViewProject } from '@/lib/auth/access-surface'
import { getProjectById } from '@/lib/projects/queries'
import type { ProjectExpenseCategory } from '@/types/database'

export type ExpenseActionResult = { ok: true } | { error: string }

const CATEGORIES: ProjectExpenseCategory[] = [
  'printing',
  'survey',
  'transport',
  'accommodation',
  'materials',
  'software',
  'meals',
  'other',
]

function invalidateExpenseCaches() {
  revalidateTag('expenses')
  revalidateTag('projects')
  revalidateTag('dashboard')
  revalidatePath('/expenses')
  revalidatePath('/finance/reports')
}

export async function submitExpense(formData: FormData): Promise<ExpenseActionResult> {
  const profile = await loadMutationProfile()
  const denied = ensureExpenseSubmitMutation(profile)
  if (denied) return { error: denied }

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const projectId = String(formData.get('project_id') ?? '').trim()
  const taskIdRaw = String(formData.get('task_id') ?? '').trim()
  const taskId = taskIdRaw.length > 0 ? taskIdRaw : null
  const category = String(formData.get('category') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const amountRaw = parseFloat(String(formData.get('amount') ?? ''))
  const currency = String(formData.get('currency_code') ?? 'IDR').trim() || 'IDR'
  const expenseDate = String(formData.get('expense_date') ?? '').trim()
  const receiptUrlRaw = String(formData.get('receipt_url') ?? '').trim()
  const receiptUrl = receiptUrlRaw.length > 0 ? receiptUrlRaw : null

  if (!projectId || !category || !description || !expenseDate) {
    return { error: 'Project, kategori, deskripsi, dan tanggal wajib diisi.' }
  }
  if (!CATEGORIES.includes(category as ProjectExpenseCategory)) {
    return { error: 'Kategori tidak valid.' }
  }
  if (Number.isNaN(amountRaw) || amountRaw <= 0) {
    return { error: 'Jumlah harus lebih dari 0.' }
  }

  const project = await getProjectById(projectId)
  if (!project) return { error: 'Project tidak ditemukan.' }
  if (!(await userCanViewProject(profile, project))) {
    return { error: 'Anda tidak punya akses ke project ini.' }
  }

  if (taskId) {
    const { data: task } = await supabase
      .from('tasks')
      .select('id, project_id')
      .eq('id', taskId)
      .maybeSingle()
    if (!task || task.project_id !== projectId) {
      return { error: 'Task tidak valid untuk project ini.' }
    }
  }

  const { error } = await supabase.from('project_expenses').insert({
    project_id: projectId,
    task_id: taskId,
    category,
    description,
    amount: amountRaw,
    currency_code: currency,
    expense_date: expenseDate,
    receipt_url: receiptUrl,
    submitted_by: user.id,
  })

  if (error) return { error: error.message }

  invalidateExpenseCaches()
  return { ok: true }
}

export async function approveExpense(formData: FormData): Promise<void> {
  const profile = await loadMutationProfile()
  const denied = ensureExpenseReviewMutation(profile)
  if (denied) return

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const id = String(formData.get('id') ?? '').trim()
  if (!id) return

  const { error } = await supabase
    .from('project_expenses')
    .update({ status: 'approved', approved_by: user.id, rejection_note: null })
    .eq('id', id)
    .eq('status', 'pending')

  if (error) return

  invalidateExpenseCaches()
}

export async function rejectExpense(formData: FormData): Promise<void> {
  const profile = await loadMutationProfile()
  const denied = ensureExpenseReviewMutation(profile)
  if (denied) return

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const id = String(formData.get('id') ?? '').trim()
  const rejectionNote = String(formData.get('rejection_note') ?? '').trim()
  if (!id || !rejectionNote) return

  const { error } = await supabase
    .from('project_expenses')
    .update({ status: 'rejected', approved_by: user.id, rejection_note: rejectionNote })
    .eq('id', id)
    .eq('status', 'pending')

  if (error) return

  invalidateExpenseCaches()
}

export async function deleteExpense(formData: FormData): Promise<void> {
  const profile = await loadMutationProfile()
  const denied = ensureExpenseSubmitMutation(profile)
  if (denied) return

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const id = String(formData.get('id') ?? '').trim()
  if (!id) return

  const { error } = await supabase
    .from('project_expenses')
    .delete()
    .eq('id', id)
    .eq('submitted_by', user.id)
    .eq('status', 'pending')

  if (error) return

  invalidateExpenseCaches()
}
