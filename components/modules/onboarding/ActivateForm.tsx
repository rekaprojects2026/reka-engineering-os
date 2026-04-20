'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { AlertCircle } from 'lucide-react'
import { activateInvite } from '@/lib/invites/actions'

const controlClass =
  'h-10 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[0.875rem] text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-subtle)]'

const readOnlyControlClass =
  'h-10 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3 text-[0.875rem] text-[var(--color-text-muted)] outline-none'

interface Props {
  token: string
  email: string
  fullName: string | null
}

export function ActivateForm({ token, email, fullName }: Props) {
  const [error, setError] = useState<string | null>(null)
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label
          htmlFor="activate-email"
          className="mb-1.5 block text-[0.8125rem] font-medium text-[var(--color-text-secondary)]"
        >
          Email address
        </label>
        <input
          id="activate-email"
          className={readOnlyControlClass}
          value={email}
          readOnly
          tabIndex={-1}
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="activate-full-name"
          className="mb-1.5 block text-[0.8125rem] font-medium text-[var(--color-text-secondary)]"
        >
          Full name{' '}
          <span className="text-[var(--color-danger)]" aria-hidden>
            *
          </span>
        </label>
        <input
          id="activate-full-name"
          className={controlClass}
          name="full_name"
          required
          defaultValue={fullName ?? ''}
          placeholder="Your full name"
          autoComplete="name"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="activate-password"
          className="mb-1.5 block text-[0.8125rem] font-medium text-[var(--color-text-secondary)]"
        >
          Password{' '}
          <span className="text-[var(--color-danger)]" aria-hidden>
            *
          </span>
        </label>
        <input
          id="activate-password"
          className={controlClass}
          name="password"
          type="password"
          required
          minLength={8}
          placeholder="Minimum 8 characters"
          autoComplete="new-password"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="activate-confirm"
          className="mb-1.5 block text-[0.8125rem] font-medium text-[var(--color-text-secondary)]"
        >
          Confirm password{' '}
          <span className="text-[var(--color-danger)]" aria-hidden>
            *
          </span>
        </label>
        <input
          id="activate-confirm"
          className={controlClass}
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
          className="flex items-center gap-2 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-danger-subtle)] px-4 py-3 text-[0.8125rem] text-[var(--color-danger)]"
        >
          <AlertCircle size={16} className="shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="btn-primary mt-2 h-10 w-full rounded-md px-4 text-[0.875rem] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? 'Activating…' : 'Activate account'}
      </button>
    </form>
  )
}
