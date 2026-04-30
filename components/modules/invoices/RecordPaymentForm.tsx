'use client'

import { useState, useTransition } from 'react'
import type { PaymentAccount } from '@/types/database'

interface RecordPaymentFormProps {
  invoiceId: string
  currency: string
  accounts: PaymentAccount[]
  fxRate: number
  onSubmit: (formData: FormData) => Promise<void>
}

export function RecordPaymentForm({ invoiceId, currency, accounts, fxRate, onSubmit }: RecordPaymentFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [amount, setAmount] = useState('')

  const amountNum = parseFloat(amount) || 0

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)

    setError(null)
    setSuccess(false)
    startTransition(async () => {
      try {
        await onSubmit(formData)
        setSuccess(true)
        form.reset()
        setAmount('')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to record payment')
      }
    })
  }

  const fieldStyle = {
    width: '100%',
    padding: '7px 10px',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-control)',
    fontSize: '0.875rem',
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-text-primary)',
    outline: 'none',
    boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    marginBottom: '4px',
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{ padding: '8px 10px', backgroundColor: 'var(--color-danger-subtle)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-control)', color: 'var(--color-danger)', fontSize: '0.75rem', marginBottom: '10px' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ padding: '8px 10px', backgroundColor: 'var(--color-success-subtle)', border: '1px solid var(--color-success)', borderRadius: 'var(--radius-control)', color: 'var(--color-success)', fontSize: '0.75rem', marginBottom: '10px' }}>
          Payment recorded successfully.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div>
          <label style={labelStyle}>Payment Date *</label>
          <input
            name="payment_date"
            type="date"
            required
            defaultValue={new Date().toISOString().split('T')[0]}
            style={fieldStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Amount Received *</label>
          <input
            name="amount_received"
            type="number"
            min="0"
            step="0.01"
            required
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            style={fieldStyle}
          />
          {currency === 'USD' && amountNum > 0 && (
            <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              ≈ {(amountNum * fxRate).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
            </p>
          )}
        </div>

        <input type="hidden" name="currency" value={currency} />

        <div>
          <label style={labelStyle}>To Account</label>
          <select name="account_id" style={fieldStyle}>
            <option value="">— Select account —</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Reference / Transaction ID</label>
          <input
            name="payment_reference"
            placeholder="Optional"
            style={fieldStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Proof Link (Drive / screenshot)</label>
          <input
            name="proof_link"
            type="url"
            placeholder="https://…"
            style={fieldStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Notes</label>
          <input
            name="notes"
            placeholder="Optional"
            style={fieldStyle}
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          style={{
            padding: '8px 14px',
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-primary-fg)',
            borderRadius: 'var(--radius-control)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            border: 'none',
            cursor: isPending ? 'not-allowed' : 'pointer',
            opacity: isPending ? 0.7 : 1,
          }}
        >
          {isPending ? 'Recording…' : 'Record Payment'}
        </button>
      </div>
    </form>
  )
}
