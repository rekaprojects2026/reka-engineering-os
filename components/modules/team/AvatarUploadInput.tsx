'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { getInitials } from '@/lib/utils/formatters'

type Props = {
  photoUrl: string | null
  fullName: string
}

export function AvatarUploadInput({ photoUrl: initialUrl, fullName }: Props) {
  const [photoUrl, setPhotoUrl] = useState(initialUrl)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    setPhotoUrl(initialUrl)
  }, [initialUrl])

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setMessage(null)
    setBusy(true)
    try {
      const fd = new FormData()
      fd.set('file', file)
      const res = await fetch('/api/profile/photo', { method: 'POST', body: fd })
      const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string }
      if (!res.ok) {
        setMessage({ type: 'err', text: body.error ?? 'Upload failed.' })
        return
      }
      if (body.url) setPhotoUrl(body.url)
      setMessage({ type: 'ok', text: 'Photo updated.' })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  const onRemove = async () => {
    setMessage(null)
    setBusy(true)
    try {
      const res = await fetch('/api/profile/photo', { method: 'DELETE' })
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (!res.ok) {
        setMessage({ type: 'err', text: body.error ?? 'Could not remove photo.' })
        return
      }
      setPhotoUrl(null)
      setMessage({ type: 'ok', text: 'Photo removed.' })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <Avatar className="h-20 w-20 shrink-0">
        {photoUrl ? <AvatarImage src={photoUrl} alt={fullName} /> : null}
        <AvatarFallback className="text-lg font-semibold">{getInitials(fullName)}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1 space-y-2">
        <div>
          <p className="text-[0.8125rem] font-semibold text-[var(--color-text-primary)]">Profile photo</p>
          <p className="mt-0.5 text-[0.75rem] leading-snug text-[var(--color-text-muted)]">
            PNG, JPEG, or WebP — max 2 MB. Shown in the sidebar and team lists.
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          className="sr-only"
          onChange={onFileChange}
          disabled={busy}
        />

        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => inputRef.current?.click()}>
            {busy ? 'Working…' : 'Choose image'}
          </Button>
          {photoUrl && (
            <Button type="button" size="sm" variant="outline" disabled={busy} onClick={onRemove}>
              Remove photo
            </Button>
          )}
        </div>

        {message && (
          <p
            className="text-[0.75rem]"
            style={{ color: message.type === 'ok' ? 'var(--color-text-secondary)' : 'var(--color-danger)' }}
            role="status"
          >
            {message.text}
          </p>
        )}
      </div>
    </div>
  )
}
