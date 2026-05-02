'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { approveProject, rejectProject } from '@/lib/projects/actions'
import { formatDate } from '@/lib/utils/formatters'
import type { ProjectWithRelations } from '@/lib/projects/queries'

type Props = {
  project: ProjectWithRelations
  isDirektur: boolean
  showResubmitCta: boolean
}

export function ProjectApprovalBanner({ project, isDirektur, showResubmitCta }: Props) {
  const router = useRouter()
  const [rejectNote, setRejectNote] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  if (project.status === 'pending_approval') {
    return (
      <div
        className="mb-6 rounded-lg border px-4 py-3"
        style={{
          borderColor: 'var(--color-border-strong)',
          backgroundColor: 'var(--color-warning-subtle)',
        }}
      >
        <p className="m-0 text-[0.8125rem] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Menunggu persetujuan Direktur
        </p>
        {project.approval_requested_at ? (
          <p className="mt-1 m-0 text-[0.75rem]" style={{ color: 'var(--color-text-muted)' }}>
            Diajukan {formatDate(project.approval_requested_at)}
          </p>
        ) : null}
        {isDirektur ? (
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setErr(null)
                  startTransition(async () => {
                    const r = await approveProject(project.id)
                    if (r.error) setErr(r.error)
                    else router.refresh()
                  })
                }}
                className="btn-primary inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-[0.8125rem] font-semibold disabled:opacity-50"
              >
                {pending ? <Loader2 size={14} className="animate-spin" aria-hidden /> : null}
                Setujui
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setShowReject((v) => !v)
                  setErr(null)
                }}
                className="btn-secondary rounded-md px-4 py-2 text-[0.8125rem] font-medium disabled:opacity-50"
              >
                Tolak
              </button>
              <Link
                href={`/projects/${project.id}/edit`}
                className="btn-secondary inline-flex items-center justify-center rounded-md px-4 py-2 text-[0.8125rem] font-medium no-underline"
              >
                Revisi &amp; setujui
              </Link>
            </div>
            {showReject ? (
              <div className="min-w-0 flex-1 space-y-2">
                <label className="block text-[0.75rem] font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  Catatan penolakan <span className="text-[var(--color-danger)]">*</span>
                </label>
                <textarea
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-[0.8125rem] text-[var(--text-primary-neutral)] outline-none transition-[border-color,background-color,box-shadow] placeholder:text-[var(--input-placeholder)] focus:border-[var(--input-focus-border)] focus:bg-[var(--input-bg-focus)] focus:ring-[3px] focus:ring-[color:var(--input-focus-ring)]"
                  placeholder="Jelaskan alasan penolakan…"
                />
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    setErr(null)
                    startTransition(async () => {
                      const r = await rejectProject(project.id, rejectNote)
                      if (r.error) setErr(r.error)
                      else {
                        setShowReject(false)
                        setRejectNote('')
                        router.refresh()
                      }
                    })
                  }}
                  className="rounded-md border border-[var(--color-danger)] bg-[var(--color-danger-subtle)] px-3 py-1.5 text-[0.75rem] font-semibold text-[var(--color-danger)] disabled:opacity-50"
                >
                  Kirim penolakan
                </button>
              </div>
            ) : null}
            {err ? (
              <p className="m-0 w-full text-[0.75rem] text-[var(--color-danger)]" role="alert">
                {err}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="mt-2 m-0 text-[0.75rem]" style={{ color: 'var(--color-text-muted)' }}>
            Tim operasional tidak dapat mengubah tugas atau deliverable sampai disetujui.
          </p>
        )}
      </div>
    )
  }

  if (project.status === 'rejected') {
    return (
      <div
        className="mb-6 rounded-lg border px-4 py-3"
        style={{
          borderColor: 'var(--color-danger)',
          backgroundColor: 'var(--color-danger-subtle)',
        }}
      >
        <p className="m-0 text-[0.8125rem] font-semibold text-[var(--color-danger)]">Project ditolak</p>
        {project.rejection_note ? (
          <p className="mt-2 m-0 whitespace-pre-wrap text-[0.8125rem]" style={{ color: 'var(--color-text-primary)' }}>
            {project.rejection_note}
          </p>
        ) : null}
        {project.approval_reviewed_at ? (
          <p className="mt-2 m-0 text-[0.75rem]" style={{ color: 'var(--color-text-muted)' }}>
            Ditinjau {formatDate(project.approval_reviewed_at)}
          </p>
        ) : null}
        {showResubmitCta ? (
          <div className="mt-3">
            <Link
              href={`/projects/${project.id}/edit?mode=resubmit`}
              className="btn-primary inline-flex rounded-md px-4 py-2 text-[0.8125rem] font-semibold no-underline"
            >
              Perbaiki &amp; ajukan ulang
            </Link>
          </div>
        ) : (
          <p className="mt-2 m-0 text-[0.75rem]" style={{ color: 'var(--color-text-muted)' }}>
            Hubungi Technical Director atau Manajer proyek untuk perbaikan dan pengajuan ulang.
          </p>
        )}
      </div>
    )
  }

  return null
}
