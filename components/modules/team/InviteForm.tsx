'use client'

import { useTransition, type FormEvent, type CSSProperties, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { createInvite } from '@/lib/invites/actions'
import { SYSTEM_ROLES, WORKER_TYPES } from '@/lib/constants/options'
import { FormSection } from '@/components/shared/FormSection'

const inputStyle: CSSProperties = {
  width:           '100%',
  padding:         '8px 11px',
  border:          '1px solid var(--input-border)',
  borderRadius:    'var(--radius-control)',
  fontSize:        '0.8125rem',
  color:           'var(--text-primary-neutral)',
  outline:         'none',
}

const labelStyle: CSSProperties = {
  display:      'block',
  fontSize:     '0.8125rem',
  fontWeight:   500,
  color:        'var(--text-secondary-neutral)',
  marginBottom: '5px',
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>
        {label}
        {required && <span style={{ color: 'var(--brand-accent)', marginLeft: '2px' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

type OptionPair = { value: string; label: string }

export function InviteForm({
  workerTypeOptions,
  canInviteDirektur = false,
}: {
  workerTypeOptions?: OptionPair[]
  canInviteDirektur?: boolean
} = {}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const assignableSystemRoles = SYSTEM_ROLES.filter(
    (r) => r.value !== 'owner' && (canInviteDirektur || r.value !== 'direktur')
  )

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createInvite(formData)
      if (result?.error) alert(result.error)
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>

        <FormSection title="Invite details" first>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Email address" required>
              <input
                style={inputStyle}
                name="email"
                type="email"
                required
                placeholder="freelancer@example.com"
                autoComplete="off"
              />
            </Field>
            <Field label="Full name (optional — pre-fills activation form)">
              <input
                style={inputStyle}
                name="full_name"
                placeholder="e.g. Budi Santoso"
              />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Role & access">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="System Role">
              <select style={inputStyle} name="system_role" defaultValue="member">
                <option value="">— Select —</option>
                {assignableSystemRoles.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Worker Type">
              <select style={inputStyle} name="worker_type" defaultValue="">
                <option value="">— Select —</option>
                {(workerTypeOptions ?? WORKER_TYPES).map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </Field>
          </div>
        </FormSection>

        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted-neutral)', lineHeight: 1.5, marginTop: '4px' }}>
          An invite link will be generated. Copy it and share manually with the invited person. They will use it to set their password and complete their profile.
        </p>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => router.back()}
            disabled={isPending}
            style={{
              padding:         '8px 16px',
              border:          '1px solid var(--input-border)',
              borderRadius:    'var(--radius-control)',
              fontSize:        '0.8125rem',
              fontWeight:      500,
              color:           'var(--text-secondary-neutral)',
              backgroundColor: 'var(--surface-card)',
              cursor:          'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            style={{
              padding:         '8px 18px',
              border:          'none',
              borderRadius:    'var(--radius-control)',
              fontSize:        '0.8125rem',
              fontWeight:      500,
              color:           'var(--color-primary-fg)',
              backgroundColor: isPending ? 'var(--color-text-muted)' : 'var(--color-primary)',
              cursor:          isPending ? 'not-allowed' : 'pointer',
            }}
          >
            {isPending ? 'Creating…' : 'Create Invite'}
          </button>
        </div>
      </div>
    </form>
  )
}
