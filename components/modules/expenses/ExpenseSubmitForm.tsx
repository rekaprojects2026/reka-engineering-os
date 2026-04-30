'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { submitExpense, type ExpenseActionResult } from '@/lib/expenses/actions'

export type ExpenseProjectOption = {
  id: string
  project_code: string
  name: string
}

const CATEGORY_LABELS: Record<string, string> = {
  printing: 'Cetak Dokumen',
  survey: 'Survey Lapangan',
  transport: 'Transport',
  accommodation: 'Akomodasi',
  materials: 'Material',
  software: 'Software/Lisensi',
  meals: 'Konsumsi',
  other: 'Lainnya',
}

type Props = {
  projects: ExpenseProjectOption[]
  defaultExpenseDate: string
}

export function ExpenseSubmitForm({ projects, defaultExpenseDate }: Props) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  const [state, formAction, pending] = useActionState(
    async (_prev: ExpenseActionResult | null, formData: FormData): Promise<ExpenseActionResult | null> => {
      return submitExpense(formData)
    },
    null,
  )

  useEffect(() => {
    if (state && 'ok' in state && state.ok) {
      formRef.current?.reset()
      router.refresh()
    }
  }, [state, router])

  return (
    <div>
      <form
        ref={formRef}
        action={formAction}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
        }}
      >
        <div style={{ gridColumn: 'span 1', minWidth: 0 }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              marginBottom: '4px',
            }}
          >
            Project *
          </label>
          <select
            name="project_id"
            required
            defaultValue=""
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--color-border)',
              fontSize: '0.8125rem',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
            }}
          >
            <option value="">Pilih project…</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                [{p.project_code}] {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              marginBottom: '4px',
            }}
          >
            Kategori *
          </label>
          <select
            name="category"
            required
            defaultValue=""
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--color-border)',
              fontSize: '0.8125rem',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
            }}
          >
            <option value="">Pilih…</option>
            {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              marginBottom: '4px',
            }}
          >
            Tanggal *
          </label>
          <input
            type="date"
            name="expense_date"
            required
            defaultValue={defaultExpenseDate}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--color-border)',
              fontSize: '0.8125rem',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
            }}
          />
        </div>

        <div style={{ gridColumn: '1 / -1', minWidth: 0 }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              marginBottom: '4px',
            }}
          >
            Deskripsi *
          </label>
          <input
            type="text"
            name="description"
            required
            placeholder="e.g. Print gambar A1 x3 lembar"
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--color-border)',
              fontSize: '0.8125rem',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(100px, 1fr) 1fr', gap: '8px' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 500,
                color: 'var(--color-text-secondary)',
                marginBottom: '4px',
              }}
            >
              Mata Uang
            </label>
            <select
              name="currency_code"
              defaultValue="IDR"
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 'var(--radius-control)',
                border: '1px solid var(--color-border)',
                fontSize: '0.8125rem',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
              }}
            >
              <option value="IDR">IDR</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 500,
                color: 'var(--color-text-secondary)',
                marginBottom: '4px',
              }}
            >
              Jumlah *
            </label>
            <input
              type="number"
              name="amount"
              required
              min={1}
              step={1}
              placeholder="e.g. 75000"
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 'var(--radius-control)',
                border: '1px solid var(--color-border)',
                fontSize: '0.8125rem',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
        </div>

        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
          <button
            type="submit"
            disabled={pending || projects.length === 0}
            style={{
              padding: '8px 20px',
              borderRadius: 'var(--radius-control)',
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-primary-fg)',
              fontSize: '0.8125rem',
              fontWeight: 500,
              border: 'none',
              cursor: pending || projects.length === 0 ? 'not-allowed' : 'pointer',
              opacity: pending || projects.length === 0 ? 0.65 : 1,
            }}
          >
            {pending ? 'Mengirim…' : 'Submit Expense'}
          </button>
        </div>
      </form>
      {state && 'error' in state && state.error ? (
        <p style={{ marginTop: '10px', fontSize: '0.8125rem', color: 'var(--color-danger)' }}>{state.error}</p>
      ) : null}
    </div>
  )
}
