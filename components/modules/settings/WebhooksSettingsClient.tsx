'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import {
  createWebhookEndpoint,
  deleteWebhookEndpoint,
  fetchWebhookDeliveryLogsForSettings,
  updateWebhookEndpoint,
} from '@/lib/webhooks/actions'
import type { WebhookEndpointListRow } from '@/lib/webhooks/queries'
import type { WebhookDeliveryLog } from '@/types/database'
import type { WebhookEventType } from '@/lib/webhooks/events'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { SectionCard } from '@/components/shared/SectionCard'

type EventOption = { value: WebhookEventType; label: string }

export function WebhooksSettingsClient({
  initialEndpoints,
  eventOptions,
}: {
  initialEndpoints: WebhookEndpointListRow[]
  eventOptions: EventOption[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [addOpen, setAddOpen] = useState(false)
  const [newSecret, setNewSecret] = useState<string | null>(null)

  const [editRow, setEditRow] = useState<WebhookEndpointListRow | null>(null)

  const [logsOpen, setLogsOpen] = useState(false)
  const [logsWebhookId, setLogsWebhookId] = useState<string | null>(null)
  const [logFilter, setLogFilter] = useState<'all' | 'success' | 'failed'>('all')
  const [logPage, setLogPage] = useState(1)
  const [logRows, setLogRows] = useState<WebhookDeliveryLog[]>([])
  const [logTotal, setLogTotal] = useState(0)
  const [logsError, setLogsError] = useState<string | null>(null)
  const [editActive, setEditActive] = useState(true)

  useEffect(() => {
    if (editRow) setEditActive(editRow.is_active)
  }, [editRow])

  useEffect(() => {
    if (!logsOpen || !logsWebhookId) return
    let cancelled = false
    void fetchWebhookDeliveryLogsForSettings(logsWebhookId, logFilter, logPage).then((r) => {
      if (cancelled) return
      if (r.error) {
        setLogsError(r.error)
        setLogRows([])
        setLogTotal(0)
        return
      }
      setLogsError(null)
      setLogRows(r.rows)
      setLogTotal(r.total)
    })
    return () => {
      cancelled = true
    }
  }, [logsOpen, logsWebhookId, logFilter, logPage])

  return (
    <>
      <SectionCard
        title="Webhook endpoints"
        description="HTTPS POST notifications when events occur in the OS."
        actions={
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setError(null)
              setNewSecret(null)
              setAddOpen(true)
            }}
          >
            Add webhook
          </Button>
        }
      >
        {error && <p className="mb-3 text-[0.8125rem] text-[var(--color-danger)]">{error}</p>}
        <ul className="space-y-4">
          {initialEndpoints.map((w) => (
            <li
              key={w.id}
              className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-[0.8125rem]"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-[var(--color-text-primary)]">{w.name}</p>
                  <p className="mt-1 truncate font-mono text-[var(--color-text-secondary)]">{w.url}</p>
                  <p className="mt-1 text-[var(--color-text-muted)]">
                    Events: {(w.events ?? []).join(', ') || '—'}
                  </p>
                  <p className="mt-1 text-[var(--color-text-muted)]">
                    Status: {w.is_active ? 'Active' : 'Disabled'}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() => {
                      setLogsError(null)
                      setLogPage(1)
                      setLogFilter('all')
                      setLogsWebhookId(w.id)
                      setLogsOpen(true)
                    }}
                  >
                    Logs
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() => {
                      setError(null)
                      setEditRow(w)
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={pending}
                    onClick={() => {
                      if (!confirm('Delete this webhook endpoint?')) return
                      startTransition(async () => {
                        const r = await deleteWebhookEndpoint(w.id)
                        if ('error' in r) setError(r.error)
                        else router.refresh()
                      })
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </li>
          ))}
          {initialEndpoints.length === 0 && (
            <li className="text-[0.8125rem] text-[var(--color-text-muted)]">No webhooks yet.</li>
          )}
        </ul>
      </SectionCard>

      <Dialog
        open={addOpen}
        onOpenChange={(o) => {
          if (!o) {
            setAddOpen(false)
            setNewSecret(null)
            setError(null)
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {newSecret ? (
            <>
              <DialogHeader>
                <DialogTitle>Webhook signing secret</DialogTitle>
              </DialogHeader>
              <p className="text-[0.8125rem] text-[var(--color-text-secondary)]">
                Verify deliveries using HMAC-SHA256 over the JSON body with this secret (header{' '}
                <span className="font-mono">X-Reka-Signature</span>). Store it now; it will not be shown again.
              </p>
              <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-3 font-mono text-[0.75rem] break-all">
                {newSecret}
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" onClick={() => void navigator.clipboard.writeText(newSecret)}>
                  Copy
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setAddOpen(false)
                    setNewSecret(null)
                    router.refresh()
                  }}
                >
                  Done
                </Button>
              </DialogFooter>
            </>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                setError(null)
                startTransition(async () => {
                  const r = await createWebhookEndpoint(fd)
                  if ('error' in r) {
                    setError(r.error)
                    return
                  }
                  setNewSecret(r.plaintextSecret)
                })
              }}
            >
              <DialogHeader>
                <DialogTitle>New webhook</DialogTitle>
              </DialogHeader>
              <div>
                <label className="mb-1 block text-[0.75rem] font-medium text-[var(--color-text-muted)]">Name</label>
                <input
                  name="name"
                  required
                  className="h-9 w-full rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-[0.8125rem] text-[var(--text-primary-neutral)] outline-none transition-[border-color,background-color,box-shadow] placeholder:text-[var(--input-placeholder)] focus:border-[var(--input-focus-border)] focus:bg-[var(--input-bg-focus)] focus:ring-[3px] focus:ring-[color:var(--input-focus-ring)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[0.75rem] font-medium text-[var(--color-text-muted)]">
                  HTTPS URL
                </label>
                <input
                  name="url"
                  type="url"
                  required
                  placeholder="https://example.com/webhook"
                  className="h-9 w-full rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-[0.8125rem] text-[var(--text-primary-neutral)] outline-none transition-[border-color,background-color,box-shadow] placeholder:text-[var(--input-placeholder)] focus:border-[var(--input-focus-border)] focus:bg-[var(--input-bg-focus)] focus:ring-[3px] focus:ring-[color:var(--input-focus-ring)]"
                />
              </div>
              <fieldset>
                <legend className="mb-2 text-[0.75rem] font-medium text-[var(--color-text-muted)]">Events</legend>
                <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                  {eventOptions.map((ev) => (
                    <label key={ev.value} className="flex items-center gap-2 text-[0.8125rem]">
                      <input type="checkbox" name="event" value={ev.value} className="rounded border-[var(--color-border)]" />
                      <span>
                        <span className="font-mono text-[0.75rem]">{ev.value}</span>
                        <span className="text-[var(--color-text-muted)]"> — {ev.label}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              {error && <p className="text-[0.8125rem] text-[var(--color-danger)]">{error}</p>}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  Create
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editRow} onOpenChange={(o) => { if (!o) setEditRow(null) }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {editRow && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                fd.set('is_active', editActive ? 'true' : 'false')
                setError(null)
                startTransition(async () => {
                  const r = await updateWebhookEndpoint(editRow.id, fd)
                  if ('error' in r) setError(r.error)
                  else {
                    setEditRow(null)
                    router.refresh()
                  }
                })
              }}
            >
              <DialogHeader>
                <DialogTitle>Edit webhook</DialogTitle>
              </DialogHeader>
              <div>
                <label className="mb-1 block text-[0.75rem] font-medium text-[var(--color-text-muted)]">Name</label>
                <input
                  name="name"
                  required
                  defaultValue={editRow.name}
                  className="h-9 w-full rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-[0.8125rem] text-[var(--text-primary-neutral)] outline-none transition-[border-color,background-color,box-shadow] placeholder:text-[var(--input-placeholder)] focus:border-[var(--input-focus-border)] focus:bg-[var(--input-bg-focus)] focus:ring-[3px] focus:ring-[color:var(--input-focus-ring)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[0.75rem] font-medium text-[var(--color-text-muted)]">
                  HTTPS URL
                </label>
                <input
                  name="url"
                  type="url"
                  required
                  defaultValue={editRow.url}
                  className="h-9 w-full rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-[0.8125rem] text-[var(--text-primary-neutral)] outline-none transition-[border-color,background-color,box-shadow] placeholder:text-[var(--input-placeholder)] focus:border-[var(--input-focus-border)] focus:bg-[var(--input-bg-focus)] focus:ring-[3px] focus:ring-[color:var(--input-focus-ring)]"
                />
              </div>
              <fieldset>
                <legend className="mb-2 text-[0.75rem] font-medium text-[var(--color-text-muted)]">Events</legend>
                <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                  {eventOptions.map((ev) => {
                    const checked = (editRow.events as WebhookEventType[]).includes(ev.value)
                    return (
                      <label key={ev.value} className="flex items-center gap-2 text-[0.8125rem]">
                        <input
                          type="checkbox"
                          name="event"
                          value={ev.value}
                          defaultChecked={checked}
                          className="rounded border-[var(--color-border)]"
                        />
                        <span>
                          <span className="font-mono text-[0.75rem]">{ev.value}</span>
                          <span className="text-[var(--color-text-muted)]"> — {ev.label}</span>
                        </span>
                      </label>
                    )
                  })}
                </div>
              </fieldset>
              <label className="flex items-center gap-2 text-[0.8125rem]">
                <input
                  type="checkbox"
                  checked={editActive}
                  onChange={(e) => setEditActive(e.target.checked)}
                />
                Active
              </label>
              {error && <p className="text-[0.8125rem] text-[var(--color-danger)]">{error}</p>}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditRow(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  Save
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={logsOpen} onOpenChange={(o) => { if (!o) { setLogsOpen(false); setLogsWebhookId(null) } }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Delivery log</DialogTitle>
          </DialogHeader>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <label className="text-[0.8125rem] text-[var(--color-text-muted)]">Filter</label>
            <select
              value={logFilter}
              onChange={(e) => {
                setLogFilter(e.target.value as 'all' | 'success' | 'failed')
                setLogPage(1)
              }}
              className="h-8 rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-2 text-[0.8125rem] text-[var(--text-primary-neutral)] outline-none transition-[border-color,background-color,box-shadow] focus:border-[var(--input-focus-border)] focus:bg-[var(--input-bg-focus)] focus:ring-[3px] focus:ring-[color:var(--input-focus-ring)]"
            >
              <option value="all">All</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          {logsError && <p className="mb-2 text-[0.8125rem] text-[var(--color-danger)]">{logsError}</p>}
          <div className="min-h-0 flex-1 overflow-auto rounded-md border border-[var(--color-border)]">
            <table className="w-full border-collapse text-left text-[0.75rem]">
              <thead className="sticky top-0 bg-[var(--color-surface-muted)]">
                <tr className="border-b border-[var(--color-border)]">
                  <th className="px-2 py-2 font-semibold text-[var(--color-text-muted)]">Time</th>
                  <th className="px-2 py-2 font-semibold text-[var(--color-text-muted)]">Event</th>
                  <th className="px-2 py-2 font-semibold text-[var(--color-text-muted)]">HTTP</th>
                  <th className="px-2 py-2 font-semibold text-[var(--color-text-muted)]">ms</th>
                </tr>
              </thead>
              <tbody>
                {logRows.map((row) => (
                  <tr key={row.id} className="border-b border-[var(--color-border)]">
                    <td className="px-2 py-1.5 whitespace-nowrap text-[var(--color-text-secondary)]">
                      {new Date(row.delivered_at).toLocaleString()}
                    </td>
                    <td className="px-2 py-1.5 font-mono text-[var(--color-text-secondary)]">{row.event_type}</td>
                    <td className="px-2 py-1.5">{row.response_status ?? '—'}</td>
                    <td className="px-2 py-1.5">{row.duration_ms ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {logRows.length === 0 && !logsError && (
              <p className="p-4 text-[0.8125rem] text-[var(--color-text-muted)]">No deliveries yet.</p>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between text-[0.8125rem]">
            <span className="text-[var(--color-text-muted)]">Total: {logTotal}</span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={logPage <= 1 || pending}
                onClick={() => setLogPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={logPage * 20 >= logTotal || pending}
                onClick={() => setLogPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
