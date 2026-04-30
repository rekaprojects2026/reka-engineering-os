'use client'

import { useState, useTransition } from 'react'
import { deleteFile } from '@/lib/files/actions'
import { Trash2 } from 'lucide-react'

export function DeleteFileButton({ fileId, fileName }: { fileId: string; fileName: string }) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function onClick() {
    setError(null)
    if (!confirm(`Delete “${fileName}”? This removes the file record. R2 objects are removed when possible.`)) {
      return
    }
    startTransition(async () => {
      const result = await deleteFile(fileId)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <button
        type="button"
        onClick={onClick}
        disabled={isPending}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          alignSelf: 'flex-start',
          padding: '8px 14px',
          backgroundColor: 'var(--color-danger-subtle)',
          color: 'var(--color-danger)',
          border: '1px solid var(--color-border-strong)',
          borderRadius: 'var(--radius-control)',
          fontSize: '0.8125rem',
          fontWeight: 500,
          cursor: isPending ? 'not-allowed' : 'pointer',
        }}
      >
        <Trash2 size={14} aria-hidden="true" />
        {isPending ? 'Deleting…' : 'Delete file record'}
      </button>
      {error && (
        <p role="alert" style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-danger)' }}>
          {error}
        </p>
      )}
    </div>
  )
}
