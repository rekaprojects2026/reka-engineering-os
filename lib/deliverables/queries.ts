// Server-side query helpers for the Deliverables module
import { createServerClient } from '@/lib/supabase/server'
import type { Deliverable } from '@/types/database'

// ─── Types ────────────────────────────────────────────────────

export type DeliverableWithRelations = Deliverable & {
  projects: { id: string; name: string; project_code: string } | null
  preparer: { id: string; full_name: string } | null
  reviewer_profile: { id: string; full_name: string } | null
  linked_task: { id: string; title: string } | null
}

// ─── List (all deliverables, cross-project) ───────────────────

export async function getDeliverables(opts?: {
  search?: string
  status?: string
  type?: string
  project_id?: string
  /** Member scope: only deliverables prepared by this user */
  scopePreparerId?: string
  /** Reviewer scope: only deliverables where this user is reviewer */
  scopeReviewerId?: string
  /** Portfolio scope: only deliverables in these projects (e.g. coordinator) */
  scopeProjectIds?: string[]
}): Promise<DeliverableWithRelations[]> {
  const supabase = await createServerClient()

  let query = supabase
    .from('deliverables')
    .select(
      '*, projects(id, name, project_code), preparer:profiles!prepared_by_user_id(id, full_name), reviewer_profile:profiles!reviewed_by_user_id(id, full_name), linked_task:tasks!linked_task_id(id, title)'
    )
    .order('created_at', { ascending: false })

  if (opts?.status && opts.status !== 'all') {
    query = query.eq('status', opts.status)
  }
  if (opts?.type && opts.type !== 'all') {
    query = query.eq('type', opts.type)
  }
  if (opts?.project_id) {
    query = query.eq('project_id', opts.project_id)
  }
  if (opts?.search) {
    query = query.or(`name.ilike.%${opts.search}%`)
  }

  // Role-scoped filters
  if (opts?.scopePreparerId) {
    query = query.eq('prepared_by_user_id', opts.scopePreparerId)
  }
  if (opts?.scopeReviewerId) {
    query = query.eq('reviewed_by_user_id', opts.scopeReviewerId)
  }
  if (opts?.scopeProjectIds !== undefined) {
    if (opts.scopeProjectIds.length === 0) return []
    query = query.in('project_id', opts.scopeProjectIds)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as DeliverableWithRelations[]
}

// ─── Single ───────────────────────────────────────────────────

export async function getDeliverableById(id: string): Promise<DeliverableWithRelations | null> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('deliverables')
    .select(
      '*, projects(id, name, project_code), preparer:profiles!prepared_by_user_id(id, full_name), reviewer_profile:profiles!reviewed_by_user_id(id, full_name), linked_task:tasks!linked_task_id(id, title)'
    )
    .eq('id', id)
    .single()

  if (error) return null
  return data as unknown as DeliverableWithRelations
}

// ─── By Project ───────────────────────────────────────────────

export async function getDeliverablesByProjectId(projectId: string): Promise<DeliverableWithRelations[]> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('deliverables')
    .select(
      '*, projects(id, name, project_code), preparer:profiles!prepared_by_user_id(id, full_name), reviewer_profile:profiles!reviewed_by_user_id(id, full_name), linked_task:tasks!linked_task_id(id, title)'
    )
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) return []
  return (data ?? []) as unknown as DeliverableWithRelations[]
}
