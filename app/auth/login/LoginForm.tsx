'use client'

import { useState, useTransition } from 'react'
import { login } from './actions'

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await login(formData)
      if (result?.error) setError(result.error)
    })
  }

  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    border: '1px solid var(--color-border)',
    borderRadius: '6px',
    fontSize: '0.875rem',
    color: 'var(--color-text-primary)',
    backgroundColor: 'var(--color-surface)',
    outline: 'none',
    transition: 'border-color 0.15s',
  } as React.CSSProperties

  return (
    <form action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label
          htmlFor="email"
          style={{
            display: 'block',
            fontSize: '0.8125rem',
            fontWeight: 500,
            color: 'var(--color-text-secondary)',
            marginBottom: '6px',
          }}
        >
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@agency.com"
          style={inputStyle}
        />
      </div>

      <div>
        <label
          htmlFor="password"
          style={{
            display: 'block',
            fontSize: '0.8125rem',
            fontWeight: 500,
            color: 'var(--color-text-secondary)',
            marginBottom: '6px',
          }}
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          style={inputStyle}
        />
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: '10px 12px',
            backgroundColor: 'var(--color-danger-subtle)',
            border: '1px solid #FECACA',
            borderRadius: '6px',
            color: 'var(--color-danger)',
            fontSize: '0.8125rem',
          }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        style={{
          width: '100%',
          padding: '10px 16px',
          backgroundColor: isPending ? 'var(--color-primary-hover)' : 'var(--color-primary)',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          fontSize: '0.875rem',
          fontWeight: 500,
          cursor: isPending ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.15s',
          marginTop: '4px',
        }}
      >
        {isPending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
