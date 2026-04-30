import { createServerClient } from '@/lib/supabase/server'
import type { ProjectFile } from '@/types/database'

// ─── Types ────────────────────────────────────────────────────

export type FileWithRelations = ProjectFile & {
  projects: { id: string; name: string; project_code: string } | null
  uploader: { id: string; full_name: string } | null
  tasks: { id: string; title: string } | null
  deliverables: { id: string; name: string } | null
}

export interface GetFilesResult {
  rows: FileWithRelations[]
  count: number
}

// ─── List (all files, cross-project) ──────────────────────────

export async function getFiles(opts?: {
  search?: string
  file_category?: string
  project_id?: string
  provider?: string
  /**
   * Non-admin list pages: files the user uploaded or attached to a project they can view
   * (matches userCanViewFile). Omitted for admin-wide lists.
   */
  restrictToUserPortfolio?: { userId: string; projectIds: string[] }
  page?: number
  pageSize?: number
}): Promise<GetFilesResult> {
  const supabase = await createServerClient()

  const selectCols =
    '*, projects(id, name, project_code), uploader:profiles!uploaded_by_user_id(id, full_name), tasks(id, title), deliverables(id, name)'

  const paginate = opts?.page != null && opts?.pageSize != null
  const page = opts?.page ?? 1
  const pageSize = opts?.pageSize ?? 50
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('project_files')
    .select(selectCols, paginate ? { count: 'exact' } : undefined)
    .order('created_at', { ascending: false })

  if (opts?.file_category && opts.file_category !== 'all') {
    query = query.eq('file_category', opts.file_category)
  }
  if (opts?.project_id) {
    query = query.eq('project_id', opts.project_id)
  }
  if (opts?.provider && opts.provider !== 'all') {
    query = query.eq('provider', opts.provider)
  }
  if (opts?.search) {
    query = query.or(`file_name.ilike.%${opts.search}%`)
  }

  if (opts?.restrictToUserPortfolio) {
    const { userId, projectIds } = opts.restrictToUserPortfolio
    if (projectIds.length === 0) {
      query = query.eq('uploaded_by_user_id', userId)
    } else {
      query = query.or(`uploaded_by_user_id.eq.${userId},project_id.in.(${projectIds.join(',')})`)
    }
  }

  if (paginate) {
    query = query.range(from, to)
  }

  const { data, error, count } = await query
  if (error) throw new Error(error.message)
  const rows = (data ?? []) as unknown as FileWithRelations[]
  return { rows, count: paginate ? count ?? 0 : rows.length }
}

// ─── Single ───────────────────────────────────────────────────

export async function getFileById(id: string): Promise<FileWithRelations | null> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('project_files')
    .select(
      '*, projects(id, name, project_code), uploader:profiles!uploaded_by_user_id(id, full_name), tasks(id, title), deliverables(id, name)'
    )
    .eq('id', id)
    .single()

  if (error) return null
  return data as unknown as FileWithRelations
}

// ─── By Project ───────────────────────────────────────────────

export async function getFilesByProjectId(projectId: string): Promise<FileWithRelations[]> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('project_files')
    .select(
      '*, projects(id, name, project_code), uploader:profiles!uploaded_by_user_id(id, full_name), tasks(id, title), deliverables(id, name)'
    )
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) return []
  return (data ?? []) as unknown as FileWithRelations[]
}

/** Next sequence (001, 002, …) for files with same project + discipline + doc type. */
export async function getNextFileSequenceNumber(
  projectId: string,
  disciplineCode: string,
  docTypeCode: string,
): Promise<number> {
  const supabase = await createServerClient()
  const { count, error } = await supabase
    .from('project_files')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('discipline_code', disciplineCode)
    .eq('doc_type_code', docTypeCode)

  if (error) return 1
  return (count ?? 0) + 1
}

/** Suggested revision index (0-based) from existing files with same triple. */
export async function getSuggestedRevisionIndex(
  projectId: string,
  disciplineCode: string,
  docTypeCode: string,
): Promise<number> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('project_files')
    .select('revision_number')
    .eq('project_id', projectId)
    .eq('discipline_code', disciplineCode)
    .eq('doc_type_code', docTypeCode)

  if (error || !data?.length) return 0

  let max = -1
  for (const row of data as { revision_number: number | null }[]) {
    const n = row.revision_number
    if (n != null && n > max) max = n
  }
  return max + 1
}
