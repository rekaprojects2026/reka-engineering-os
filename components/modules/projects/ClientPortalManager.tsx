'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Copy, Link2 } from 'lucide-react'
import type { ClientPortalTokenRow } from '@/lib/portal/types'
import { createClientPortalToken, setClientPortalTokenActive } from '@/lib/portal/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDate } from '@/lib/utils/formatters'

interface ClientPortalManagerProps {
  projectId: string
  tokens: ClientPortalTokenRow[]
  appOrigin: string
}

export function ClientPortalManager({ projectId, tokens, appOrigin }: ClientPortalManagerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [label, setLabel] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  const base = appOrigin.replace(/\/$/, '')

  function portalUrl(token: string) {
    return `${base}/portal/${token}`
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setMsg('Link disalin ke clipboard.')
      setTimeout(() => setMsg(null), 2500)
    } catch {
      setMsg('Tidak bisa menyalin — salin manual.')
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-[0.9375rem] font-semibold text-[var(--color-text-primary)]">Client portal links</h3>
        <p className="mt-1 text-[0.8125rem] text-[var(--color-text-muted)]">
          Bagikan URL ini ke klien. Mereka tidak perlu login. Jangan posting link di tempat publik.
        </p>
      </div>

      {msg && <p className="text-[0.8125rem] text-[var(--color-primary)]">{msg}</p>}

      <div className="flex flex-wrap items-end gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-muted)]/40 p-4">
        <div className="min-w-[200px] flex-1">
          <Label htmlFor="portal-label">Label (opsional)</Label>
          <Input
            id="portal-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Mis. PT Maju Jaya"
            className="mt-1"
          />
        </div>
        <Button
          type="button"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              const res = await createClientPortalToken({ projectId, label: label || undefined })
              if ('error' in res) {
                alert(res.error)
                return
              }
              const url = portalUrl(res.token)
              setLabel('')
              await copyText(url)
              router.refresh()
            })
          }}
        >
          <Link2 size={14} className="mr-1.5" aria-hidden />
          Generate link baru
        </Button>
      </div>

      <ul className="m-0 list-none space-y-3 p-0">
        {tokens.length === 0 ? (
          <li className="text-[0.8125rem] text-[var(--color-text-muted)]">Belum ada link.</li>
        ) : (
          tokens.map((t) => {
            const url = portalUrl(t.token)
            const expired = t.expires_at != null && new Date(t.expires_at) < new Date()
            return (
              <li
                key={t.id}
                className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-[0.875rem] font-medium text-[var(--color-text-primary)]">{t.label || 'Tanpa label'}</p>
                    <p className="mt-1 font-mono text-[0.6875rem] text-[var(--color-text-muted)] break-all">{url}</p>
                    <p className="mt-2 text-[0.75rem] text-[var(--color-text-muted)]">
                      Dibuat {formatDate(t.created_at)}
                      {t.last_accessed_at ? ` · Terakhir diakses ${formatDate(t.last_accessed_at)}` : ''}
                      {t.expires_at ? ` · Berlaku s/d ${formatDate(t.expires_at)}` : ''}
                      {!t.is_active ? ' · Nonaktif' : ''}
                      {expired ? ' · Kadaluarsa' : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => void copyText(url)}>
                      <Copy size={14} className="mr-1" aria-hidden />
                      Copy link
                    </Button>
                    {t.is_active && !expired && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-8"
                        disabled={isPending}
                        onClick={() => {
                          if (!window.confirm('Nonaktifkan link ini?')) return
                          startTransition(async () => {
                            const res = await setClientPortalTokenActive({ id: t.id, projectId, isActive: false })
                            if ('error' in res) alert(res.error)
                            else router.refresh()
                          })
                        }}
                      >
                        Nonaktifkan
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            )
          })
        )}
      </ul>
    </div>
  )
}
