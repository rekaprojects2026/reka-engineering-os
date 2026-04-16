'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createProject, updateProject } from '@/lib/projects/actions'
import { FormSection } from '@/components/shared/FormSection'
import {
  SOURCE_PLATFORMS,
  DISCIPLINES,
  PROJECT_TYPES,
  PROJECT_STATUS_OPTIONS,
  WAITING_ON_OPTIONS,
  PRIORITY_OPTIONS,
} from '@/lib/constants/options'
import type { Project } from '@/types/database'

type OptionPair = { value: string; label: string }

interface ProjectFormProps {
  mode: 'create' | 'edit'
  project?: Project
  clients: { id: string; client_name: string; client_code: string }[]
  users: { id: string; full_name: string; email: string; discipline: string | null }[]
  disciplineOptions?: OptionPair[]
  projectTypeOptions?: OptionPair[]
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 11px',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-control)',
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

export function ProjectForm({ mode, project, clients, users, disciplineOptions, projectTypeOptions }: ProjectFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const todayString = new Date().toISOString().split('T')[0]

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = mode === 'create'
        ? await createProject(formData)
        : await updateProject(project!.id, formData)

      if (result?.error) setError(result.error)
    })
  }

  return (
    <form action={handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>

        <FormSection title="Project Information" first>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Field label="Project Name" required>
              <input
                name="name"
                type="text"
                required
                defaultValue={project?.name ?? ''}
                placeholder="e.g. Steel Frame Design — Warehouse Phase 2"
                style={inputStyle}
              />
            </Field>
            <Field label="Scope Summary">
              <textarea
                name="scope_summary"
                rows={3}
                defaultValue={project?.scope_summary ?? ''}
                placeholder="High-level scope description for this project…"
                style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }}
              />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Client & Intake">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={fieldGroupStyle}>
              <Field label="Client" required>
                <select
                  name="client_id"
                  defaultValue={project?.client_id ?? ''}
                  style={inputStyle}
                  required
                >
                  <option value="">Select a client…</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.client_name} ({c.client_code})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Linked Intake (optional)">
                <input
                  name="intake_id"
                  type="text"
                  defaultValue={project?.intake_id ?? ''}
                  placeholder="Intake ID (if converted from intake)"
                  style={inputStyle}
                />
              </Field>
            </div>
          </div>
        </FormSection>

        <FormSection title="Source & Classification">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={fieldGroupStyle}>
              <Field label="Source" required>
                <select name="source" defaultValue={project?.source ?? 'direct'} style={inputStyle} required>
                  {SOURCE_PLATFORMS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="External Reference URL">
                <input
                  name="external_reference_url"
                  type="url"
                  defaultValue={project?.external_reference_url ?? ''}
                  placeholder="https://www.upwork.com/jobs/…"
                  style={inputStyle}
                />
              </Field>
            </div>
            <div style={fieldGroupStyle}>
              <Field label="Discipline" required>
                <select name="discipline" defaultValue={project?.discipline ?? 'mechanical'} style={inputStyle} required>
                  {(disciplineOptions ?? DISCIPLINES).map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Project Type" required>
                <select name="project_type" defaultValue={project?.project_type ?? 'design'} style={inputStyle} required>
                  {(projectTypeOptions ?? PROJECT_TYPES).map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        </FormSection>

        <FormSection title="Timeline">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={fieldGroupStyle}>
              <Field label="Start Date" required>
                <input
                  name="start_date"
                  type="date"
                  required
                  defaultValue={project?.start_date ?? todayString}
                  style={inputStyle}
                />
              </Field>
              <Field label="Target Due Date" required>
                <input
                  name="target_due_date"
                  type="date"
                  required
                  defaultValue={project?.target_due_date ?? ''}
                  style={inputStyle}
                />
              </Field>
            </div>
            {mode === 'edit' && (
              <div style={{ maxWidth: '50%' }}>
                <Field label="Actual Completion Date">
                  <input
                    name="actual_completion_date"
                    type="date"
                    defaultValue={project?.actual_completion_date ?? ''}
                    style={inputStyle}
                  />
                </Field>
              </div>
            )}
          </div>
        </FormSection>

        <FormSection title="Assignment">
          <div style={fieldGroupStyle}>
            <Field label="Project Lead" required>
              <select
                name="project_lead_user_id"
                defaultValue={project?.project_lead_user_id ?? ''}
                style={inputStyle}
                required
              >
                <option value="">Select lead…</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.email})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Reviewer (optional)">
              <select
                name="reviewer_user_id"
                defaultValue={project?.reviewer_user_id ?? ''}
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

        <FormSection title="Status & Priority">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={fieldGroupStyle}>
              <Field label="Status" required>
                <select name="status" defaultValue={project?.status ?? 'new'} style={inputStyle} required>
                  {PROJECT_STATUS_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Priority" required>
                <select name="priority" defaultValue={project?.priority ?? 'medium'} style={inputStyle} required>
                  {PRIORITY_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div style={fieldGroupStyle}>
              <Field label="Waiting On">
                <select name="waiting_on" defaultValue={project?.waiting_on ?? 'none'} style={inputStyle}>
                  {WAITING_ON_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Progress (%)">
                <input
                  name="progress_percent"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={project?.progress_percent ?? 0}
                  style={inputStyle}
                />
              </Field>
            </div>
          </div>
        </FormSection>

        <FormSection title="Links & Notes">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Field label="Google Drive Folder Link">
              <input
                name="google_drive_folder_link"
                type="url"
                defaultValue={project?.google_drive_folder_link ?? ''}
                placeholder="https://drive.google.com/drive/folders/…"
                style={inputStyle}
              />
            </Field>
            <Field label="Internal Notes">
              <textarea
                name="notes_internal"
                rows={3}
                defaultValue={project?.notes_internal ?? ''}
                placeholder="Internal-only notes, context, risks…"
                style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }}
              />
            </Field>
          </div>
        </FormSection>

        {/* Error */}
        {error && (
          <div
            role="alert"
            style={{
              padding: '10px 12px',
              backgroundColor: 'var(--color-danger-subtle)',
              border: '1px solid var(--color-border-strong)',
              borderRadius: 'var(--radius-control)',
              color: 'var(--color-danger)',
              fontSize: '0.8125rem',
            }}
          >
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
          <button
            type="submit"
            disabled={isPending}
            style={{
              padding: '9px 20px',
              backgroundColor: isPending ? 'var(--color-primary-hover)' : 'var(--color-primary)',
              color: 'var(--color-primary-fg)',
              border: 'none',
              borderRadius: 'var(--radius-control)',
              fontSize: '0.8125rem',
              fontWeight: 500,
              cursor: isPending ? 'not-allowed' : 'pointer',
            }}
          >
            {isPending ? 'Saving…' : mode === 'create' ? 'Create Project' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            disabled={isPending}
            style={{
              padding: '9px 16px',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-control)',
              fontSize: '0.8125rem',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  )
}
