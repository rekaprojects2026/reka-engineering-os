'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createTask, updateTask } from '@/lib/tasks/actions'
import {
  TASK_STATUS_OPTIONS,
  PRIORITY_OPTIONS,
} from '@/lib/constants/options'
import { FormSection } from '@/components/shared/FormSection'
import type { TaskEditFormScope } from '@/lib/auth/edit-form-scopes'
import type { TaskWithRelations } from '@/lib/tasks/queries'

type OptionPair = { value: string; label: string }

function formatPickerTeamRole(teamRole: string | undefined): string {
  if (!teamRole) return ''
  if (teamRole === 'project_lead') return 'project lead'
  if (teamRole === 'reviewer') return 'reviewer'
  return teamRole
}

interface TaskFormProps {
  mode: 'create' | 'edit'
  task?: TaskWithRelations
  projects: { id: string; name: string; project_code: string }[]
  users: { id: string; full_name: string; email: string; discipline: string | null; team_role?: string }[]
  defaultProjectId?: string
  taskCategoryOptions: OptionPair[]
  /** When mode is edit, aligns visible fields with server partial-update rules. */
  taskEditScope?: TaskEditFormScope
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
          {isPending ? 'Saving…' : mode === 'create' ? 'Create Task' : 'Save Changes'}
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

export function TaskForm({
  mode,
  task,
  projects,
  users,
  defaultProjectId,
  taskCategoryOptions,
  taskEditScope,
}: TaskFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const scope: TaskEditFormScope = mode === 'create' ? 'full' : (taskEditScope ?? 'full')

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = mode === 'create'
        ? await createTask(formData)
        : await updateTask(task!.id, formData)
      if (result?.error) setError(result.error)
    })
  }

  if (mode === 'edit' && scope === 'reviewer' && task) {
    return (
      <form action={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <p style={{ ...noticeStyle, marginBottom: '20px' }}>
            Review updates: only status, notes, blocked reason, and optional completion date are saved.
            Other task fields are managed by coordinators and admins.
          </p>
          <FormSection title="Task" first>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Field label="Title">
                <div style={readOnlyBoxStyle}>{task.title}</div>
              </Field>
              {task.projects && (
                <Field label="Project">
                  <div style={readOnlyBoxStyle}>
                    {task.projects.name} ({task.projects.project_code})
                  </div>
                </Field>
              )}
            </div>
          </FormSection>
          <FormSection title="Review">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={fieldGroupStyle}>
                <Field label="Status" required>
                  <select name="status" defaultValue={task.status ?? 'to_do'} style={inputStyle} required>
                    {TASK_STATUS_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Completion date (optional)">
                  <input name="completed_date" type="date" defaultValue={task.completed_date ?? ''} style={inputStyle} />
                </Field>
              </div>
              <Field label="Blocked reason">
                <input name="blocked_reason" type="text" defaultValue={task.blocked_reason ?? ''} placeholder="Why is this task blocked?" style={inputStyle} />
              </Field>
              <Field label="Notes">
                <textarea name="notes" rows={3} defaultValue={task.notes ?? ''} placeholder="Review notes…" style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }} />
              </Field>
            </div>
          </FormSection>
          <FormChrome error={error} isPending={isPending} mode={mode} onCancel={() => router.back()} />
        </div>
      </form>
    )
  }

  if (mode === 'edit' && scope === 'assignee' && task) {
    const cats = taskCategoryOptions
    const catLabel = cats.find(c => c.value === (task.category ?? ''))?.label ?? task.category ?? '—'

    return (
      <form action={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <p style={{ ...noticeStyle, marginBottom: '20px' }}>
            You can update execution fields only (status, progress, links, hours, notes). Project and assignment are locked.
          </p>
          <FormSection title="Task (read-only)" first>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Field label="Title">
                <div style={readOnlyBoxStyle}>{task.title}</div>
              </Field>
              <Field label="Description">
                <div style={{ ...readOnlyBoxStyle, whiteSpace: 'pre-wrap', minHeight: '72px', alignItems: 'flex-start', paddingTop: '8px' }}>
                  {task.description?.trim() ? task.description : '—'}
                </div>
              </Field>
            </div>
          </FormSection>
          <FormSection title="Project & assignment (read-only)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {task.projects && (
                <Field label="Project">
                  <div style={readOnlyBoxStyle}>{task.projects.name} ({task.projects.project_code})</div>
                </Field>
              )}
              <div style={fieldGroupStyle}>
                <Field label="Category">
                  <div style={readOnlyBoxStyle}>{catLabel}</div>
                </Field>
                <Field label="Phase">
                  <div style={readOnlyBoxStyle}>{task.phase?.trim() ? task.phase : '—'}</div>
                </Field>
              </div>
              <div style={fieldGroupStyle}>
                <Field label="Assigned to">
                  <div style={readOnlyBoxStyle}>{task.assignee?.full_name ?? '—'}</div>
                </Field>
                <Field label="Reviewer">
                  <div style={readOnlyBoxStyle}>{task.reviewer?.full_name ?? '—'}</div>
                </Field>
              </div>
              <div style={fieldGroupStyle}>
                <Field label="Start date">
                  <div style={readOnlyBoxStyle}>{task.start_date ?? '—'}</div>
                </Field>
                <Field label="Due date">
                  <div style={readOnlyBoxStyle}>{task.due_date ?? '—'}</div>
                </Field>
              </div>
              <div style={fieldGroupStyle}>
                <Field label="Estimated hours">
                  <div style={readOnlyBoxStyle}>{task.estimated_hours != null ? String(task.estimated_hours) : '—'}</div>
                </Field>
                <Field label="Priority">
                  <div style={readOnlyBoxStyle}>
                    {(PRIORITY_OPTIONS.find(p => p.value === task.priority)?.label) ?? task.priority}
                  </div>
                </Field>
              </div>
            </div>
          </FormSection>
          <FormSection title="Your updates">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={fieldGroupStyle}>
                <Field label="Status" required>
                  <select name="status" defaultValue={task.status ?? 'to_do'} style={inputStyle} required>
                    {TASK_STATUS_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Completion date (optional)">
                  <input name="completed_date" type="date" defaultValue={task.completed_date ?? ''} style={inputStyle} />
                </Field>
              </div>
              <div style={fieldGroupStyle}>
                <Field label="Progress (%)">
                  <input name="progress_percent" type="number" min={0} max={100} defaultValue={task.progress_percent ?? 0} style={inputStyle} />
                </Field>
                <Field label="Actual hours">
                  <input name="actual_hours" type="number" step="0.5" min="0" defaultValue={task.actual_hours ?? ''} style={inputStyle} />
                </Field>
              </div>
              <Field label="Blocked reason">
                <input name="blocked_reason" type="text" defaultValue={task.blocked_reason ?? ''} placeholder="Why is this task blocked?" style={inputStyle} />
              </Field>
              <Field label="Drive link">
                <input name="drive_link" type="url" defaultValue={task.drive_link ?? ''} placeholder="https://…" style={inputStyle} />
              </Field>
              <Field label="Notes">
                <textarea name="notes" rows={3} defaultValue={task.notes ?? ''} placeholder="Additional notes…" style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }} />
              </Field>
            </div>
          </FormSection>
          <FormChrome error={error} isPending={isPending} mode={mode} onCancel={() => router.back()} />
        </div>
      </form>
    )
  }

  return (
    <form action={handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>

        <FormSection title="Task Information" first>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Field label="Title" required>
              <input
                name="title"
                type="text"
                required
                defaultValue={task?.title ?? ''}
                placeholder="e.g. Prepare structural calculation report"
                style={inputStyle}
              />
            </Field>
            <Field label="Description">
              <textarea
                name="description"
                rows={3}
                defaultValue={task?.description ?? ''}
                placeholder="Detailed description of the task…"
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
                  defaultValue={task?.project_id ?? defaultProjectId ?? ''}
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
              <Field label="Category">
                <select
                  name="category"
                  defaultValue={task?.category ?? ''}
                  style={inputStyle}
                >
                  <option value="">No category</option>
                  {taskCategoryOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div style={{ maxWidth: '50%' }}>
              <Field label="Phase">
                <input
                  name="phase"
                  type="text"
                  defaultValue={task?.phase ?? ''}
                  placeholder="e.g. Schematic Design, Detail Design"
                  style={inputStyle}
                />
              </Field>
            </div>
          </div>
        </FormSection>

        <FormSection title="Assignment">
          <div style={fieldGroupStyle}>
            <Field label="Assigned To" required>
              <select
                name="assigned_to_user_id"
                defaultValue={task?.assigned_to_user_id ?? ''}
                style={inputStyle}
                required
              >
                <option value="">Select assignee…</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name}
                    {u.team_role ? ` — ${formatPickerTeamRole(u.team_role)}` : ''} ({u.email})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Reviewer (optional)">
              <select
                name="reviewer_user_id"
                defaultValue={task?.reviewer_user_id ?? ''}
                style={inputStyle}
              >
                <option value="">No reviewer</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name}
                    {u.team_role ? ` — ${formatPickerTeamRole(u.team_role)}` : ''} ({u.email})
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </FormSection>

        <FormSection title="Timeline">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={fieldGroupStyle}>
              <Field label="Start Date">
                <input name="start_date" type="date" defaultValue={task?.start_date ?? ''} style={inputStyle} />
              </Field>
              <Field label="Due Date">
                <input name="due_date" type="date" defaultValue={task?.due_date ?? ''} style={inputStyle} />
              </Field>
            </div>
            <div style={fieldGroupStyle}>
              <Field label="Estimated Hours">
                <input name="estimated_hours" type="number" step="0.5" min="0" defaultValue={task?.estimated_hours ?? ''} style={inputStyle} />
              </Field>
              {mode === 'edit' && (
                <Field label="Actual Hours">
                  <input name="actual_hours" type="number" step="0.5" min="0" defaultValue={task?.actual_hours ?? ''} style={inputStyle} />
                </Field>
              )}
            </div>
          </div>
        </FormSection>

        <FormSection title="Status & Priority">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={fieldGroupStyle}>
              <Field label="Status" required>
                <select name="status" defaultValue={task?.status ?? 'to_do'} style={inputStyle} required>
                  {TASK_STATUS_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Priority" required>
                <select name="priority" defaultValue={task?.priority ?? 'medium'} style={inputStyle} required>
                  {PRIORITY_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div style={fieldGroupStyle}>
              <Field label="Progress (%)">
                <input name="progress_percent" type="number" min={0} max={100} defaultValue={task?.progress_percent ?? 0} style={inputStyle} />
              </Field>
              <Field label="Blocked Reason">
                <input name="blocked_reason" type="text" defaultValue={task?.blocked_reason ?? ''} placeholder="Why is this task blocked?" style={inputStyle} />
              </Field>
            </div>
          </div>
        </FormSection>

        <FormSection title="Links & Notes">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Field label="Drive Link">
              <input name="drive_link" type="url" defaultValue={task?.drive_link ?? ''} placeholder="https://drive.google.com/…" style={inputStyle} />
            </Field>
            <Field label="Notes">
              <textarea name="notes" rows={3} defaultValue={task?.notes ?? ''} placeholder="Additional notes…" style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }} />
            </Field>
          </div>
        </FormSection>

        <FormChrome error={error} isPending={isPending} mode={mode} onCancel={() => router.back()} />
      </div>
    </form>
  )
}
