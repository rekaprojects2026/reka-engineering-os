'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createIntake, updateIntake } from '@/lib/intakes/actions'
import {
  SOURCE_PLATFORMS,
  DISCIPLINES,
  PROJECT_TYPES,
  COMPLEXITY_OPTIONS,
  INTAKE_STATUS_OPTIONS,
} from '@/lib/constants/options'
import type { Intake } from '@/types/database'
import { FormSection } from '@/components/shared/FormSection'

type OptionPair = { value: string; label: string }

interface IntakeFormProps {
  mode: 'create' | 'edit'
  intake?: Intake
  clients: { id: string; client_name: string; client_code: string }[]
  disciplineOptions?: OptionPair[]
  projectTypeOptions?: OptionPair[]
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 11px',
  border: '1px solid var(--input-border)',
  borderRadius: 'var(--radius-control)',
  fontSize: '0.8125rem',
  color: 'var(--text-primary-neutral)',
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8125rem',
  fontWeight: 500,
  color: 'var(--text-secondary-neutral)',
  marginBottom: '5px',
}

const fieldGroupStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '16px',
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>
        {label}{required && <span style={{ color: 'var(--color-danger)', marginLeft: '2px' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

export function IntakeForm({ mode, intake, clients, disciplineOptions, projectTypeOptions }: IntakeFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [useExistingClient, setUseExistingClient] = useState<boolean>(
    mode === 'edit' ? !!intake?.client_id : false
  )
  const [statusValue, setStatusValue] = useState(intake?.status ?? 'new')

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = mode === 'create'
        ? await createIntake(formData)
        : await updateIntake(intake!.id, formData)

      if (result?.error) setError(result.error)
    })
  }

  const todayString = new Date().toISOString().split('T')[0]

  return (
    <form action={handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>

        <FormSection title="Lead Information" first>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Field label="Title" required>
              <input
                name="title"
                type="text"
                required
                defaultValue={intake?.title ?? ''}
                placeholder="e.g. Steel Frame Design for Warehouse Expansion"
                style={inputStyle}
              />
            </Field>
            <Field label="Short Brief">
              <textarea
                name="short_brief"
                rows={3}
                defaultValue={intake?.short_brief ?? ''}
                placeholder="Brief description of the opportunity — scope, context, expectations…"
                style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }}
              />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Client / Prospect">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Toggle */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setUseExistingClient(true)}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  borderRadius: 'var(--radius-control)',
                  border: useExistingClient ? '1px solid var(--color-primary)' : '1px solid var(--input-border)',
                  backgroundColor: useExistingClient ? 'var(--color-primary-subtle)' : 'var(--input-bg)',
                  color: useExistingClient ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                }}
              >
                Existing Client
              </button>
              <button
                type="button"
                onClick={() => setUseExistingClient(false)}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  borderRadius: 'var(--radius-control)',
                  border: !useExistingClient ? '1px solid var(--color-primary)' : '1px solid var(--input-border)',
                  backgroundColor: !useExistingClient ? 'var(--color-primary-subtle)' : 'var(--input-bg)',
                  color: !useExistingClient ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                }}
              >
                New Prospect
              </button>
            </div>

            {useExistingClient ? (
              <Field label="Linked Client" required>
                <select
                  name="client_id"
                  defaultValue={intake?.client_id ?? ''}
                  style={inputStyle}
                  required={useExistingClient}
                >
                  <option value="">Select a client…</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.client_name} ({c.client_code})
                    </option>
                  ))}
                </select>
                {/* Clear temp_client_name when using existing client */}
                <input type="hidden" name="temp_client_name" value="" />
              </Field>
            ) : (
              <Field label="Prospect / Client Name" required>
                <input
                  name="temp_client_name"
                  type="text"
                  required={!useExistingClient}
                  defaultValue={intake?.temp_client_name ?? ''}
                  placeholder="e.g. Ahmad from PT Konstruksi Maju"
                  style={inputStyle}
                />
                {/* Clear client_id when using prospect name */}
                <input type="hidden" name="client_id" value="" />
              </Field>
            )}
          </div>
        </FormSection>

        <FormSection title="Source & Classification">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={fieldGroupStyle}>
              <Field label="Source" required>
                <select name="source" defaultValue={intake?.source ?? 'direct'} style={inputStyle} required>
                  {SOURCE_PLATFORMS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="External Reference URL">
                <input
                  name="external_reference_url"
                  type="url"
                  defaultValue={intake?.external_reference_url ?? ''}
                  placeholder="https://www.upwork.com/jobs/…"
                  style={inputStyle}
                />
              </Field>
            </div>
            <div style={fieldGroupStyle}>
              <Field label="Discipline" required>
                <select name="discipline" defaultValue={intake?.discipline ?? 'mechanical'} style={inputStyle} required>
                  {(disciplineOptions ?? DISCIPLINES).map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Project Type" required>
                <select name="project_type" defaultValue={intake?.project_type ?? 'design'} style={inputStyle} required>
                  {(projectTypeOptions ?? PROJECT_TYPES).map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        </FormSection>

        <FormSection title="Timeline & Budget">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={fieldGroupStyle}>
              <Field label="Received Date" required>
                <input
                  name="received_date"
                  type="date"
                  required
                  defaultValue={intake?.received_date ?? todayString}
                  style={inputStyle}
                />
              </Field>
              <Field label="Proposed Deadline">
                <input
                  name="proposed_deadline"
                  type="date"
                  defaultValue={intake?.proposed_deadline ?? ''}
                  style={inputStyle}
                />
              </Field>
            </div>
            <div style={fieldGroupStyle}>
              <Field label="Budget Estimate (USD)">
                <input
                  name="budget_estimate"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={intake?.budget_estimate ?? ''}
                  placeholder="0.00"
                  style={inputStyle}
                />
              </Field>
              <Field label="Estimated Complexity">
                <select name="estimated_complexity" defaultValue={intake?.estimated_complexity ?? ''} style={inputStyle}>
                  <option value="">Not assessed</option>
                  {COMPLEXITY_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        </FormSection>

        <FormSection title="Qualification & Status">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ maxWidth: '280px' }}>
              <Field label="Status" required>
                <select
                  name="status"
                  value={statusValue}
                  onChange={(e) => setStatusValue(e.target.value)}
                  style={inputStyle}
                  required
                >
                  {(mode === 'create'
                    ? INTAKE_STATUS_OPTIONS.filter((o) => o.value !== 'converted')
                    : INTAKE_STATUS_OPTIONS
                  ).map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </Field>
            </div>
            {mode === 'create' && statusValue === 'closed' && (
              <p
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.5,
                  margin: 0,
                  padding: '8px 10px',
                  backgroundColor: 'var(--surface-neutral)',
                  border: '1px solid var(--input-border)',
                  borderRadius: 'var(--radius-control)',
                }}
              >
                Lead dengan status Closed akan langsung bisa dikonversi ke project.
              </p>
            )}
            <Field label="Qualification Notes">
              <textarea
                name="qualification_notes"
                rows={3}
                defaultValue={intake?.qualification_notes ?? ''}
                placeholder="Notes on feasibility, fit, scope clarity, risk…"
                style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }}
              />
            </Field>
          </div>
        </FormSection>

        {/* Error */}
        {error && (
          <div
            role="alert"
            style={{
              padding: '10px 12px',
              backgroundColor: 'var(--color-danger-subtle)',
              border: '1px solid var(--border-strong-neutral)',
              borderRadius: 'var(--radius-control)',
              color: 'var(--color-danger)',
              fontSize: '0.8125rem',
            }}
          >
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
          <button
            type="submit"
            disabled={isPending}
            style={{
              padding: '9px 20px',
              backgroundColor: isPending ? 'var(--color-primary-hover)' : 'var(--color-primary)',
              color: 'var(--color-primary-fg)',
              border: 'none',
              borderRadius: 'var(--radius-control)',
              fontSize: '0.8125rem',
              fontWeight: 500,
              cursor: isPending ? 'not-allowed' : 'pointer',
            }}
          >
            {isPending ? 'Saving…' : mode === 'create' ? 'Create Intake' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            disabled={isPending}
            style={{
              padding: '9px 16px',
              backgroundColor: 'var(--surface-card)',
              color: 'var(--text-secondary-neutral)',
              border: '1px solid var(--input-border)',
              borderRadius: 'var(--radius-control)',
              fontSize: '0.8125rem',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  )
}
