'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { createApiKey, deleteApiKey, setApiKeyActive } from '@/lib/api-keys/actions'
import type { ApiKeyListRow } from '@/lib/api-keys/queries'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { SectionCard } from '@/components/shared/SectionCard'

type ScopeOption = { value: string; label: string }

export function ApiKeysSettingsClient({
  initialKeys,
  scopeOptions,
}: {
  initialKeys: ApiKeyListRow[]
  scopeOptions: ScopeOption[]
}) {
  const router = useRouter()
  const [openCreate, setOpenCreate] = useState(false)
  const [newKeyPlain, setNewKeyPlain] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <>
      <SectionCard
        title="API keys"
        description="Bearer tokens for the public REST API. Keys are shown only once when created."
        actions={
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setError(null)
              setNewKeyPlain(null)
              setOpenCreate(true)
            }}
          >
            Generate API key
          </Button>
        }
      >
        {error && (
          <p className="mb-3 text-[0.8125rem] text-[var(--color-danger)]">{error}</p>
        )}
        <ul className="space-y-4">
          {initialKeys.map((k) => (
            <li
              key={k.id}
              className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-[0.8125rem]"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-[var(--color-text-primary)]">{k.name}</p>
                  <p className="mt-1 font-mono text-[var(--color-text-muted)]">
                    Prefix: {k.key_prefix}…
                  </p>
                  <p className="mt-1 text-[var(--color-text-secondary)]">
                    Scopes: {k.scopes?.length ? k.scopes.join(', ') : '—'}
                  </p>
                  <p className="mt-1 text-[var(--color-text-muted)]">
                    Created: {new Date(k.created_at).toLocaleString()}
                    {k.last_used_at && (
                      <> · Last used: {new Date(k.last_used_at).toLocaleString()}</>
                    )}
                  </p>
                  <p className="mt-1 text-[var(--color-text-muted)]">
                    Status: {k.is_active ? 'Active' : 'Disabled'}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {k.is_active ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={pending}
                      onClick={() => {
                        startTransition(async () => {
                          const r = await setApiKeyActive(k.id, false)
                          if ('error' in r) setError(r.error)
                          else router.refresh()
                        })
                      }}
                    >
                      Disable
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={pending}
                      onClick={() => {
                        startTransition(async () => {
                          const r = await setApiKeyActive(k.id, true)
                          if ('error' in r) setError(r.error)
                          else router.refresh()
                        })
                      }}
                    >
                      Enable
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={pending}
                    onClick={() => {
                      if (!confirm('Delete this API key? Integrations using it will stop working.')) return
                      startTransition(async () => {
                        const r = await deleteApiKey(k.id)
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
          {initialKeys.length === 0 && (
            <li className="text-[0.8125rem] text-[var(--color-text-muted)]">No API keys yet.</li>
          )}
        </ul>
      </SectionCard>

      <Dialog
        open={openCreate}
        onOpenChange={(o) => {
          if (!o) {
            setOpenCreate(false)
            setNewKeyPlain(null)
            setError(null)
          }
        }}
      >
        <DialogContent className="max-w-md">
          {newKeyPlain ? (
            <>
              <DialogHeader>
                <DialogTitle>Save your API key</DialogTitle>
              </DialogHeader>
              <p className="text-[0.8125rem] text-[var(--color-text-secondary)]">
                Store this key now. It will not be shown again.
              </p>
              <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-3 font-mono text-[0.75rem] break-all">
                {newKeyPlain}
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(newKeyPlain)
                  }}
                >
                  Copy
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setOpenCreate(false)
                    setNewKeyPlain(null)
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
                  const r = await createApiKey(fd)
                  if ('error' in r) {
                    setError(r.error)
                    return
                  }
                  setNewKeyPlain(r.rawKey)
                })
              }}
            >
              <DialogHeader>
                <DialogTitle>New API key</DialogTitle>
              </DialogHeader>
              <div>
                <label className="mb-1 block text-[0.75rem] font-medium text-[var(--color-text-muted)]">Name</label>
                <input
                  name="name"
                  required
                  className="h-9 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[0.8125rem] outline-none focus:border-[var(--color-primary)]"
                  placeholder="e.g. Jurnal integration"
                />
              </div>
              <fieldset>
                <legend className="mb-2 text-[0.75rem] font-medium text-[var(--color-text-muted)]">Scopes</legend>
                <div className="space-y-2">
                  {scopeOptions.map((s) => (
                    <label key={s.value} className="flex items-center gap-2 text-[0.8125rem]">
                      <input type="checkbox" name="scope" value={s.value} className="rounded border-[var(--color-border)]" />
                      <span>{s.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              {error && <p className="text-[0.8125rem] text-[var(--color-danger)]">{error}</p>}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenCreate(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  Generate
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
