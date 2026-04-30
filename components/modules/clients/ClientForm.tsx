'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, updateClient } from '@/lib/clients/actions'
import { CLIENT_TYPES, CLIENT_STATUSES_OPTIONS, SOURCE_PLATFORMS } from '@/lib/constants/options'
import type { Client } from '@/types/database'
import { FormSection } from '@/components/shared/FormSection'

interface ClientFormProps {
  mode: 'create' | 'edit'
  client?: Client
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 11px',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-control)',
  fontSize: '0.8125rem',
  color: 'var(--color-text-primary)',
  backgroundColor: 'var(--color-surface)',
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8125rem',
  fontWeight: 500,
  color: 'var(--color-text-secondary)',
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

export function ClientForm({ mode, client }: ClientFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = mode === 'create'
        ? await createClient(formData)
        : await updateClient(client!.id, formData)

      if (result?.error) setError(result.error)
    })
  }

  return (
    <form action={handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>

        <FormSection title="Basic Information" first>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={fieldGroupStyle}>
              <Field label="Client Name" required>
                <input
                  name="client_name"
                  type="text"
                  required
                  defaultValue={client?.client_name ?? ''}
                  placeholder="e.g. PT Maju Engineering"
                  style={inputStyle}
                />
              </Field>
              <Field label="Company Name">
                <input
                  name="company_name"
                  type="text"
                  defaultValue={client?.company_name ?? ''}
                  placeholder="Legal entity name if different"
                  style={inputStyle}
                />
              </Field>
            </div>
            <div style={fieldGroupStyle}>
              <Field label="Client Type" required>
                <select name="client_type" defaultValue={client?.client_type ?? 'company'} style={inputStyle} required>
                  {CLIENT_TYPES.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Default Source" required>
                <select name="source_default" defaultValue={client?.source_default ?? 'direct'} style={inputStyle} required>
                  {SOURCE_PLATFORMS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div style={{ maxWidth: '280px' }}>
              <Field label="Status" required>
                <select name="status" defaultValue={client?.status ?? 'lead'} style={inputStyle} required>
                  {CLIENT_STATUSES_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        </FormSection>

        <FormSection title="Primary Contact">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Field label="Contact Name">
              <input
                name="primary_contact_name"
                type="text"
                defaultValue={client?.primary_contact_name ?? ''}
                placeholder="Full name"
                style={inputStyle}
              />
            </Field>
            <div style={fieldGroupStyle}>
              <Field label="Email">
                <input
                  name="primary_contact_email"
                  type="email"
                  defaultValue={client?.primary_contact_email ?? ''}
                  placeholder="contact@company.com"
                  style={inputStyle}
                />
              </Field>
              <Field label="Phone">
                <input
                  name="primary_contact_phone"
                  type="tel"
                  defaultValue={client?.primary_contact_phone ?? ''}
                  placeholder="+62 812 xxx xxxx"
                  style={inputStyle}
                />
              </Field>
            </div>
          </div>
        </FormSection>

        <FormSection title="Notes">
          <Field label="Internal Notes">
            <textarea
              name="notes"
              rows={4}
              defaultValue={client?.notes ?? ''}
              placeholder="Any notes about this client — context, preferences, history…"
              style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }}
            />
          </Field>
        </FormSection>

        {/* Error */}
        {error && (
          <div
            role="alert"
            style={{
              padding: '10px 12px',
              backgroundColor: 'var(--color-danger-subtle)',
              border: '1px solid var(--color-border-strong)',
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
            {isPending ? 'Saving…' : mode === 'create' ? 'Create Client' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            disabled={isPending}
            style={{
              padding: '9px 16px',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
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
