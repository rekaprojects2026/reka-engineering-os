'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { TERMIN_STATUSES } from '@/lib/constants/statuses'
import type { ProjectTermin, TerminStatus } from '@/types/database'
import { formatMoney } from '@/lib/utils/formatters'
import {
  claimTermin,
  submitTerminForVerification,
  verifyTermin,
  markTerminInvoiced,
  markTerminBastSigned,
  markTerminClientSigned,
  markTerminPaid,
} from '@/lib/termins/actions'

const FLOW: TerminStatus[] = [
  'BELUM_DIMULAI',
  'SIAP_DIKLAIM',
  'MENUNGGU_VERIFIKASI',
  'INVOICE_DITERBITKAN',
  'MENUNGGU_TTD_CLIENT',
  'MENUNGGU_PEMBAYARAN',
  'LUNAS',
]

type Props = {
  termins: ProjectTermin[]
  isManajerLead: boolean
  isTDOrDirektur: boolean
  isFinance: boolean
}

function TerminStatusBadge({ status }: { status: string }) {
  const key = status as keyof typeof TERMIN_STATUSES
  const cfg = TERMIN_STATUSES[key] ?? { label: status, variant: 'neutral' as const }
  return <StatusBadge label={cfg.label} variant={cfg.variant} dot />
}

function ProgressTracker({ status }: { status: TerminStatus }) {
  const idx = Math.max(0, FLOW.indexOf(status))
  return (
    <div className="mb-6 overflow-x-auto">
      <div className="flex min-w-[640px] items-center gap-1">
        {FLOW.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-1">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-bold"
              style={{
                backgroundColor: i <= idx ? 'var(--color-primary)' : 'var(--color-surface-muted)',
                color: i <= idx ? 'var(--color-primary-fg)' : 'var(--color-text-muted)',
              }}
            >
              {i + 1}
            </div>
            {i < FLOW.length - 1 ? (
              <div
                className="h-0.5 min-w-[8px] flex-1"
                style={{
                  backgroundColor: i < idx ? 'var(--color-primary)' : 'var(--color-border)',
                }}
              />
            ) : null}
          </div>
        ))}
      </div>
      <p className="mt-2 text-[0.6875rem] text-[var(--color-text-muted)]">
        Status saat ini: <TerminStatusBadge status={status} />
      </p>
    </div>
  )
}

export function TerminTable({ termins, isManajerLead, isTDOrDirektur, isFinance }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [err, setErr] = useState<string | null>(null)
  const [invoiceDraft, setInvoiceDraft] = useState<Record<string, string>>({})

  function run(action: () => Promise<{ error?: string }>) {
    setErr(null)
    startTransition(async () => {
      const r = await action()
      if (r.error) setErr(r.error)
      else router.refresh()
    })
  }

  if (termins.length === 0) {
    return (
      <p className="text-[0.8125rem] text-[var(--color-text-muted)]">
        Belum ada termin. Pastikan nilai kontrak terisi dan project sudah disetujui (status aktif).
      </p>
    )
  }

  const maxIdx = termins.reduce((m, t) => {
    const i = FLOW.indexOf(t.status as TerminStatus)
    return Math.max(m, i < 0 ? 0 : i)
  }, 0)
  const maxStatus = (FLOW[maxIdx] ?? 'BELUM_DIMULAI') as TerminStatus

  return (
    <div>
      <ProgressTracker status={maxStatus} />
      {err ? (
        <p className="mb-4 text-[0.8125rem] text-[var(--color-danger)]" role="alert">
          {err}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
        <table className="w-full min-w-[720px] border-collapse text-left text-[0.8125rem]">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
              <th className="px-3 py-2.5 font-semibold text-[var(--color-text-secondary)]">Termin</th>
              <th className="px-3 py-2.5 font-semibold text-[var(--color-text-secondary)]">Nilai</th>
              <th className="px-3 py-2.5 font-semibold text-[var(--color-text-secondary)]">Trigger</th>
              <th className="px-3 py-2.5 font-semibold text-[var(--color-text-secondary)]">Status</th>
              <th className="px-3 py-2.5 font-semibold text-[var(--color-text-secondary)]">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {termins.map((t) => (
              <tr key={t.id} className="border-b border-[var(--color-border)] last:border-0">
                <td className="px-3 py-2.5 align-top text-[var(--color-text-primary)]">
                  <span className="font-mono text-[0.75rem] text-[var(--color-text-muted)]">#{t.termin_number}</span>{' '}
                  {t.label}
                  {t.is_retention ? (
                    <span className="ml-1 text-[0.6875rem] text-[var(--color-text-muted)]">(retensi)</span>
                  ) : null}
                </td>
                <td className="px-3 py-2.5 align-top text-[var(--color-text-secondary)]">
                  {t.amount != null ? (
                    <>
                      {t.percentage}% · {formatMoney(Number(t.amount), t.currency)}
                    </>
                  ) : (
                    `${t.percentage}%`
                  )}
                </td>
                <td className="max-w-[200px] px-3 py-2.5 align-top text-[var(--color-text-muted)]">
                  {t.trigger_condition ?? '—'}
                </td>
                <td className="px-3 py-2.5 align-top">
                  <TerminStatusBadge status={t.status} />
                </td>
                <td className="px-3 py-2.5 align-top">
                  <TerminRowActions
                    termin={t}
                    isManajerLead={isManajerLead}
                    isTDOrDirektur={isTDOrDirektur}
                    isFinance={isFinance}
                    pending={pending}
                    invoiceDraft={invoiceDraft[t.id] ?? ''}
                    setInvoiceDraft={(v) => setInvoiceDraft((d) => ({ ...d, [t.id]: v }))}
                    run={run}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TerminRowActions({
  termin,
  isManajerLead,
  isTDOrDirektur,
  isFinance,
  pending,
  invoiceDraft,
  setInvoiceDraft,
  run,
}: {
  termin: ProjectTermin
  isManajerLead: boolean
  isTDOrDirektur: boolean
  isFinance: boolean
  pending: boolean
  invoiceDraft: string
  setInvoiceDraft: (v: string) => void
  run: (a: () => Promise<{ error?: string }>) => void
}) {
  const btn =
    'inline-flex items-center justify-center gap-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-2.5 py-1 text-[0.75rem] font-medium text-[var(--color-text-primary)] disabled:opacity-50'

  if (termin.status === 'BELUM_DIMULAI' && isManajerLead) {
    return (
      <button type="button" disabled={pending} className={btn} onClick={() => run(() => claimTermin(termin.id))}>
        {pending ? <Loader2 size={12} className="animate-spin" /> : null}
        Tandai siap diklaim
      </button>
    )
  }

  if (termin.status === 'SIAP_DIKLAIM' && isManajerLead) {
    return (
      <button
        type="button"
        disabled={pending}
        className={btn}
        onClick={() => run(() => submitTerminForVerification(termin.id))}
      >
        {pending ? <Loader2 size={12} className="animate-spin" /> : null}
        Ajukan verifikasi
      </button>
    )
  }

  if (termin.status === 'MENUNGGU_VERIFIKASI' && isTDOrDirektur) {
    return (
      <button type="button" disabled={pending} className={btn} onClick={() => run(() => verifyTermin(termin.id))}>
        {pending ? <Loader2 size={12} className="animate-spin" /> : null}
        Verifikasi
      </button>
    )
  }

  if (termin.status === 'INVOICE_DITERBITKAN') {
    return (
      <div className="flex flex-col gap-2">
        {isTDOrDirektur ? (
          <button
            type="button"
            disabled={pending}
            className={btn}
            onClick={() => run(() => markTerminBastSigned(termin.id))}
          >
            TTD BAST
          </button>
        ) : null}
        {isFinance ? (
          <div className="flex flex-wrap items-center gap-1">
            <input
              type="text"
              placeholder="UUID invoice"
              value={invoiceDraft}
              onChange={(e) => setInvoiceDraft(e.target.value)}
              className="h-8 min-w-[140px] flex-1 rounded border border-[var(--input-border)] bg-[var(--input-bg)] px-2 text-[0.75rem] text-[var(--text-primary-neutral)] outline-none transition-[border-color,background-color,box-shadow] focus:border-[var(--input-focus-border)] focus:bg-[var(--input-bg-focus)] focus:ring-[3px] focus:ring-[color:var(--input-focus-ring)]"
            />
            <button
              type="button"
              disabled={pending || !invoiceDraft.trim()}
              className={btn}
              onClick={() => run(() => markTerminInvoiced(termin.id, invoiceDraft.trim()))}
            >
              Link invoice
            </button>
          </div>
        ) : null}
      </div>
    )
  }

  if (termin.status === 'MENUNGGU_TTD_CLIENT' && isFinance) {
    return (
      <button
        type="button"
        disabled={pending}
        className={btn}
        onClick={() => run(() => markTerminClientSigned(termin.id))}
      >
        Client sudah TTD
      </button>
    )
  }

  if (termin.status === 'MENUNGGU_PEMBAYARAN' && isFinance) {
    return (
      <button type="button" disabled={pending} className={btn} onClick={() => run(() => markTerminPaid(termin.id))}>
        Catat lunas
      </button>
    )
  }

  return <span className="text-[0.75rem] text-[var(--color-text-muted)]">—</span>
}
