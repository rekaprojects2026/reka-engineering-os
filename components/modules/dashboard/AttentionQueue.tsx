import type { ReactNode } from 'react'
import Link from 'next/link'
import { AlertTriangle, Ban, MessageSquareWarning, RotateCcw } from 'lucide-react'

import type { NeedsAttentionData, WaitingClientProjectRow } from '@/lib/dashboard/queries'
import { formatDate } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils/cn'

type RowKind = 'overdue' | 'blocked' | 'revision' | 'waiting_client'

type MergedRow =
  | { kind: 'overdue';        id: string; title: string; href: string; project: string; detailLabel: string; detailValue: string }
  | { kind: 'blocked';        id: string; title: string; href: string; project: string; detailLabel: string; detailValue: string }
  | { kind: 'revision';       id: string; title: string; href: string; project: string; detailLabel: string; detailValue: string }
  | { kind: 'waiting_client'; id: string; title: string; href: string; project: string; detailLabel: string; detailValue: string }

export function mergeRows(attention: NeedsAttentionData, waitingClient: WaitingClientProjectRow[]): MergedRow[] {
  const rows: MergedRow[] = []

  for (const t of attention.overdueTasks) {
    rows.push({
      kind:        'overdue',
      id:          t.id,
      title:       t.title,
      href:        `/tasks/${t.id}`,
      project:     t.projects?.project_code ?? '—',
      detailLabel: 'Due',
      detailValue: t.due_date ? formatDate(t.due_date) : '—',
    })
  }
  for (const t of attention.blockedTasks) {
    rows.push({
      kind:        'blocked',
      id:          t.id,
      title:       t.title,
      href:        `/tasks/${t.id}`,
      project:     t.projects?.project_code ?? '—',
      detailLabel: 'Assignee',
      detailValue: t.assignee?.full_name ?? '—',
    })
  }
  for (const d of attention.revisionDeliverables) {
    rows.push({
      kind:        'revision',
      id:          d.id,
      title:       d.name,
      href:        `/deliverables/${d.id}`,
      project:     d.projects?.project_code ?? '—',
      detailLabel: 'Status',
      detailValue: 'Revision',
    })
  }
  for (const p of waitingClient) {
    rows.push({
      kind:        'waiting_client',
      id:          p.id,
      title:       p.name,
      href:        `/projects/${p.id}`,
      project:     `${p.project_code} · ${p.clients?.client_name ?? 'Client'}`,
      detailLabel: 'Due',
      detailValue: formatDate(p.target_due_date),
    })
  }

  return rows
}

export const KIND_LABEL: Record<RowKind, string> = {
  overdue:        'Overdue',
  blocked:        'Blocked',
  revision:       'Revision',
  waiting_client: 'Client hold',
}

export const KIND_ICON: Record<RowKind, ReactNode> = {
  overdue:        <AlertTriangle       className="h-3.5 w-3.5" aria-hidden />,
  blocked:        <Ban                 className="h-3.5 w-3.5" aria-hidden />,
  revision:       <RotateCcw           className="h-3.5 w-3.5" aria-hidden />,
  waiting_client: <MessageSquareWarning className="h-3.5 w-3.5" aria-hidden />,
}

export const KIND_BADGE_CLASS: Record<RowKind, string> = {
  overdue:        'bg-[var(--color-danger)]/10  text-[var(--color-danger)]',
  blocked:        'bg-[var(--color-danger)]/10  text-[var(--color-danger)]',
  revision:       'bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
  waiting_client: 'bg-[var(--brand-accent)]/10 text-[var(--brand-accent)]',
}

export function AttentionQueue({
  attention,
  waitingClient,
  maxRows = 8,
}: {
  attention:     NeedsAttentionData
  waitingClient: WaitingClientProjectRow[]
  maxRows?:      number
}) {
  const rows   = mergeRows(attention, waitingClient)
  const shown  = rows.slice(0, maxRows)
  const hidden = rows.length - shown.length

  if (rows.length === 0) {
    return (
      <div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div
            className="mb-3 flex h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: 'var(--color-success-subtle)' }}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              style={{ color: 'var(--color-success)' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary-neutral)' }}>All clear</p>
          <p className="text-xs" style={{ color: 'var(--text-muted-neutral)' }}>No items need attention right now</p>
        </div>
        <div className="border-t border-[var(--table-border)] pt-3">
          <AttentionQueueQuickLinks />
        </div>
      </div>
    )
  }

  return (
    <div>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {shown.map((row) => {
          const dotBg =
            row.kind === 'overdue' || row.kind === 'blocked'
              ? 'var(--color-danger-subtle)'
              : row.kind === 'revision'
              ? 'var(--color-warning-subtle)'
              : 'var(--surface-neutral)'
          const dotColor =
            row.kind === 'overdue' || row.kind === 'blocked'
              ? 'var(--color-danger)'
              : row.kind === 'revision'
              ? 'var(--color-warning)'
              : 'var(--brand-accent)'

          return (
            <li key={`${row.kind}-${row.id}`}>
              <Link
                href={row.href}
                className="group relative flex items-start gap-3 rounded-lg border border-[var(--border-divider-soft)] p-3 no-underline transition-colors duration-100 bg-[var(--surface-neutral)] hover:bg-[var(--table-row-hover)]"
              >
                {/* Status dot */}
                <div
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: dotBg }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: dotColor }}
                  />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span
                      className={cn(
                        'inline-flex shrink-0 items-center gap-1 rounded-[var(--radius-pill)] px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.06em]',
                        KIND_BADGE_CLASS[row.kind]
                      )}
                    >
                      {KIND_ICON[row.kind]}
                      {KIND_LABEL[row.kind]}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-sm font-medium" style={{ color: 'var(--text-primary-neutral)' }}>
                    {row.title}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted-neutral)' }}>
                    <span className="font-mono">{row.project}</span>
                    <span>·</span>
                    <span>{row.detailLabel}: {row.detailValue}</span>
                  </div>
                </div>

                {/* Arrow indicator on hover */}
                <svg
                  className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-0 transition-opacity duration-100 group-hover:opacity-40"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            </li>
          )
        })}
      </ul>

      {hidden > 0 && (
        <p className="mt-3 pl-1 text-[0.75rem]" style={{ color: 'var(--text-muted-neutral)' }}>
          +{hidden} more — use the task and deliverable lists to triage.
        </p>
      )}

      <div className="mt-4 border-t border-[var(--table-border)] pt-3">
        <AttentionQueueQuickLinks />
      </div>
    </div>
  )
}

export function AttentionQueueQuickLinks() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2">
      <Link href="/tasks"        className="text-[0.8125rem] font-semibold text-[var(--brand-accent)] no-underline hover:underline">Open tasks →</Link>
      <Link href="/projects"     className="text-[0.8125rem] font-semibold text-[var(--brand-accent)] no-underline hover:underline">Projects →</Link>
      <Link href="/deliverables" className="text-[0.8125rem] font-semibold text-[var(--brand-accent)] no-underline hover:underline">Deliverables →</Link>
    </div>
  )
}
