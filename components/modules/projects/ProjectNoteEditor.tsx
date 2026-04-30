'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { MantineProvider } from '@mantine/core'
import '@mantine/core/styles.css'
import type { PartialBlock } from '@blocknote/core'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/mantine/style.css'
import { useCreateBlockNote } from '@blocknote/react'
import { useDebounce } from '@/hooks/useDebounce'
import { updateProjectNote } from '@/lib/project-notes/actions'
import type { ProjectNoteListItem } from '@/lib/project-notes/types'
import { displayEditorName } from '@/lib/project-notes/types'
import { formatRelativeTime } from '@/lib/utils/formatters'

function toInitialContent(raw: unknown): PartialBlock[] | undefined {
  if (raw == null) return undefined
  if (Array.isArray(raw)) return raw as PartialBlock[]
  if (typeof raw === 'object' && raw !== null && 'content' in raw && Array.isArray((raw as { content: unknown }).content)) {
    return (raw as { content: PartialBlock[] }).content
  }
  return undefined
}

export function ProjectNoteEditor({ note }: { note: ProjectNoteListItem }) {
  const initial = useMemo(() => toInitialContent(note.content), [note.content, note.id])

  const editor = useCreateBlockNote(
    {
      initialContent: initial,
    },
    [note.id],
  )

  const [dirtyTick, setDirtyTick] = useState(0)
  const debouncedDirty = useDebounce(dirtyTick, 2000)
  const userEdited = useRef(false)

  useEffect(() => {
    userEdited.current = false
  }, [note.id])

  useEffect(() => {
    const unsub = editor.onChange(() => {
      userEdited.current = true
      setDirtyTick((n) => n + 1)
    })
    return () => {
      unsub()
    }
  }, [editor])

  useEffect(() => {
    if (!userEdited.current) return
    void (async () => {
      const md = editor.blocksToMarkdownLossy(editor.document)
      const contentText = md.length > 12000 ? md.slice(0, 12000) : md
      const content = JSON.parse(JSON.stringify(editor.document)) as unknown
      const res = await updateProjectNote(note.id, { content, contentText })
      if ('error' in res) {
        console.error(res.error)
      }
    })()
  }, [debouncedDirty, editor, note.id])

  const editorName = displayEditorName(note)

  return (
    <MantineProvider defaultColorScheme="light">
      <div className="min-h-[320px] rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2">
        <BlockNoteView editor={editor} theme="light" />
      </div>
      <p className="mt-2 text-[0.75rem] text-[var(--color-text-muted)]">
        Auto-save setelah berhenti mengetik · Terakhir diperbarui {formatRelativeTime(note.updated_at)}
        {editorName ? ` · ${editorName}` : ''}
      </p>
    </MantineProvider>
  )
}
