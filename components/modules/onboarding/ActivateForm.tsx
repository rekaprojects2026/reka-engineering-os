'use client'

import { useState, useTransition, type FormEvent, type CSSProperties } from 'react'
import { activateInvite } from '@/lib/invites/actions'

const inputStyle: CSSProperties = {
  width:           '100%',
  padding:         '9px 12px',
  border:          '1px solid var(--color-border)',
  borderRadius:    '6px',
  fontSize:        '0.875rem',
  color:           'var(--color-text-primary)',
  backgroundColor: 'var(--color-surface)',
  outline:         'none',
}

const labelStyle: CSSProperties = {
  display:      'block',
  fontSize:     '0.8125rem',
  fontWeight:   500,
  color:        'var(--color-text-secondary)',
  marginBottom: '6px',
}

interface Props {
  token:    string
  email:    string
  fullName: string | null
}

export function ActivateForm({ token, email, fullName }: Props) {
  const [error, setError]     = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await activateInvite(token, formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Email — readonly */}
      <div>
        <label style={labelStyle}>Email address</label>
        <input
          style={{ ...inputStyle, backgroundColor: 'var(--color-surface-subtle)', color: 'var(--color-text-muted)' }}
          value={email}
          readOnly
          tabIndex={-1}
        />
      </div>

      {/* Full name */}
      <div>
        <label style={labelStyle}>
          Full name <span style={{ color: 'var(--color-danger)' }}>*</span>
        </label>
        <input
          style={inputStyle}
          name="full_name"
          required
          defaultValue={fullName ?? ''}
          placeholder="Your full name"
          autoComplete="name"
        />
      </div>

      {/* Password */}
      <div>
        <label style={labelStyle}>
          Password <span style={{ color: 'var(--color-danger)' }}>*</span>
        </label>
        <input
          style={inputStyle}
          name="password"
          type="password"
          required
          minLength={8}
          placeholder="Minimum 8 characters"
          autoComplete="new-password"
        />
      </div>

      {/* Confirm password */}
      <div>
        <label style={labelStyle}>
          Confirm password <span style={{ color: 'var(--color-danger)' }}>*</span>
        </label>
        <input
          style={inputStyle}
          name="confirm_password"
          type="password"
          required
          placeholder="Repeat your password"
          autoComplete="new-password"
        />
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding:         '10px 12px',
            backgroundColor: 'var(--color-danger-subtle)',
            border:          '1px solid #FECACA',
            borderRadius:    '6px',
            color:           'var(--color-danger)',
            fontSize:        '0.8125rem',
          }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        style={{
          width:           '100%',
          padding:         '10px 16px',
          backgroundColor: isPending ? 'var(--color-text-muted)' : 'var(--color-primary)',
          color:           '#fff',
          border:          'none',
          borderRadius:    '6px',
          fontSize:        '0.875rem',
          fontWeight:      500,
          cursor:          isPending ? 'not-allowed' : 'pointer',
          marginTop:       '4px',
        }}
      >
        {isPending ? 'Activating…' : 'Activate account'}
      </button>
    </form>
  )
}
