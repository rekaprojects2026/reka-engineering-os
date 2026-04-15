'use client'

import { useTransition, type FormEvent, type CSSProperties, type ReactNode } from 'react'
import { completeProfile } from '@/lib/invites/actions'
import { AVAILABILITY_STATUS_OPTIONS } from '@/lib/constants/options'
import type { TeamMember } from '@/lib/team/queries'

interface Props {
  profile: TeamMember
}

const inputStyle: CSSProperties = {
  width:           '100%',
  padding:         '8px 11px',
  border:          '1px solid var(--color-border)',
  borderRadius:    '6px',
  fontSize:        '0.8125rem',
  color:           'var(--color-text-primary)',
  backgroundColor: 'var(--color-surface)',
  outline:         'none',
}

const labelStyle: CSSProperties = {
  display:      'block',
  fontSize:     '0.8125rem',
  fontWeight:   500,
  color:        'var(--color-text-secondary)',
  marginBottom: '5px',
}

const sectionTitleStyle: CSSProperties = {
  fontSize:      '0.75rem',
  fontWeight:    600,
  color:         'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom:  '14px',
  paddingBottom: '8px',
  borderBottom:  '1px solid var(--color-border)',
}

const twoCol: CSSProperties = {
  display:             'grid',
  gridTemplateColumns: '1fr 1fr',
  gap:                 '16px',
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '3px' }}>{hint}</p>}
    </div>
  )
}

export function ProfileCompletionForm({ profile }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await completeProfile(formData)
      if (result?.error) alert(result.error)
    })
  }

  const skillTagsValue = (profile.skill_tags ?? []).join(', ')

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

        {/* ── Basic Info ─────────────────────────────────────── */}
        <section>
          <p style={sectionTitleStyle}>Basic Info</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={twoCol}>
              <Field label="Full Name">
                <input
                  style={inputStyle}
                  name="full_name"
                  defaultValue={profile.full_name}
                  required
                />
              </Field>
              <Field label="Phone / WhatsApp">
                <input
                  style={inputStyle}
                  name="phone"
                  type="tel"
                  defaultValue={profile.phone ?? ''}
                  placeholder="+62 812 3456 7890"
                />
              </Field>
            </div>
            <div style={twoCol}>
              <Field label="City">
                <input
                  style={inputStyle}
                  name="city"
                  defaultValue={profile.city ?? ''}
                  placeholder="e.g. Jakarta"
                />
              </Field>
              <Field label="Portfolio / LinkedIn">
                <input
                  style={inputStyle}
                  name="portfolio_link"
                  type="url"
                  defaultValue={profile.portfolio_link ?? ''}
                  placeholder="https://"
                />
              </Field>
            </div>
            <Field label="Skills" hint="Comma-separated list, e.g. AutoCAD, Revit, Civil 3D, Structural Analysis">
              <input
                style={inputStyle}
                name="skill_tags"
                defaultValue={skillTagsValue}
                placeholder="AutoCAD, Revit, Excel…"
              />
            </Field>
          </div>
        </section>

        {/* ── Availability ───────────────────────────────────── */}
        <section>
          <p style={sectionTitleStyle}>Availability</p>
          <div style={twoCol}>
            <Field label="Current Availability">
              <select
                style={inputStyle}
                name="availability_status"
                defaultValue={profile.availability_status ?? 'available'}
              >
                {AVAILABILITY_STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Expected Rate (IDR)" hint="Optional — your preferred rate for new work">
              <input
                style={inputStyle}
                name="expected_rate"
                type="number"
                min="0"
                step="1000"
                defaultValue={profile.expected_rate ?? ''}
                placeholder="0"
              />
            </Field>
          </div>
        </section>

        {/* ── Payment Info ───────────────────────────────────── */}
        <section>
          <p style={sectionTitleStyle}>Payment Info</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '14px', lineHeight: 1.5 }}>
            Used for payment processing. All fields are optional and visible only to admin.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={twoCol}>
              <Field label="Bank Name">
                <input style={inputStyle} name="bank_name" defaultValue={profile.bank_name ?? ''} placeholder="e.g. BCA, Mandiri" />
              </Field>
              <Field label="Account Holder Name">
                <input style={inputStyle} name="bank_account_name" defaultValue={profile.bank_account_name ?? ''} />
              </Field>
            </div>
            <Field label="Account Number">
              <input
                style={{ ...inputStyle, fontFamily: 'monospace' }}
                name="bank_account_number"
                defaultValue={profile.bank_account_number ?? ''}
                placeholder="e.g. 1234567890"
              />
            </Field>
            <div style={twoCol}>
              <Field label="E-Wallet Type">
                <input style={inputStyle} name="ewallet_type" defaultValue={profile.ewallet_type ?? ''} placeholder="e.g. GoPay, OVO, DANA" />
              </Field>
              <Field label="E-Wallet Number">
                <input
                  style={{ ...inputStyle, fontFamily: 'monospace' }}
                  name="ewallet_number"
                  defaultValue={profile.ewallet_number ?? ''}
                  placeholder="+62 812 ..."
                />
              </Field>
            </div>
          </div>
        </section>

        {/* ── Submit ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            disabled={isPending}
            style={{
              padding:         '10px 24px',
              border:          'none',
              borderRadius:    '6px',
              fontSize:        '0.875rem',
              fontWeight:      500,
              color:           '#fff',
              backgroundColor: isPending ? 'var(--color-text-muted)' : 'var(--color-primary)',
              cursor:          isPending ? 'not-allowed' : 'pointer',
            }}
          >
            {isPending ? 'Saving…' : 'Complete Profile'}
          </button>
        </div>
      </div>
    </form>
  )
}
