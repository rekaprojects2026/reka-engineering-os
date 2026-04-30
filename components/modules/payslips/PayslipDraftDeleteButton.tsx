'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { PayslipActionResult } from '@/lib/payslips/actions'

interface PayslipDraftDeleteButtonProps {
  payslipId: string
  deletePayslip: (id: string) => Promise<PayslipActionResult>
}

export function PayslipDraftDeleteButton({ payslipId, deletePayslip }: PayslipDraftDeleteButtonProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [err, setErr] = useState<string | null>(null)

  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm('Delete this draft payslip?')) return
          setErr(null)
          startTransition(async () => {
            const r = await deletePayslip(payslipId)
            if (r.error) setErr(r.error)
            else router.refresh()
          })
        }}
        style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          color: 'var(--color-danger)',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: pending ? 'wait' : 'pointer',
          textDecoration: 'underline',
        }}
      >
        Delete
      </button>
      {err && <span style={{ fontSize: '0.6875rem', color: 'var(--color-danger)' }}>{err}</span>}
    </span>
  )
}
