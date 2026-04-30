'use client'

import { useEffect, useRef, useState } from 'react'

interface CopyDriveFolderNameButtonProps {
  folderName: string
  className?: string
}

export function CopyDriveFolderNameButton({ folderName, className }: CopyDriveFolderNameButtonProps) {
  const [label, setLabel] = useState('📋 Copy Drive Name')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  async function handleClick() {
    const text = folderName.trim()
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setLabel('✓ Copied!')
    } catch {
      setLabel('Copy failed')
    }
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setLabel('📋 Copy Drive Name'), 2000)
  }

  const disabled = !folderName.trim()

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={
        className ??
        'inline-flex shrink-0 items-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-2.5 py-1 text-[0.75rem] font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-border)] disabled:cursor-not-allowed disabled:opacity-50'
      }
    >
      {label}
    </button>
  )
}
