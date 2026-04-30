'use client'

import { useState, useRef, useEffect } from 'react'
import { MoreHorizontal, Trash2, ArrowRight } from 'lucide-react'
import type { OutreachWithIntake } from '@/lib/outreach/queries'

const OUTREACH_STATUS_OPTIONS = [
  { value: 'to_contact',    label: 'To Contact' },
  { value: 'contacted',     label: 'Contacted' },
  { value: 'replied',       label: 'Replied' },
  { value: 'in_discussion', label: 'In Discussion' },
  { value: 'converted',     label: 'Converted' },
  { value: 'declined',      label: 'Declined' },
]

interface OutreachActionsProps {
  company: OutreachWithIntake
  onStatusChange: (id: string, status: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onConvert: (id: string) => Promise<void>
}

export function OutreachActions({ company, onStatusChange, onDelete, onConvert }: OutreachActionsProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setConfirmDelete(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function handleStatusChange(status: string) {
    if (status === company.status) { setOpen(false); return }
    setLoading(true)
    try {
      await onStatusChange(company.id, status)
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setLoading(true)
    try {
      await onDelete(company.id)
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  async function handleConvert() {
    if (company.converted_intake_id) return
    setLoading(true)
    try {
      await onConvert(company.id)
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => { setOpen(o => !o); setConfirmDelete(false) }}
        disabled={loading}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          borderRadius: '6px',
          border: '1px solid var(--color-border)',
          backgroundColor: 'transparent',
          color: 'var(--color-text-muted)',
          cursor: 'pointer',
          opacity: loading ? 0.5 : 1,
        }}
      >
        <MoreHorizontal size={14} />
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: '100%',
          marginTop: 4,
          zIndex: 50,
          minWidth: 180,
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-md)',
          overflow: 'hidden',
        }}>
          {/* Status section */}
          <div style={{ padding: '6px 8px 4px', borderBottom: '1px solid var(--color-border)' }}>
            <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 4px' }}>
              Change Status
            </p>
            {OUTREACH_STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleStatusChange(opt.value)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '6px 8px',
                  fontSize: '0.8125rem',
                  color: company.status === opt.value ? 'var(--color-primary)' : 'var(--color-text-primary)',
                  fontWeight: company.status === opt.value ? 600 : 400,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '4px',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-surface-muted)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                {company.status === opt.value ? '✓ ' : ''}{opt.label}
              </button>
            ))}
          </div>

          {/* Actions section */}
          <div style={{ padding: '4px 8px 6px' }}>
            {/* Convert to Lead — only if not already converted */}
            {!company.converted_intake_id && (
              <button
                onClick={handleConvert}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  width: '100%',
                  textAlign: 'left',
                  padding: '6px 8px',
                  fontSize: '0.8125rem',
                  color: 'var(--color-primary)',
                  fontWeight: 500,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '4px',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-surface-muted)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <ArrowRight size={13} />
                Convert to Lead
              </button>
            )}

            {/* Delete */}
            <button
              onClick={handleDelete}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                width: '100%',
                textAlign: 'left',
                padding: '6px 8px',
                fontSize: '0.8125rem',
                color: confirmDelete ? 'var(--color-danger)' : 'var(--color-text-secondary)',
                fontWeight: confirmDelete ? 600 : 400,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '4px',
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-surface-muted)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Trash2 size={13} />
              {confirmDelete ? 'Click again to confirm' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
