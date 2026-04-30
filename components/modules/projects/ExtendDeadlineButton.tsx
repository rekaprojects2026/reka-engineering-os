'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Loader2, X } from 'lucide-react'
import { extendDeadline } from '@/lib/deadline-changes/actions'

function tomorrowYmd(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

interface ExtendDeadlineButtonProps {
  projectId: string
  currentDueDate: string | null
}

export function ExtendDeadlineButton({ projectId, currentDueDate }: ExtendDeadlineButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const minDate = useMemo(() => tomorrowYmd(), [open])

  function handleClose() {
    setOpen(false)
    setError(null)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = e.currentTarget
    const newDue = (form.elements.namedItem('new_due_date') as HTMLInputElement)?.value
    const reason = (form.elements.namedItem('reason') as HTMLTextAreaElement)?.value?.trim()
    if (!newDue) {
      setError('Pilih tanggal jatuh tempo baru.')
      return
    }
    if (!reason) {
      setError('Alasan wajib diisi.')
      return
    }

    startTransition(async () => {
      try {
        await extendDeadline('project', projectId, newDue, reason)
        handleClose()
        form.reset()
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal memperbarui deadline.')
      }
    })
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '5px',
    fontSize: '0.75rem',
    fontWeight: 500,
    color: 'var(--color-text-muted)',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    minHeight: '36px',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-control)',
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-text-primary)',
    padding: '0 10px',
    fontSize: '0.8125rem',
    outline: 'none',
  }

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    minHeight: '5rem',
    padding: '8px 10px',
    resize: 'vertical',
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 text-[0.75rem] font-medium text-[var(--color-text-secondary)] shadow-sm transition-colors hover:bg-[var(--color-surface-subtle)]"
        title={currentDueDate ? 'Perpanjang target due date' : 'Set target due date'}
      >
        <Calendar size={12} aria-hidden="true" />
        Extend
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose()
          }}
          role="presentation"
        >
          <div
            className="max-h-[90vh] w-full max-w-[480px] overflow-y-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="extend-deadline-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2
                  id="extend-deadline-title"
                  className="m-0 text-base font-bold text-[var(--color-text-primary)]"
                >
                  Extend deadline
                </h2>
                <p className="mt-1 text-[0.8125rem] text-[var(--color-text-muted)]">
                  Tanggal saat ini: {currentDueDate || '—'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="shrink-0 border-0 bg-transparent p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div
                className="mb-4 rounded-md border border-[var(--color-danger)] bg-[var(--color-danger-subtle)] px-3 py-2 text-[0.8125rem] text-[var(--color-danger)]"
                role="alert"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              <div>
                <label htmlFor="new_due_date" style={labelStyle}>
                  New Due Date *
                </label>
                <input
                  id="new_due_date"
                  name="new_due_date"
                  type="date"
                  required
                  min={minDate}
                  className="w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-2 text-[0.8125rem] text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--color-primary-subtle)]"
                />
              </div>
              <div>
                <label htmlFor="reason" style={labelStyle}>
                  Reason *
                </label>
                <textarea
                  id="reason"
                  name="reason"
                  required
                  rows={3}
                  placeholder="Kenapa deadline dimundurkan?"
                  style={textareaStyle}
                />
              </div>
              <div className="mt-1 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-[0.8125rem] font-medium text-[var(--color-text-secondary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 rounded-[var(--radius-control)] border-0 bg-[var(--color-primary)] px-4 py-2 text-[0.8125rem] font-semibold text-[var(--color-primary-fg)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isPending ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Saving…
                    </>
                  ) : (
                    'Extend Deadline'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
