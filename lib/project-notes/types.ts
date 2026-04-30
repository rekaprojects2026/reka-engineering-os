export type ProjectNoteListItem = {
  id: string
  project_id: string
  title: string
  content: unknown
  content_text: string | null
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
  author: { full_name: string } | { full_name: string }[] | null
  editor: { full_name: string } | { full_name: string }[] | null
}

function oneName(
  row: { full_name: string } | { full_name: string }[] | null | undefined,
): string | null {
  if (!row) return null
  const x = Array.isArray(row) ? row[0] : row
  return x?.full_name ?? null
}

export function displayAuthorName(note: ProjectNoteListItem): string | null {
  return oneName(note.author)
}

export function displayEditorName(note: ProjectNoteListItem): string | null {
  return oneName(note.editor)
}
