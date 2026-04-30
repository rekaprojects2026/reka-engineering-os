'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { markProjectProblematic } from '@/lib/projects/actions'

interface ProjectProblematicBannerProps {
  projectId: string
  problemNote: string | null
  canResolve: boolean
}

export function ProjectProblematicBanner({ projectId, problemNote, canResolve }: ProjectProblematicBannerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleResolve() {
    if (typeof window !== 'undefined' && !window.confirm('Tandai sebagai sudah resolved?')) return
    setError(null)
    startTransition(async () => {
      try {
        await markProjectProblematic(projectId, false, null)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Gagal memperbarui.')
      }
    })
  }

  return (
    <div
      className="rounded-lg border border-[var(--color-warning)] bg-[var(--color-warning-subtle)] px-4 py-3"
      role="status"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="m-0 max-w-3xl text-[0.8125rem] leading-relaxed text-[var(--color-text-primary)]">
          <span className="font-semibold text-[var(--color-warning)]" aria-hidden>
            ⚠{' '}
          </span>
          Project ini ditandai bermasalah:{' '}
          {problemNote?.trim() ? (
            <span className="whitespace-pre-wrap text-[var(--color-text-secondary)]">{problemNote}</span>
          ) : (
            <span className="text-[var(--color-text-muted)]">(tanpa catatan)</span>
          )}
        </p>
        {canResolve ? (
          <div className="flex shrink-0 flex-col items-end gap-0.5">
            <button
              type="button"
              onClick={handleResolve}
              disabled={isPending}
              className="whitespace-nowrap rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[0.75rem] font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-subtle)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Menyimpan…
                </span>
              ) : (
                'Tandai resolved'
              )}
            </button>
            {error && (
              <span className="text-[0.6875rem] text-[var(--color-danger)]" role="alert">
                {error}
              </span>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
