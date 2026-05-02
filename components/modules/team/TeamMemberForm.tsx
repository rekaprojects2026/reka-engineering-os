'use client'

import { useTransition, type CSSProperties, type ReactNode, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createMember, updateMember } from '@/lib/team/actions'
import {
  DISCIPLINES,
  SYSTEM_ROLES,
  WORKER_TYPES,
  ACTIVE_STATUS_OPTIONS,
  AVAILABILITY_STATUS_OPTIONS,
  RATE_TYPE_OPTIONS,
  FUNCTIONAL_ROLES,
} from '@/lib/constants/options'
import type { TeamMember } from '@/lib/team/queries'
import { FormSection } from '@/components/shared/FormSection'

const ASSIGNABLE_SYSTEM_ROLES = SYSTEM_ROLES.filter((r) => r.value !== 'owner')

type OptionPair = { value: string; label: string }

interface TeamMemberFormProps {
  mode: 'create' | 'edit'
  member?: TeamMember
  functionalRoleOptions?: OptionPair[]
  disciplineOptions?: OptionPair[]
  workerTypeOptions?: OptionPair[]
  isAdmin?: boolean
}

// ── Shared style constants ────────────────────────────────────

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

const twoColGrid: CSSProperties = {
  display:             'grid',
  gridTemplateColumns: '1fr 1fr',
  gap:                 '16px',
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: ReactNode
}) {
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

// ── Component ─────────────────────────────────────────────────

export function TeamMemberForm({ mode, member, functionalRoleOptions, disciplineOptions, workerTypeOptions, isAdmin = true }: TeamMemberFormProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createMember(formData)
          : await updateMember(member!.id, formData)
      if (result?.error) {
        alert(result.error)
      }
    })
  }

  const v = member // shorthand for edit defaults

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>

        <FormSection title="Basic Info" first>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={twoColGrid}>
              <Field label="Full Name" required>
                <input
                  style={inputStyle}
                  name="full_name"
                  defaultValue={v?.full_name ?? ''}
                  required
                  placeholder="e.g. Budi Santoso"
                />
              </Field>
              <Field label="Email" required={mode === 'create'}>
                {mode === 'create' ? (
                  <input
                    style={inputStyle}
                    name="email"
                    type="email"
                    required
                    placeholder="e.g. budi@example.com"
                  />
                ) : (
                  <input
                    style={{ ...inputStyle, backgroundColor: 'var(--surface-neutral)', color: 'var(--text-muted-neutral)' }}
                    value={v?.email ?? ''}
                    readOnly
                    tabIndex={-1}
                  />
                )}
              </Field>
            </div>
            <Field label="Google Email (untuk Drive)">
              <input
                style={inputStyle}
                name="google_email"
                type="email"
                defaultValue={v?.google_email ?? ''}
                placeholder="Kosongkan kalau sama dengan email login"
              />
              <p style={{ marginTop: '4px', fontSize: '0.6875rem', color: 'var(--text-muted-neutral)' }}>
                Diisi kalau email Google Drive kamu berbeda dengan email login ReKa OS.
              </p>
            </Field>
            <div style={twoColGrid}>
              <Field label="Phone / WhatsApp">
                <input
                  style={inputStyle}
                  name="phone"
                  type="tel"
                  defaultValue={v?.phone ?? ''}
                  placeholder="+62 812 3456 7890"
                />
              </Field>
              <Field label="City">
                <input
                  style={inputStyle}
                  name="city"
                  defaultValue={v?.city ?? ''}
                  placeholder="e.g. Jakarta"
                />
              </Field>
            </div>
            <Field label="Portfolio / LinkedIn Link">
              <input
                style={inputStyle}
                name="portfolio_link"
                type="url"
                defaultValue={v?.portfolio_link ?? ''}
                placeholder="https://"
              />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Role & Work">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {isAdmin && (
              <div style={twoColGrid}>
                <Field label="System Role">
                  <select style={inputStyle} name="system_role" defaultValue={v?.system_role ?? ''}>
                    <option value="">— Select —</option>
                    {ASSIGNABLE_SYSTEM_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Worker Type">
                  <select style={inputStyle} name="worker_type" defaultValue={v?.worker_type ?? ''}>
                    <option value="">— Select —</option>
                    {(workerTypeOptions ?? WORKER_TYPES).map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </Field>
              </div>
            )}
            <div style={twoColGrid}>
              <Field label="Discipline">
                <select style={inputStyle} name="discipline" defaultValue={v?.discipline ?? ''}>
                  <option value="">— Select —</option>
                  {(disciplineOptions ?? DISCIPLINES).map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Functional Role">
                <select style={inputStyle} name="functional_role" defaultValue={v?.functional_role ?? ''}>
                  <option value="">— Select —</option>
                  {(functionalRoleOptions ?? FUNCTIONAL_ROLES).map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        </FormSection>

        <FormSection title={isAdmin ? 'Status & Availability' : 'Availability'}>
          <div style={twoColGrid}>
            {isAdmin && (
              <Field label="Active Status">
                <select style={inputStyle} name="active_status" defaultValue={v?.active_status ?? 'active'}>
                  {ACTIVE_STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </Field>
            )}
            <Field label="Availability">
              <select style={inputStyle} name="availability_status" defaultValue={v?.availability_status ?? 'available'}>
                {AVAILABILITY_STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </Field>
            {isAdmin && (
              <Field label="Joined Date">
                <input
                  style={inputStyle}
                  name="joined_date"
                  type="date"
                  defaultValue={v?.joined_date ?? ''}
                />
              </Field>
            )}
          </div>
        </FormSection>

        {isAdmin && (
          <FormSection title="Rate Info">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={twoColGrid}>
                <Field label="Rate Type">
                  <select style={inputStyle} name="rate_type" defaultValue={v?.rate_type ?? ''}>
                    <option value="">— Select —</option>
                    {RATE_TYPE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Currency">
                  <input
                    style={inputStyle}
                    name="currency_code"
                    defaultValue={v?.currency_code ?? 'IDR'}
                    placeholder="IDR"
                  />
                </Field>
              </div>
              <div style={twoColGrid}>
                <Field label="Expected Rate">
                  <input
                    style={inputStyle}
                    name="expected_rate"
                    type="number"
                    min="0"
                    step="1000"
                    defaultValue={v?.expected_rate ?? ''}
                    placeholder="0"
                  />
                </Field>
                <Field label="Approved Rate">
                  <input
                    style={inputStyle}
                    name="approved_rate"
                    type="number"
                    min="0"
                    step="1000"
                    defaultValue={v?.approved_rate ?? ''}
                    placeholder="0"
                  />
                </Field>
              </div>
            </div>
          </FormSection>
        )}

        {isAdmin && (
          <FormSection title="Internal Notes">
            <Field label="Notes (internal only)">
              <textarea
                style={{ ...inputStyle, minHeight: '90px', resize: 'vertical' }}
                name="notes_internal"
                defaultValue={v?.notes_internal ?? ''}
                placeholder="Notes visible only to admin…"
              />
            </Field>
          </FormSection>
        )}

        {/* ── Actions ───────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px' }}>
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
              backgroundColor: isPending ? 'var(--text-muted-neutral)' : 'var(--color-primary)',
              cursor:          isPending ? 'not-allowed' : 'pointer',
            }}
          >
            {isPending
              ? mode === 'create' ? 'Adding…' : 'Saving…'
              : mode === 'create' ? 'Add Member' : 'Save Changes'}
          </button>
        </div>
      </div>
    </form>
  )
}
