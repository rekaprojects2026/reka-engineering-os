'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createDeliverable, updateDeliverable } from '@/lib/deliverables/actions'
import { DELIVERABLE_STATUS_OPTIONS } from '@/lib/constants/options'
import type { DeliverableEditFormScope } from '@/lib/auth/edit-form-scopes'
import type { DeliverableWithRelations } from '@/lib/deliverables/queries'
import { FormSection } from '@/components/shared/FormSection'

type OptionPair = { value: string; label: string }

interface DeliverableFormProps {
  mode: 'create' | 'edit'
  deliverable?: DeliverableWithRelations
  projects: { id: string; name: string; project_code: string }[]
  users: { id: string; full_name: string; email: string; discipline: string | null }[]
  tasks?: { id: string; title: string }[]
  defaultProjectId?: string
  deliverableTypeOptions: OptionPair[]
  deliverableEditScope?: DeliverableEditFormScope
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 11px',
  border: '1px solid var(--input-border)',
  borderRadius: 'var(--radius-control)',
  fontSize: '0.8125rem',
  color: 'var(--text-primary-neutral)',
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8125rem',
  fontWeight: 500,
  color: 'var(--text-secondary-neutral)',
  marginBottom: '5px',
}

const fieldGroupStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '16px',
}

const noticeStyle: React.CSSProperties = {
  padding: '10px 12px',
  backgroundColor: 'var(--color-info-subtle)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-control)',
  fontSize: '0.8125rem',
  color: 'var(--text-secondary-neutral)',
  lineHeight: 1.5,
}

const readOnlyBoxStyle: React.CSSProperties = {
  ...inputStyle,
  opacity: 0.85,
  cursor: 'default',
  minHeight: '38px',
  display: 'flex',
  alignItems: 'center',
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>
        {label}{required && <span style={{ color: 'var(--brand-accent)', marginLeft: '2px' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

function FormChrome({
  error,
  isPending,
  mode,
  onCancel,
}: {
  error: string | null
  isPending: boolean
  mode: 'create' | 'edit'
  onCancel: () => void
}) {
  return (
    <>
      {error && (
        <div role="alert" style={{
          padding: '10px 12px',
          backgroundColor: 'var(--color-danger-subtle)',
          border: '1px solid var(--border-strong-neutral)',
          borderRadius: 'var(--radius-control)',
          color: 'var(--color-danger)',
          fontSize: '0.8125rem',
        }}>
          {error}
        </div>
      )}
      <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
        <button type="submit" disabled={isPending} style={{
          padding: '9px 20px',
          backgroundColor: isPending ? 'var(--color-primary-hover)' : 'var(--color-primary)',
          color: 'var(--color-primary-fg)',
          border: 'none',
          borderRadius: 'var(--radius-control)',
          fontSize: '0.8125rem',
          fontWeight: 500,
          cursor: isPending ? 'not-allowed' : 'pointer',
        }}>
          {isPending ? 'Saving…' : mode === 'create' ? 'Create Deliverable' : 'Save Changes'}
        </button>
        <button type="button" onClick={onCancel} disabled={isPending} style={{
          padding: '9px 16px',
          backgroundColor: 'var(--surface-card)',
          color: 'var(--text-secondary-neutral)',
          border: '1px solid var(--input-border)',
          borderRadius: 'var(--radius-control)',
          fontSize: '0.8125rem',
          cursor: 'pointer',
        }}>
          Cancel
        </button>
      </div>
    </>
  )
}

export function DeliverableForm({
  mode,
  deliverable,
  projects,
  users,
  tasks,
  defaultProjectId,
  deliverableTypeOptions,
  deliverableEditScope,
}: DeliverableFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const scope: DeliverableEditFormScope = mode === 'create' ? 'full' : (deliverableEditScope ?? 'full')

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = mode === 'create'
        ? await createDeliverable(formData)
        : await updateDeliverable(deliverable!.id, formData)
      if (result?.error) setError(result.error)
    })
  }

  const typeOpts = deliverableTypeOptions

  if (mode === 'edit' && scope === 'reviewer' && deliverable) {
    const typeLabel = typeOpts.find(t => t.value === deliverable.type)?.label ?? deliverable.type
    return (
      <form action={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <p style={{ ...noticeStyle, marginBottom: '20px' }}>
            Review updates: status, client-facing dates, and client feedback summary are saved. Other fields are managed by coordinators and admins.
          </p>
          <FormSection title="Deliverable (read-only)" first>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Field label="Name">
                <div style={readOnlyBoxStyle}>{deliverable.name}</div>
              </Field>
              {deliverable.projects && (
                <Field label="Project">
                  <div style={readOnlyBoxStyle}>
                    {deliverable.projects.name} ({deliverable.projects.project_code})
                  </div>
                </Field>
              )}
              <div style={fieldGroupStyle}>
                <Field label="Type">
                  <div style={readOnlyBoxStyle}>{typeLabel}</div>
                </Field>
                <Field label="Prepared by">
                  <div style={readOnlyBoxStyle}>{deliverable.preparer?.full_name ?? '—'}</div>
                </Field>
              </div>
              {deliverable.file_link && (
                <Field label="File link">
                  <div style={readOnlyBoxStyle}>
                    <a href={deliverable.file_link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>
                      {deliverable.file_link}
                    </a>
                  </div>
                </Field>
              )}
            </div>
          </FormSection>
          <FormSection title="Review">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ maxWidth: '50%' }}>
                <Field label="Status" required>
                  <select name="status" defaultValue={deliverable.status ?? 'draft'} style={inputStyle} required>
                    {DELIVERABLE_STATUS_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <div style={fieldGroupStyle}>
                <Field label="Submitted to client date">
                  <input
                    name="submitted_to_client_date"
                    type="date"
                    defaultValue={deliverable.submitted_to_client_date ?? ''}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Approved date">
                  <input
                    name="approved_date"
                    type="date"
                    defaultValue={deliverable.approved_date ?? ''}
                    style={inputStyle}
                  />
                </Field>
              </div>
              <Field label="Client feedback summary">
                <textarea
                  name="client_feedback_summary"
                  rows={3}
                  defaultValue={deliverable.client_feedback_summary ?? ''}
                  placeholder="Summary of client feedback, revision requests…"
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }}
                />
              </Field>
            </div>
          </FormSection>
          <FormChrome error={error} isPending={isPending} mode={mode} onCancel={() => router.back()} />
        </div>
      </form>
    )
  }

  if (mode === 'edit' && scope === 'preparer' && deliverable) {
    return (
      <form action={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <p style={{ ...noticeStyle, marginBottom: '20px' }}>
            You can update this deliverable&apos;s definition and submission fields. Assignment and client feedback summary are locked (reviewers update feedback).
          </p>
          <FormSection title="Context (read-only)" first>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {deliverable.projects && (
                <Field label="Project">
                  <div style={readOnlyBoxStyle}>
                    {deliverable.projects.name} ({deliverable.projects.project_code})
                  </div>
                </Field>
              )}
              <div style={fieldGroupStyle}>
                <Field label="Prepared by">
                  <div style={readOnlyBoxStyle}>{deliverable.preparer?.full_name ?? '—'}</div>
                </Field>
                <Field label="Reviewed by">
                  <div style={readOnlyBoxStyle}>{deliverable.reviewer_profile?.full_name ?? '—'}</div>
                </Field>
              </div>
              <Field label="Client feedback summary">
                <div style={{ ...readOnlyBoxStyle, whiteSpace: 'pre-wrap', minHeight: '72px', alignItems: 'flex-start', paddingTop: '8px' }}>
                  {deliverable.client_feedback_summary?.trim() ? deliverable.client_feedback_summary : '—'}
                </div>
              </Field>
            </div>
          </FormSection>
          <FormSection title="Deliverable information">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Field label="Name" required>
                <input
                  name="name"
                  type="text"
                  required
                  defaultValue={deliverable.name}
                  style={inputStyle}
                />
              </Field>
              <Field label="Description">
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={deliverable.description ?? ''}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }}
                />
              </Field>
            </div>
          </FormSection>
          <FormSection title="Classification">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={fieldGroupStyle}>
                <Field label="Type" required>
                  <select name="type" defaultValue={deliverable.type} style={inputStyle} required>
                    <option value="">Select type…</option>
                    {typeOpts.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </Field>
                {tasks && tasks.length > 0 && (
                  <Field label="Linked task (optional)">
                    <select name="linked_task_id" defaultValue={deliverable.linked_task_id ?? ''} style={inputStyle}>
                      <option value="">No linked task</option>
                      {tasks.map((t) => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                  </Field>
                )}
              </div>
            </div>
          </FormSection>
          <FormSection title="Revision">
            <div style={fieldGroupStyle}>
              <Field label="Revision number" required>
                <input
                  name="revision_number"
                  type="number"
                  min={0}
                  defaultValue={deliverable.revision_number ?? 0}
                  style={inputStyle}
                  required
                />
              </Field>
              <Field label="Version label">
                <input
                  name="version_label"
                  type="text"
                  defaultValue={deliverable.version_label ?? ''}
                  style={inputStyle}
                />
              </Field>
            </div>
          </FormSection>
          <FormSection title="Status & dates">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ maxWidth: '50%' }}>
                <Field label="Status" required>
                  <select name="status" defaultValue={deliverable.status ?? 'draft'} style={inputStyle} required>
                    {DELIVERABLE_STATUS_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <div style={fieldGroupStyle}>
                <Field label="Submitted to client date">
                  <input
                    name="submitted_to_client_date"
                    type="date"
                    defaultValue={deliverable.submitted_to_client_date ?? ''}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Approved date">
                  <input
                    name="approved_date"
                    type="date"
                    defaultValue={deliverable.approved_date ?? ''}
                    style={inputStyle}
                  />
                </Field>
              </div>
            </div>
          </FormSection>
          <FormSection title="File">
            <Field label="File link">
              <input name="file_link" type="url" defaultValue={deliverable.file_link ?? ''} style={inputStyle} />
            </Field>
          </FormSection>
          <FormChrome error={error} isPending={isPending} mode={mode} onCancel={() => router.back()} />
        </div>
      </form>
    )
  }

  return (
    <form action={handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>

        <FormSection title="Deliverable Information" first>
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
        </FormSection>

        <FormSection title="Project & Classification">
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
                  {typeOpts.map(o => (
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
        </FormSection>

        <FormSection title="Revision">
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
        </FormSection>

        <FormSection title="Assignment">
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
        </FormSection>

        <FormSection title="Status & Dates">
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
        </FormSection>

        <FormSection title="Client Feedback & File">
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
        </FormSection>

        <FormChrome error={error} isPending={isPending} mode={mode} onCancel={() => router.back()} />
      </div>
    </form>
  )
}
