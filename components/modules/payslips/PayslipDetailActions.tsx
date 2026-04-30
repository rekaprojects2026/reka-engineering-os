'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { PayslipActionResult } from '@/lib/payslips/actions'

interface PayslipDetailActionsProps {
  payslipId: string
  status: string
  markPayslipPaid: (id: string) => Promise<PayslipActionResult>
}

export function PayslipDetailActions({ payslipId, status, markPayslipPaid }: PayslipDetailActionsProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [err, setErr] = useState<string | null>(null)

  return (
    <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginTop: '20px' }}>
      {status !== 'paid' && (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setErr(null)
            startTransition(async () => {
            const r = await markPayslipPaid(payslipId)
            if (r.error) setErr(r.error)
            else router.refresh()
          })
          }}
          style={{
            padding: '8px 14px',
            borderRadius: 'var(--radius-control)',
            border: '1px solid var(--color-success)',
            backgroundColor: 'var(--color-success-subtle)',
            color: 'var(--color-success)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: pending ? 'wait' : 'pointer',
          }}
        >
          Mark as paid
        </button>
      )}
      <button
        type="button"
        onClick={() => window.print()}
        style={{
          padding: '8px 14px',
          borderRadius: 'var(--radius-control)',
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-text-primary)',
          fontSize: '0.8125rem',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Print
      </button>
      <Link
        href="/finance/payslips"
        style={{
          padding: '8px 14px',
          borderRadius: 'var(--radius-control)',
          fontSize: '0.8125rem',
          fontWeight: 500,
          color: 'var(--color-primary)',
          textDecoration: 'none',
        }}
      >
        ← Back to payslips
      </Link>
      {err && <span style={{ fontSize: '0.8125rem', color: 'var(--color-danger)', width: '100%' }}>{err}</span>}
    </div>
  )
}
