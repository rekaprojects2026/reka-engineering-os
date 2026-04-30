import { createServerClient } from '@/lib/supabase/server'
import type { ProjectNoteListItem } from '@/lib/project-notes/types'
import { displayAuthorName, displayEditorName } from '@/lib/project-notes/types'

export type { ProjectNoteListItem }
export { displayAuthorName, displayEditorName }

export async function getProjectNotes(projectId: string): Promise<ProjectNoteListItem[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('project_notes')
    .select(
      `
      id, project_id, title, content, content_text, created_by, updated_by, created_at, updated_at,
      author:profiles!created_by(full_name),
      editor:profiles!updated_by(full_name)
    `,
    )
    .eq('project_id', projectId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as ProjectNoteListItem[]
}

export async function getProjectNoteById(id: string): Promise<ProjectNoteListItem | null> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('project_notes')
    .select(
      `
      id, project_id, title, content, content_text, created_by, updated_by, created_at, updated_at,
      author:profiles!created_by(full_name),
      editor:profiles!updated_by(full_name)
    `,
    )
    .eq('id', id)
    .maybeSingle()

  if (error || !data) return null
  return data as ProjectNoteListItem
}
