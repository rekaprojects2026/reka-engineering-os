'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createWorkLog, type WorkLogActionResult } from '@/lib/work-logs/actions'

export type WorkLogTaskOption = {
  id: string
  title: string
  project_id: string
  project_code: string | null
}

type Props = {
  tasks: WorkLogTaskOption[]
  defaultLogDate: string
}

export function WorkLogCreateForm({ tasks, defaultLogDate }: Props) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [projectId, setProjectId] = useState('')

  const [state, formAction, pending] = useActionState(
    async (_prev: WorkLogActionResult | null, formData: FormData): Promise<WorkLogActionResult | null> => {
      return createWorkLog(formData)
    },
    null,
  )

  useEffect(() => {
    if (state && 'ok' in state && state.ok) {
      formRef.current?.reset()
      setProjectId('')
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '10px',
          alignItems: 'end',
        }}
      >
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 500,
              color: 'var(--text-secondary-neutral)',
              marginBottom: '4px',
            }}
          >
            Task *
          </label>
          <select
            name="task_id"
            required
            defaultValue=""
            onChange={(e) => {
              const opt = e.target.selectedOptions[0]
              const pid = opt?.dataset.projectId ?? ''
              setProjectId(pid)
            }}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--input-border)',
              fontSize: '0.8125rem',
              color: 'var(--text-primary-neutral)',
            }}
          >
            <option value="">Pilih task…</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id} data-project-id={t.project_id}>
                [{t.project_code ?? '—'}] {t.title}
              </option>
            ))}
          </select>
          <input type="hidden" name="project_id" value={projectId} />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 500,
              color: 'var(--text-secondary-neutral)',
              marginBottom: '4px',
            }}
          >
            Tanggal *
          </label>
          <input
            type="date"
            name="log_date"
            required
            defaultValue={defaultLogDate}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--input-border)',
              fontSize: '0.8125rem',
              color: 'var(--text-primary-neutral)',
            }}
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 500,
              color: 'var(--text-secondary-neutral)',
              marginBottom: '4px',
            }}
          >
            Jam *
          </label>
          <input
            type="number"
            name="hours_logged"
            required
            min={0.25}
            max={24}
            step={0.25}
            placeholder="e.g. 4"
            style={{
              width: '100%',
              maxWidth: '120px',
              padding: '8px 10px',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--input-border)',
              fontSize: '0.8125rem',
              color: 'var(--text-primary-neutral)',
            }}
          />
        </div>

        <div style={{ gridColumn: 'span 1', minWidth: 0 }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 500,
              color: 'var(--text-secondary-neutral)',
              marginBottom: '4px',
            }}
          >
            Catatan
          </label>
          <input
            type="text"
            name="description"
            placeholder="Opsional…"
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--input-border)',
              fontSize: '0.8125rem',
              color: 'var(--text-primary-neutral)',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={pending || !projectId}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-control)',
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-primary-fg)',
            fontSize: '0.8125rem',
            fontWeight: 500,
            border: 'none',
            cursor: pending || !projectId ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
            opacity: pending || !projectId ? 0.65 : 1,
          }}
        >
          {pending ? 'Menyimpan…' : 'Simpan Log'}
        </button>
      </form>
      {state && 'error' in state && state.error ? (
        <p style={{ marginTop: '10px', fontSize: '0.8125rem', color: 'var(--color-danger)' }}>{state.error}</p>
      ) : null}
    </div>
  )
}
