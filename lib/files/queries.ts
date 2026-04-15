import { createServerClient } from '@/lib/supabase/server'
import type { ProjectFile } from '@/types/database'

// ─── Types ────────────────────────────────────────────────────

export type FileWithRelations = ProjectFile & {
  projects: { id: string; name: string; project_code: string } | null
  uploader: { id: string; full_name: string } | null
  tasks: { id: string; title: string } | null
  deliverables: { id: string; name: string } | null
}

// ─── List (all files, cross-project) ──────────────────────────

export async function getFiles(opts?: {
  search?: string
  file_category?: string
  project_id?: string
  provider?: string
}): Promise<FileWithRelations[]> {
  const supabase = await createServerClient()

  let query = supabase
    .from('project_files')
    .select(
      '*, projects(id, name, project_code), uploader:profiles!uploaded_by_user_id(id, full_name), tasks(id, title), deliverables(id, name)'
    )
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

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as FileWithRelations[]
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
