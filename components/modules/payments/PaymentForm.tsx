'use client'

import { useActionState } from 'react'
import type { CSSProperties } from 'react'
import { FormSection } from '@/components/shared/FormSection'

type MemberOption = { id: string; full_name: string }
type OptionPair = { value: string; label: string }

interface Props {
  members: MemberOption[]
  defaultValues?: Record<string, string | number | null>
  action: (formData: FormData) => Promise<{ error: string } | void>
  submitLabel: string
  paymentMethodOptions?: OptionPair[]
}

const LABEL: CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  marginBottom: '4px',
}

const INPUT: CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  fontSize: '0.8125rem',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-control)',
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-text-primary)',
}

const GRID2: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '14px',
}

export function PaymentForm({ members, defaultValues: dv = {}, action, submitLabel, paymentMethodOptions }: Props) {
  async function clientAction(_prev: { error: string } | null, formData: FormData) {
    const result = await action(formData)
    if (result && 'error' in result) return result
    return null
  }

  const [state, formAction, isPending] = useActionState(clientAction, null)

  return (
    <form action={formAction}>
      {state?.error && (
        <div style={{ padding: '10px 14px', marginBottom: '16px', borderRadius: 'var(--radius-control)', backgroundColor: 'var(--color-danger-subtle)', color: 'var(--color-danger)', fontSize: '0.8125rem' }}>
          {state.error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <FormSection title="Member & Period" first>
          <div style={GRID2}>
            <div>
              <label style={LABEL}>Member *</label>
              <select name="member_id" required defaultValue={(dv.member_id as string) ?? ''} style={INPUT}>
                <option value="">Select member…</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={LABEL}>Period Label</label>
              <input name="period_label" defaultValue={(dv.period_label as string) ?? ''} placeholder="e.g. April 2026" style={INPUT} />
            </div>
          </div>
        </FormSection>

        <FormSection title="Amounts (IDR)">
          <div style={GRID2}>
            <div>
              <label style={LABEL}>Total Due *</label>
              <input name="total_due" type="number" step="1" min="0" required defaultValue={dv.total_due ?? ''} style={INPUT} placeholder="e.g. 5000000" />
            </div>
            <div>
              <label style={LABEL}>Total Paid</label>
              <input name="total_paid" type="number" step="1" min="0" defaultValue={dv.total_paid ?? 0} style={INPUT} placeholder="0" />
            </div>
            <div>
              <label style={LABEL}>Currency</label>
              <input name="currency_code" defaultValue={(dv.currency_code as string) ?? 'IDR'} style={INPUT} readOnly />
            </div>
          </div>
          <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '6px' }}>
            Balance and status are calculated automatically from Total Due and Total Paid.
          </p>
        </FormSection>

        <FormSection title="Payment Details">
          <div style={GRID2}>
            <div>
              <label style={LABEL}>Payment Date</label>
              <input name="payment_date" type="date" defaultValue={(dv.payment_date as string) ?? ''} style={INPUT} />
            </div>
            <div>
              <label style={LABEL}>Payment Method</label>
              <select name="payment_method" defaultValue={(dv.payment_method as string) ?? ''} style={INPUT}>
                <option value="">Select…</option>
                {(paymentMethodOptions ?? []).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={LABEL}>Payment Reference</label>
              <input name="payment_reference" defaultValue={(dv.payment_reference as string) ?? ''} placeholder="Transfer # or receipt ID" style={INPUT} />
            </div>
            <div>
              <label style={LABEL}>Proof Link</label>
              <input name="proof_link" defaultValue={(dv.proof_link as string) ?? ''} placeholder="https://…" style={INPUT} />
              <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                Optional. Use a full http(s) URL only.
              </p>
            </div>
          </div>
        </FormSection>

        <FormSection title="Notes">
          <label style={LABEL}>Notes</label>
          <textarea name="notes" rows={3} defaultValue={(dv.notes as string) ?? ''} style={{ ...INPUT, resize: 'vertical' }} placeholder="Optional notes…" />
        </FormSection>
      </div>

      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="submit"
          disabled={isPending}
          style={{
            padding: '9px 20px',
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-primary-fg)',
            border: 'none',
            borderRadius: 'var(--radius-control)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: isPending ? 'not-allowed' : 'pointer',
            opacity: isPending ? 0.7 : 1,
          }}
        >
          {isPending ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
