'use client'

import { useState, useTransition } from 'react'
import { Download } from 'lucide-react'

export function DownloadFileButton({ fileId, label = 'Download from R2' }: { fileId: string; label?: string }) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function onClick() {
    setError(null)
    startTransition(async () => {
      const r = await fetch(`/api/files/download?fileId=${encodeURIComponent(fileId)}`)
      const j = (await r.json().catch(() => ({}))) as { error?: string; url?: string }
      if (!r.ok) {
        setError(typeof j.error === 'string' ? j.error : 'Download failed.')
        return
      }
      if (typeof j.url === 'string') {
        window.open(j.url, '_blank', 'noopener,noreferrer')
      } else {
        setError('Invalid response from server.')
      }
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <button
        type="button"
        onClick={onClick}
        disabled={isPending}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 14px',
          backgroundColor: isPending ? 'var(--color-surface-muted)' : 'var(--color-primary)',
          color: 'var(--color-primary-fg)',
          border: 'none',
          borderRadius: 'var(--radius-control)',
          fontSize: '0.8125rem',
          fontWeight: 500,
          cursor: isPending ? 'not-allowed' : 'pointer',
        }}
      >
        <Download size={14} aria-hidden="true" />
        {isPending ? 'Preparing…' : label}
      </button>
      {error && (
        <p role="alert" style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-danger)' }}>
          {error}
        </p>
      )}
    </div>
  )
}
