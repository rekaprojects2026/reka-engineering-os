'use client'

import { useOptimistic, useState, useTransition } from 'react'
import { ChevronDown, Loader2 } from 'lucide-react'

interface StatusOption {
  value: string
  label: string
  color?: string
}

interface InlineStatusSelectProps {
  currentStatus: string
  options: StatusOption[]
  onUpdate: (newStatus: string) => Promise<void>
  renderBadge: (status: string) => React.ReactNode
}

export function InlineStatusSelect({
  currentStatus,
  options,
  onUpdate,
  renderBadge,
}: InlineStatusSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(currentStatus, (_prev, next: string) => next)
  const [isPending, startTransition] = useTransition()

  function handleSelect(newStatus: string) {
    if (newStatus === optimisticStatus) {
      setIsOpen(false)
      return
    }
    setIsOpen(false)
    startTransition(async () => {
      setOptimisticStatus(newStatus)
      try {
        await onUpdate(newStatus)
      } catch {
        // Server error: refresh from parent when action uses revalidate; optimistic layer clears on new props.
      }
    })
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          background: 'transparent', border: 'none', cursor: 'pointer',
          padding: '2px', borderRadius: '6px',
          opacity: isPending ? 0.6 : 1,
        }}
        title="Click to change status"
      >
        {renderBadge(optimisticStatus)}
        {isPending ? (
          <Loader2 size={11} className="animate-spin" style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} aria-hidden />
        ) : (
          <ChevronDown size={11} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} aria-hidden />
        )}
      </button>

      {isOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setIsOpen(false)} />
          <div style={{
            position: 'absolute', top: '100%', left: 0, zIndex: 20,
            marginTop: '4px',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-card)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            minWidth: '160px',
            overflow: 'hidden',
          }}>
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '7px 12px',
                  background: opt.value === optimisticStatus ? 'var(--color-surface-muted)' : 'transparent',
                  border: 'none', cursor: 'pointer',
                  fontSize: '0.8125rem',
              color: opt.value === optimisticStatus ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              fontWeight: opt.value === optimisticStatus ? 600 : 400,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-surface-muted)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = opt.value === optimisticStatus ? 'var(--color-surface-muted)' : 'transparent')}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
