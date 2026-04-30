'use client'

import { useLayoutEffect, useMemo, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MoneyInput } from '@/components/shared/MoneyInput'
import { formatIDR } from '@/lib/utils/formatters'
import type { PaymentAccount } from '@/types/database'
import type { PayslipMemberOption } from '@/lib/payslips/queries'
import type { PayslipActionResult } from '@/lib/payslips/actions'

const MONTHS = [
  { v: 1, label: 'January' },
  { v: 2, label: 'February' },
  { v: 3, label: 'March' },
  { v: 4, label: 'April' },
  { v: 5, label: 'May' },
  { v: 6, label: 'June' },
  { v: 7, label: 'July' },
  { v: 8, label: 'August' },
  { v: 9, label: 'September' },
  { v: 10, label: 'October' },
  { v: 11, label: 'November' },
  { v: 12, label: 'December' },
]

const YEARS = [2024, 2025, 2026]

interface PayslipFormProps {
  members: PayslipMemberOption[]
  accounts: PaymentAccount[]
  fxRate: number
  createPayslip: (formData: FormData) => Promise<PayslipActionResult>
}

export function PayslipForm({ members, accounts, fxRate, createPayslip }: PayslipFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const defaultMonth = new Date().getMonth() + 1
  const defaultYear = Math.min(2026, Math.max(2024, new Date().getFullYear()))

  const formRef = useRef<HTMLFormElement>(null)
  const [baseAmount, setBaseAmount] = useState('')
  const [baseCurrency, setBaseCurrency] = useState('IDR')

  function syncMoneyFromForm() {
    const el = formRef.current
    if (!el) return
    const fd = new FormData(el)
    setBaseAmount(String(fd.get('base_amount') ?? ''))
    setBaseCurrency(String(fd.get('base_amount_currency') ?? 'IDR'))
  }

  useLayoutEffect(() => {
    syncMoneyFromForm()
  }, [])
  const [bonus, setBonus] = useState('0')
  const [deduction, setDeduction] = useState('0')

  const netPrimary = useMemo(() => {
    const b = parseFloat(baseAmount) || 0
    const bo = parseFloat(bonus) || 0
    const d = parseFloat(deduction) || 0
    return b + bo - d
  }, [baseAmount, bonus, deduction])

  const netIdrPreview = useMemo(() => {
    if (baseCurrency === 'IDR') return netPrimary
    return netPrimary * fxRate
  }, [netPrimary, baseCurrency, fxRate])

  return (
    <form
      ref={formRef}
      onChange={syncMoneyFromForm}
      onSubmit={e => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        setError(null)
        startTransition(async () => {
          const res = await createPayslip(fd)
          if (res.error) setError(res.error)
          else router.push('/finance/payslips')
        })
      }}
      style={{ maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '16px' }}
    >
      {error && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-danger)', margin: 0 }}>{error}</p>
      )}

      <div>
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
          Member <span style={{ color: 'var(--color-danger)' }}>*</span>
        </label>
        <select
          name="profile_id"
          required
          style={{
            width: '100%',
            height: '36px',
            borderRadius: 'var(--radius-control)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            padding: '0 10px',
            fontSize: '0.8125rem',
          }}
        >
          <option value="">Select member…</option>
          {members.map(m => (
            <option key={m.id} value={m.id}>
              {m.full_name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
            Month
          </label>
          <select
            name="period_month"
            required
            defaultValue={defaultMonth}
            style={{
              width: '100%',
              height: '36px',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              padding: '0 10px',
              fontSize: '0.8125rem',
            }}
          >
            {MONTHS.map(m => (
              <option key={m.v} value={m.v}>{m.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
            Year
          </label>
          <select
            name="period_year"
            required
            defaultValue={defaultYear}
            style={{
              width: '100%',
              height: '36px',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              padding: '0 10px',
              fontSize: '0.8125rem',
            }}
          >
            {YEARS.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <MoneyInput
        name="base_amount"
        label="Base amount"
        required
        defaultCurrency="IDR"
        fxRateToIDR={fxRate}
      />

      <div>
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
          Bonus
        </label>
        <input
          type="number"
          name="bonus_amount"
          value={bonus}
          onChange={e => setBonus(e.target.value)}
          min={0}
          step="any"
          style={{
            width: '100%',
            height: '36px',
            borderRadius: 'var(--radius-control)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            padding: '0 10px',
            fontSize: '0.8125rem',
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
          Deduction
        </label>
        <input
          type="number"
          name="deduction_amount"
          value={deduction}
          onChange={e => setDeduction(e.target.value)}
          min={0}
          step="any"
          style={{
            width: '100%',
            height: '36px',
            borderRadius: 'var(--radius-control)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            padding: '0 10px',
            fontSize: '0.8125rem',
          }}
        />
      </div>

      <div
        style={{
          padding: '12px 14px',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface-muted)',
        }}
      >
        <p style={{ margin: '0 0 4px', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Net (read-only)
        </p>
        <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          {baseCurrency === 'IDR'
            ? formatIDR(netPrimary)
            : `USD ${netPrimary.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
        </p>
        <p style={{ margin: '10px 0 0', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
          Net yang diterima: {formatIDR(netIdrPreview)}
        </p>
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
          Payment account
        </label>
        <select
          name="payment_account_id"
          style={{
            width: '100%',
            height: '36px',
            borderRadius: 'var(--radius-control)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            padding: '0 10px',
            fontSize: '0.8125rem',
          }}
        >
          <option value="">—</option>
          {accounts.map(a => (
            <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>
          ))}
        </select>
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
          Notes
        </label>
        <textarea
          name="notes"
          rows={3}
          placeholder="Optional"
          style={{
            width: '100%',
            borderRadius: 'var(--radius-control)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            padding: '8px 10px',
            fontSize: '0.8125rem',
            resize: 'vertical',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
        <button
          type="submit"
          disabled={isPending}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-control)',
            border: 'none',
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-primary-fg)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: isPending ? 'wait' : 'pointer',
            opacity: isPending ? 0.75 : 1,
          }}
        >
          {isPending ? 'Saving…' : 'Generate payslip'}
        </button>
        <Link
          href="/finance/payslips"
          style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 500 }}
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
