'use client'

import { useActionState, useState } from 'react'
import type { CSSProperties } from 'react'
import { WORK_BASIS_OPTIONS, COMPENSATION_STATUS_OPTIONS } from '@/lib/constants/options'
import { FormSection } from '@/components/shared/FormSection'

type MemberOption = { id: string; full_name: string }
type ProjectOption = { id: string; name: string }

interface Props {
  members: MemberOption[]
  projects: ProjectOption[]
  defaultValues?: Record<string, string | number | null>
  action: (formData: FormData) => Promise<{ error: string } | void>
  submitLabel: string
  /** When false, status is managed by workflow (draft / Finance confirm). */
  showStatusField?: boolean
  /** Show guidance for TD / Manajer about MONTHLY_FIXED. */
  showMonthlyFixedGuidance?: boolean
}

const LABEL: CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--text-secondary-neutral)',
  marginBottom: '4px',
}

const INPUT: CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  fontSize: '0.8125rem',
  border: '1px solid var(--input-border)',
  borderRadius: 'var(--radius-control)',
  color: 'var(--text-primary-neutral)',
  outline: 'none',
}

const GRID2: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '14px',
}

export function CompensationForm({
  members,
  projects,
  defaultValues: dv = {},
  action,
  submitLabel,
  showStatusField = false,
  showMonthlyFixedGuidance = false,
}: Props) {
  const [rateType, setRateType] = useState<string>((dv.rate_type as string) ?? '')

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
        <FormSection title="Work Context" first>
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
              <label style={LABEL}>Project *</label>
              <select name="project_id" required defaultValue={(dv.project_id as string) ?? ''} style={INPUT}>
                <option value="">Select project…</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={LABEL}>Task ID (optional)</label>
              <input name="task_id" defaultValue={(dv.task_id as string) ?? ''} placeholder="Task UUID" style={INPUT} />
            </div>
            <div>
              <label style={LABEL}>Deliverable ID (optional)</label>
              <input name="deliverable_id" defaultValue={(dv.deliverable_id as string) ?? ''} placeholder="Deliverable UUID" style={INPUT} />
            </div>
          </div>
        </FormSection>

        <FormSection title="Rate & Amount">
          <div style={GRID2}>
            <div>
              <label style={LABEL}>Rate Type *</label>
              <select
                name="rate_type"
                required
                value={rateType || (dv.rate_type as string) || ''}
                onChange={(e) => setRateType(e.target.value)}
                style={INPUT}
              >
                <option value="">Select…</option>
                {WORK_BASIS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {showMonthlyFixedGuidance && (
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '6px', lineHeight: 1.45 }}>
                  MONTHLY_FIXED hanya bisa diatur langsung oleh Finance dari profil anggota tim (bukan lewat form ini).
                </p>
              )}
            </div>
            <div>
              <label style={LABEL}>Currency</label>
              <input name="currency_code" defaultValue={(dv.currency_code as string) ?? 'IDR'} style={INPUT} readOnly />
            </div>
            <div>
              <label style={LABEL}>Quantity *</label>
              <input name="qty" type="number" step="0.01" min="0" required defaultValue={dv.qty ?? 1} style={INPUT} />
            </div>
            <div>
              <label style={LABEL}>Rate Amount (IDR) *</label>
              <input name="rate_amount" type="number" step="1" min="0" required defaultValue={dv.rate_amount ?? ''} style={INPUT} placeholder="e.g. 500000" />
            </div>
          </div>
        </FormSection>

        <FormSection title="Period & Status">
          <div style={GRID2}>
            <div>
              <label style={LABEL}>Period Label</label>
              <input name="period_label" defaultValue={(dv.period_label as string) ?? ''} placeholder="e.g. April 2026 — Week 2" style={INPUT} />
            </div>
            <div>
              <label style={LABEL}>Work Date</label>
              <input name="work_date" type="date" defaultValue={(dv.work_date as string) ?? ''} style={INPUT} />
            </div>
            {showStatusField && (
              <div>
                <label style={LABEL}>Status</label>
                <select name="status" defaultValue={(dv.status as string) ?? 'draft'} style={INPUT}>
                  {COMPENSATION_STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            )}
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
