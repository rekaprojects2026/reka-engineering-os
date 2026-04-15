'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createDeliverable, updateDeliverable } from '@/lib/deliverables/actions'
import {
  DELIVERABLE_STATUS_OPTIONS,
  DELIVERABLE_TYPE_OPTIONS,
} from '@/lib/constants/options'
import type { Deliverable } from '@/types/database'

interface DeliverableFormProps {
  mode: 'create' | 'edit'
  deliverable?: Deliverable
  projects: { id: string; name: string; project_code: string }[]
  users: { id: string; full_name: string; email: string; discipline: string | null }[]
  tasks?: { id: string; title: string }[]
  defaultProjectId?: string
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 11px',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
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

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  marginBottom: '12px',
  paddingBottom: '8px',
  borderBottom: '1px solid var(--color-border)',
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

export function DeliverableForm({ mode, deliverable, projects, users, tasks, defaultProjectId }: DeliverableFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = mode === 'create'
        ? await createDeliverable(formData)
        : await updateDeliverable(deliverable!.id, formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form action={handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

        {/* Section: Deliverable Info */}
        <div>
          <p style={sectionTitleStyle}>Deliverable Information</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Field label="Name" required>
              <input
                name="name"
                type="text"
                required
                defaultValue={deliverable?.name ?? ''}
                placeholder="e.g. GA Drawing — Warehouse Steel Frame"
                style={inputStyle}
              />
            </Field>
            <Field label="Description">
              <textarea
                name="description"
                rows={3}
                defaultValue={deliverable?.description ?? ''}
                placeholder="What this deliverable covers…"
                style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }}
              />
            </Field>
          </div>
        </div>

        {/* Section: Project & Classification */}
        <div>
          <p style={sectionTitleStyle}>Project & Classification</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={fieldGroupStyle}>
              <Field label="Project" required>
                <select
                  name="project_id"
                  defaultValue={deliverable?.project_id ?? defaultProjectId ?? ''}
                  style={inputStyle}
                  required
                >
                  <option value="">Select a project…</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.project_code})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Type" required>
                <select name="type" defaultValue={deliverable?.type ?? ''} style={inputStyle} required>
                  <option value="">Select type…</option>
                  {DELIVERABLE_TYPE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </Field>
            </div>
            {tasks && tasks.length > 0 && (
              <div style={{ maxWidth: '50%' }}>
                <Field label="Linked Task (optional)">
                  <select
                    name="linked_task_id"
                    defaultValue={deliverable?.linked_task_id ?? ''}
                    style={inputStyle}
                  >
                    <option value="">No linked task</option>
                    {tasks.map((t) => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </Field>
              </div>
            )}
          </div>
        </div>

        {/* Section: Revision */}
        <div>
          <p style={sectionTitleStyle}>Revision</p>
          <div style={fieldGroupStyle}>
            <Field label="Revision Number" required>
              <input
                name="revision_number"
                type="number"
                min={0}
                defaultValue={deliverable?.revision_number ?? 0}
                style={inputStyle}
              />
            </Field>
            <Field label="Version Label">
              <input
                name="version_label"
                type="text"
                defaultValue={deliverable?.version_label ?? ''}
                placeholder="e.g. Rev A, P01, IFC"
                style={inputStyle}
              />
            </Field>
          </div>
        </div>

        {/* Section: Assignment */}
        <div>
          <p style={sectionTitleStyle}>Assignment</p>
          <div style={fieldGroupStyle}>
            <Field label="Prepared By" required>
              <select
                name="prepared_by_user_id"
                defaultValue={deliverable?.prepared_by_user_id ?? ''}
                style={inputStyle}
                required
              >
                <option value="">Select…</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.email})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Reviewed By (optional)">
              <select
                name="reviewed_by_user_id"
                defaultValue={deliverable?.reviewed_by_user_id ?? ''}
                style={inputStyle}
              >
                <option value="">No reviewer</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.email})
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        {/* Section: Status & Dates */}
        <div>
          <p style={sectionTitleStyle}>Status & Dates</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ maxWidth: '50%' }}>
              <Field label="Status" required>
                <select name="status" defaultValue={deliverable?.status ?? 'draft'} style={inputStyle} required>
                  {DELIVERABLE_STATUS_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </Field>
            </div>
            {mode === 'edit' && (
              <div style={fieldGroupStyle}>
                <Field label="Submitted to Client Date">
                  <input
                    name="submitted_to_client_date"
                    type="date"
                    defaultValue={deliverable?.submitted_to_client_date ?? ''}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Approved Date">
                  <input
                    name="approved_date"
                    type="date"
                    defaultValue={deliverable?.approved_date ?? ''}
                    style={inputStyle}
                  />
                </Field>
              </div>
            )}
          </div>
        </div>

        {/* Section: Client Feedback & File */}
        <div>
          <p style={sectionTitleStyle}>Client Feedback & File</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Field label="Client Feedback Summary">
              <textarea
                name="client_feedback_summary"
                rows={3}
                defaultValue={deliverable?.client_feedback_summary ?? ''}
                placeholder="Summary of client feedback, revision requests…"
                style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }}
              />
            </Field>
            <Field label="File Link">
              <input
                name="file_link"
                type="url"
                defaultValue={deliverable?.file_link ?? ''}
                placeholder="https://drive.google.com/…"
                style={inputStyle}
              />
            </Field>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div role="alert" style={{
            padding: '10px 12px',
            backgroundColor: 'var(--color-danger-subtle)',
            border: '1px solid #FECACA',
            borderRadius: '6px',
            color: 'var(--color-danger)',
            fontSize: '0.8125rem',
          }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
          <button type="submit" disabled={isPending} style={{
            padding: '9px 20px',
            backgroundColor: isPending ? 'var(--color-primary-hover)' : 'var(--color-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.8125rem',
            fontWeight: 500,
            cursor: isPending ? 'not-allowed' : 'pointer',
          }}>
            {isPending ? 'Saving…' : mode === 'create' ? 'Create Deliverable' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => router.back()} disabled={isPending} style={{
            padding: '9px 16px',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            fontSize: '0.8125rem',
            cursor: 'pointer',
          }}>
            Cancel
          </button>
        </div>
      </div>
    </form>
  )
}
