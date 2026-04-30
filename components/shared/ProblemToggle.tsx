'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

type OnMark = (id: string, isProblematic: boolean, note?: string | null) => Promise<void>

interface ProblemToggleProps {
  entityId: string
  entityType: 'project' | 'task'
  isProblematic: boolean
  problemNote: string | null
  onMark: OnMark
}

const ghostBtn =
  'inline-flex items-center gap-1 rounded border border-[var(--color-border)] bg-transparent px-2 py-0.5 text-[0.75rem] font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-subtle)]'
const redBtn =
  'inline-flex items-center justify-center gap-1 rounded border border-[var(--color-danger)] bg-[var(--color-danger-subtle)] px-2.5 py-1 text-[0.75rem] font-semibold text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger)]/20 disabled:cursor-not-allowed disabled:opacity-60'
const textareaClass =
  'mt-1.5 w-full min-h-[4rem] resize-y rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-[0.8125rem] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary-subtle)]'

export function ProblemToggle({
  entityId,
  entityType,
  isProblematic,
  problemNote,
  onMark,
}: ProblemToggleProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)

  const compact = entityType === 'task'

  function runResolve() {
    if (typeof window !== 'undefined' && !window.confirm('Tandai sebagai sudah resolved?')) return
    setError(null)
    startTransition(async () => {
      try {
        await onMark(entityId, false, null)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Gagal memperbarui.')
      }
    })
  }

  function submitMark(e: React.FormEvent) {
    e.preventDefault()
    const text = draft.trim()
    if (!text) {
      setError('Deskripsi masalah wajib diisi.')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await onMark(entityId, true, text)
        setShowForm(false)
        setDraft('')
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal menyimpan.')
      }
    })
  }

  if (isProblematic) {
    return (
      <div className={cn(compact && 'inline-flex max-w-[11rem] flex-col')}>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            runResolve()
          }}
          disabled={isPending}
          title={problemNote?.trim() ? problemNote : 'Problem — klik untuk resolve'}
          className={cn(
            'inline-flex w-fit max-w-full items-center gap-0.5 rounded border border-[var(--color-danger)] bg-[var(--color-danger-subtle)] px-1.5 py-0.5 text-left text-[0.6875rem] font-semibold text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger)]/25 disabled:cursor-not-allowed disabled:opacity-60',
            compact && 'text-[0.625rem] leading-tight',
          )}
        >
          {isPending ? <Loader2 className="h-2.5 w-2.5 shrink-0 animate-spin" /> : <span aria-hidden>⚠</span>}
          <span className="truncate">Problem</span>
        </button>
        {error && (
          <span className="mt-0.5 text-[0.625rem] text-[var(--color-danger)]" role="alert">
            {error}
          </span>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(compact && 'min-w-0 max-w-[12rem]')}
      onClick={(e) => e.stopPropagation()}
    >
      {!showForm ? (
        <button
          type="button"
          onClick={() => {
            setError(null)
            setShowForm(true)
          }}
          className={ghostBtn}
        >
          <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />
          Mark Problem
        </button>
      ) : (
        <form onSubmit={submitMark} className="min-w-0">
          <label className="text-[0.6875rem] font-medium text-[var(--color-text-muted)]">Describe the problem</label>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            required
            className={textareaClass}
            rows={compact ? 2 : 3}
            placeholder="What went wrong?"
          />
          {error && (
            <p className="mt-0.5 text-[0.6875rem] text-[var(--color-danger)]" role="alert">
              {error}
            </p>
          )}
          <div className="mt-1.5 flex flex-wrap items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setDraft('')
                setError(null)
              }}
              className="rounded px-2 py-0.5 text-[0.6875rem] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)]"
            >
              Cancel
            </button>
            <button type="submit" disabled={isPending} className={redBtn}>
              {isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                  Mark as Problem
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
