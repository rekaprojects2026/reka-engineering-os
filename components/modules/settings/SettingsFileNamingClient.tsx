'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { parseCodeMap, type FileNamingConfig } from '@/lib/files/naming'
import { updateFileNamingConfig } from '@/lib/settings/actions'
import { FileNamingPreview } from '@/components/shared/FileNamingPreview'
import { cn } from '@/lib/utils/cn'

type Row = { value: string; label: string }

function serializeRows(rows: Row[]): string {
  return rows
    .map((r) => ({ value: r.value.trim(), label: r.label.trim() || r.value.trim() }))
    .filter((r) => r.value.length > 0)
    .map((r) => `${r.value}:${r.label}`)
    .join(',')
}

function CodeMapTable({
  title,
  rows,
  onChange,
  readOnly,
}: {
  title: string
  rows: Row[]
  onChange: (next: Row[]) => void
  readOnly: boolean
}) {
  const setRow = (i: number, patch: Partial<Row>) => {
    const next = rows.map((r, j) => (j === i ? { ...r, ...patch } : r))
    onChange(next)
  }

  return (
    <div className="mt-5">
      <h3 className="mb-2 text-[0.8125rem] font-semibold text-[var(--color-text-primary)]">{title}</h3>
      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-border)]">
        <table className="w-full border-collapse text-[0.8125rem]">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)]">
              <th className="px-3 py-2 text-left font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Kode</th>
              <th className="px-3 py-2 text-left font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Nama</th>
              {!readOnly && <th className="w-20 px-3 py-2" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {rows.map((row, i) => (
              <tr key={i}>
                <td className="px-3 py-2">
                  <input
                    value={row.value}
                    onChange={(e) => setRow(i, { value: e.target.value })}
                    disabled={readOnly}
                    className="h-9 w-full rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-2 font-mono text-[0.8125rem] text-[var(--text-primary-neutral)] outline-none transition-[border-color,background-color,box-shadow] placeholder:text-[var(--input-placeholder)] focus:border-[var(--input-focus-border)] focus:bg-[var(--input-bg-focus)] focus:ring-[3px] focus:ring-[color:var(--input-focus-ring)] disabled:opacity-60"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    value={row.label}
                    onChange={(e) => setRow(i, { label: e.target.value })}
                    disabled={readOnly}
                    className="h-9 w-full rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-2 text-[0.8125rem] text-[var(--text-primary-neutral)] outline-none transition-[border-color,background-color,box-shadow] placeholder:text-[var(--input-placeholder)] focus:border-[var(--input-focus-border)] focus:bg-[var(--input-bg-focus)] focus:ring-[3px] focus:ring-[color:var(--input-focus-ring)] disabled:opacity-60"
                  />
                </td>
                {!readOnly && (
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      className="text-[0.75rem] text-[var(--color-danger)] hover:underline"
                      onClick={() => onChange(rows.filter((_, j) => j !== i))}
                    >
                      Hapus
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!readOnly && (
        <button
          type="button"
          className="mt-2 text-[0.8125rem] font-medium text-[var(--color-primary)] hover:underline"
          onClick={() => onChange([...rows, { value: '', label: '' }])}
        >
          + Tambah baris
        </button>
      )}
    </div>
  )
}

const REVISION_OPTIONS: { value: string; label: string }[] = [
  { value: 'R0_RA_RB', label: 'R0 / RA / RB' },
  { value: 'Rev0_RevA_RevB', label: 'Rev0 / RevA / RevB' },
  { value: 'NUM', label: '00 / 01 / 02' },
]

export function SettingsFileNamingClient({
  initial,
  canEdit,
}: {
  initial: FileNamingConfig
  canEdit: boolean
}) {
  const [separator, setSeparator] = useState(initial.separator)
  const [revisionFormat, setRevisionFormat] = useState(initial.revision_format)
  const [disciplineRows, setDisciplineRows] = useState<Row[]>(() => parseCodeMap(initial.discipline_codes))
  const [docRows, setDocRows] = useState<Row[]>(() => parseCodeMap(initial.doc_type_codes))
  const [previewDisc, setPreviewDisc] = useState('MCH')
  const [previewDoc, setPreviewDoc] = useState('DR')
  const [previewSeq, setPreviewSeq] = useState(1)
  const [previewRev, setPreviewRev] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setSeparator(initial.separator)
    setRevisionFormat(initial.revision_format)
    setDisciplineRows(parseCodeMap(initial.discipline_codes))
    setDocRows(parseCodeMap(initial.doc_type_codes))
  }, [initial])

  const liveConfig: FileNamingConfig = useMemo(
    () => ({
      ...initial,
      separator,
      revision_format: revisionFormat,
      discipline_codes: serializeRows(disciplineRows),
      doc_type_codes: serializeRows(docRows),
    }),
    [initial, separator, revisionFormat, disciplineRows, docRows],
  )

  const disciplineOptions = useMemo(() => parseCodeMap(liveConfig.discipline_codes), [liveConfig.discipline_codes])
  const docTypeOptions = useMemo(() => parseCodeMap(liveConfig.doc_type_codes), [liveConfig.doc_type_codes])

  const save = useCallback(() => {
    setMessage(null)
    startTransition(async () => {
      const res = await updateFileNamingConfig({
        separator,
        revision_format: revisionFormat,
        discipline_codes: serializeRows(disciplineRows),
        doc_type_codes: serializeRows(docRows),
      })
      if (res.error) setMessage(res.error)
      else setMessage('Disimpan.')
    })
  }, [separator, revisionFormat, disciplineRows, docRows])

  const readOnly = !canEdit

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
        <h3 className="mb-2 text-[0.8125rem] font-semibold text-[var(--color-text-primary)]">Preview</h3>
        <FileNamingPreview config={liveConfig} discipline={previewDisc} docType={previewDoc} sequence={previewSeq} revision={previewRev} />
        <div className="mt-4 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
          <label className="flex flex-col gap-1 text-[0.75rem] font-medium text-[var(--color-text-muted)]">
            Disiplin (preview)
            <select
              value={previewDisc}
              onChange={(e) => setPreviewDisc(e.target.value)}
              className="h-9 rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-2 text-[0.8125rem] text-[var(--text-primary-neutral)] outline-none transition-[border-color,background-color,box-shadow] focus:border-[var(--input-focus-border)] focus:bg-[var(--input-bg-focus)] focus:ring-[3px] focus:ring-[color:var(--input-focus-ring)]"
            >
              {disciplineOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[0.75rem] font-medium text-[var(--color-text-muted)]">
            Tipe dokumen
            <select
              value={previewDoc}
              onChange={(e) => setPreviewDoc(e.target.value)}
              className="h-9 rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-2 text-[0.8125rem] text-[var(--text-primary-neutral)] outline-none transition-[border-color,background-color,box-shadow] focus:border-[var(--input-focus-border)] focus:bg-[var(--input-bg-focus)] focus:ring-[3px] focus:ring-[color:var(--input-focus-ring)]"
            >
              {docTypeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[0.75rem] font-medium text-[var(--color-text-muted)]">
            Nomor urut
            <input
              type="number"
              min={1}
              value={previewSeq}
              onChange={(e) => setPreviewSeq(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="h-9 rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-2 text-[0.8125rem] text-[var(--text-primary-neutral)] outline-none transition-[border-color,background-color,box-shadow] focus:border-[var(--input-focus-border)] focus:bg-[var(--input-bg-focus)] focus:ring-[3px] focus:ring-[color:var(--input-focus-ring)]"
            />
          </label>
          <label className="flex flex-col gap-1 text-[0.75rem] font-medium text-[var(--color-text-muted)]">
            Revisi (index)
            <input
              type="number"
              min={0}
              value={previewRev}
              onChange={(e) => setPreviewRev(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="h-9 rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-2 text-[0.8125rem] text-[var(--text-primary-neutral)] outline-none transition-[border-color,background-color,box-shadow] focus:border-[var(--input-focus-border)] focus:bg-[var(--input-bg-focus)] focus:ring-[3px] focus:ring-[color:var(--input-focus-ring)]"
            />
          </label>
        </div>
        <label className="mt-3 flex max-w-xs flex-col gap-1 text-[0.75rem] font-medium text-[var(--color-text-muted)]">
          Separator
          <input
            value={separator}
            onChange={(e) => setSeparator(e.target.value.slice(0, 3))}
            disabled={readOnly}
            className="h-9 rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-2 font-mono text-[0.8125rem] text-[var(--text-primary-neutral)] outline-none transition-[border-color,background-color,box-shadow] placeholder:text-[var(--input-placeholder)] focus:border-[var(--input-focus-border)] focus:bg-[var(--input-bg-focus)] focus:ring-[3px] focus:ring-[color:var(--input-focus-ring)] disabled:opacity-60"
          />
        </label>
      </div>

      <div>
        <h3 className="mb-2 text-[0.8125rem] font-semibold text-[var(--color-text-primary)]">Format revisi</h3>
        <div className="flex flex-wrap gap-4">
          {REVISION_OPTIONS.map((opt) => (
            <label key={opt.value} className="inline-flex cursor-pointer items-center gap-2 text-[0.8125rem]">
              <input
                type="radio"
                name="revision_format"
                value={opt.value}
                checked={revisionFormat === opt.value}
                disabled={readOnly}
                onChange={() => setRevisionFormat(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <CodeMapTable title="Kode disiplin" rows={disciplineRows} onChange={setDisciplineRows} readOnly={readOnly} />
      <CodeMapTable title="Kode tipe dokumen" rows={docRows} onChange={setDocRows} readOnly={readOnly} />

      {canEdit && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isPending}
            onClick={save}
            className={cn(
              'inline-flex h-9 items-center rounded-md bg-[var(--color-primary)] px-4 text-[0.8125rem] font-medium text-[var(--color-primary-fg)]',
              isPending && 'opacity-60',
            )}
          >
            {isPending ? 'Menyimpan…' : 'Simpan file naming'}
          </button>
          {message && (
            <span className={cn('text-[0.8125rem]', message.startsWith('Disimpan') ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]')}>
              {message}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
