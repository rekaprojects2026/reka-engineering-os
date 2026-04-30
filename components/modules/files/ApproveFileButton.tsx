'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { approveFile } from '@/lib/files/actions'
import { Loader2 } from 'lucide-react'

export function ApproveFileButton({ fileId }: { fileId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="inline-flex flex-col items-start gap-0.5">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setError(null)
          startTransition(async () => {
            try {
              await approveFile(fileId)
              router.refresh()
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Gagal menyetujui file.')
            }
          })
        }}
        className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 py-0.5 text-[0.6875rem] font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-subtle)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? (
          <span className="inline-flex items-center gap-1">
            <Loader2 className="h-2.5 w-2.5 animate-spin" />
            …
          </span>
        ) : (
          'Approve'
        )}
      </button>
      {error && (
        <span className="max-w-[8rem] text-[0.625rem] text-[var(--color-danger)]" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
