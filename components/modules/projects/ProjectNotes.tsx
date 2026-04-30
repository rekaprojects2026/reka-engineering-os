'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import type { ProjectNoteListItem } from '@/lib/project-notes/types'
import { displayAuthorName } from '@/lib/project-notes/types'
import { createProjectNote, deleteProjectNote, updateProjectNote } from '@/lib/project-notes/actions'
import { ProjectNoteEditor } from '@/components/modules/projects/ProjectNoteEditor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDebounce } from '@/hooks/useDebounce'
import { formatRelativeTime } from '@/lib/utils/formatters'

interface ProjectNotesProps {
  notes: ProjectNoteListItem[]
  projectId: string
  canUseNotes: boolean
  canDeleteNote: boolean
}

export function ProjectNotes({ notes, projectId, canUseNotes, canDeleteNote }: ProjectNotesProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedId, setSelectedId] = useState<string | null>(() => notes[0]?.id ?? null)
  const selected = notes.find((n) => n.id === selectedId) ?? null

  const [titleDraft, setTitleDraft] = useState(selected?.title ?? '')
  const debouncedTitle = useDebounce(titleDraft, 800)

  useEffect(() => {
    setTitleDraft(selected?.title ?? '')
  }, [selected?.id, selected?.title])

  useEffect(() => {
    if (!selected || debouncedTitle.trim() === '' || debouncedTitle === selected.title) return
    startTransition(async () => {
      const res = await updateProjectNote(selected.id, { title: debouncedTitle.trim() })
      if ('error' in res) console.error(res.error)
      else router.refresh()
    })
  }, [debouncedTitle, selected?.id, selected?.title, router])

  async function handleNewNote() {
    if (!canUseNotes) return
    startTransition(async () => {
      const res = await createProjectNote(projectId, 'Untitled')
      if ('error' in res) {
        alert(res.error)
        return
      }
      setSelectedId(res.id)
      router.refresh()
    })
  }

  async function handleDelete(id: string) {
    if (!canDeleteNote) return
    if (!window.confirm('Hapus note ini?')) return
    startTransition(async () => {
      const res = await deleteProjectNote(id, projectId)
      if ('error' in res) {
        alert(res.error)
        return
      }
      if (selectedId === id) setSelectedId(null)
      router.refresh()
    })
  }

  return (
    <div className="grid min-h-[480px] grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]">
      <div className="flex flex-col rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-[0.75rem] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            Notes
          </span>
          {canUseNotes && (
            <Button type="button" size="sm" variant="outline" className="h-7 gap-1" onClick={() => void handleNewNote()} disabled={isPending}>
              <Plus size={12} aria-hidden />
              Baru
            </Button>
          )}
        </div>
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {notes.length === 0 ? (
            <li className="text-[0.8125rem] text-[var(--color-text-muted)]">Belum ada note.</li>
          ) : (
            notes.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(n.id)}
                  className={`flex w-full flex-col items-start rounded-md px-2 py-2 text-left text-[0.8125rem] transition-colors ${
                    selectedId === n.id
                      ? 'bg-[var(--color-primary)] text-[var(--color-primary-fg)]'
                      : 'hover:bg-[var(--color-surface-muted)] text-[var(--color-text-primary)]'
                  }`}
                >
                  <span className="line-clamp-2 font-medium">{n.title}</span>
                  <span
                    className={`mt-0.5 text-[0.6875rem] ${selectedId === n.id ? 'text-[var(--color-primary-fg)]/80' : 'text-[var(--color-text-muted)]'}`}
                  >
                    {formatRelativeTime(n.updated_at)}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="flex min-w-0 flex-col rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        {!selected ? (
          <p className="text-[0.875rem] text-[var(--color-text-muted)]">Pilih note di kiri atau buat note baru.</p>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
              <Input
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                disabled={!canUseNotes || isPending}
                className="max-w-xl text-[1rem] font-semibold"
                aria-label="Judul note"
              />
              {canDeleteNote && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-[var(--color-danger)]"
                  disabled={isPending}
                  onClick={() => void handleDelete(selected.id)}
                >
                  <Trash2 size={14} className="mr-1" aria-hidden />
                  Hapus
                </Button>
              )}
            </div>
            <p className="mb-2 text-[0.75rem] text-[var(--color-text-muted)]">
              {displayAuthorName(selected) ? `Dibuat oleh ${displayAuthorName(selected)}` : null}
            </p>
            {canUseNotes ? (
              <ProjectNoteEditor key={selected.id} note={selected} />
            ) : (
              <p className="text-[0.8125rem] text-[var(--color-text-muted)]">Anda tidak memiliki akses mengedit note.</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
