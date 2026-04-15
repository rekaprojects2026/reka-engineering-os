'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createFile, updateFile } from '@/lib/files/actions'
import {
  FILE_CATEGORY_OPTIONS,
  FILE_PROVIDER_OPTIONS,
} from '@/lib/constants/options'
import type { ProjectFile } from '@/types/database'

interface FileFormProps {
  mode: 'create' | 'edit'
  file?: ProjectFile
  projects: { id: string; name: string; project_code: string }[]
  tasks?: { id: string; title: string }[]
  deliverables?: { id: string; name: string }[]
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

export function FileForm({ mode, file, projects, tasks, deliverables, defaultProjectId }: FileFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [provider, setProvider] = useState(file?.provider ?? 'manual')

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = mode === 'create'
        ? await createFile(formData)
        : await updateFile(file!.id, formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form action={handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

        {/* Section: File Info */}
        <div>
          <p style={sectionTitleStyle}>File Information</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Field label="File Name" required>
              <input
                name="file_name"
                type="text"
                required
                defaultValue={file?.file_name ?? ''}
                placeholder="e.g. GA_Drawing_Rev0.dwg"
                style={inputStyle}
              />
            </Field>
            <div style={fieldGroupStyle}>
              <Field label="Category" required>
                <select name="file_category" defaultValue={file?.file_category ?? 'working_file'} style={inputStyle}>
                  {FILE_CATEGORY_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Provider" required>
                <select
                  name="provider"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  style={inputStyle}
                >
                  {FILE_PROVIDER_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        </div>

        {/* Section: Project & Linkage */}
        <div>
          <p style={sectionTitleStyle}>Project & Linkage</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ maxWidth: '50%' }}>
              <Field label="Project" required>
                <select name="project_id" defaultValue={file?.project_id ?? defaultProjectId ?? ''} style={inputStyle} required>
                  <option value="">Select a project…</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.project_code})</option>
                  ))}
                </select>
              </Field>
            </div>
            <div style={fieldGroupStyle}>
              {tasks && tasks.length > 0 && (
                <Field label="Linked Task (optional)">
                  <select name="task_id" defaultValue={file?.task_id ?? ''} style={inputStyle}>
                    <option value="">No linked task</option>
                    {tasks.map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </Field>
              )}
              {deliverables && deliverables.length > 0 && (
                <Field label="Linked Deliverable (optional)">
                  <select name="deliverable_id" defaultValue={file?.deliverable_id ?? ''} style={inputStyle}>
                    <option value="">No linked deliverable</option>
                    {deliverables.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </Field>
              )}
            </div>
          </div>
        </div>

        {/* Section: Link / Drive */}
        <div>
          <p style={sectionTitleStyle}>
            {provider === 'google_drive' ? 'Google Drive Details' : 'External Link'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {provider === 'manual' && (
              <Field label="Link URL">
                <input
                  name="manual_link"
                  type="url"
                  defaultValue={file?.manual_link ?? ''}
                  placeholder="https://drive.google.com/… or any URL"
                  style={inputStyle}
                />
              </Field>
            )}
            {provider === 'google_drive' && (
              <>
                <div style={{
                  padding: '10px 12px',
                  backgroundColor: '#DBEAFE',
                  border: '1px solid #93C5FD',
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  color: '#1E40AF',
                }}>
                  Google Drive integration is not yet active. Enter metadata manually for now.
                </div>
                <div style={fieldGroupStyle}>
                  <Field label="Drive File ID">
                    <input name="external_file_id" type="text" defaultValue={file?.external_file_id ?? ''} placeholder="Google Drive file ID" style={inputStyle} />
                  </Field>
                  <Field label="Web View Link">
                    <input name="google_web_view_link" type="url" defaultValue={file?.google_web_view_link ?? ''} placeholder="https://drive.google.com/file/d/…" style={inputStyle} />
                  </Field>
                </div>
              </>
            )}
            <div style={fieldGroupStyle}>
              <Field label="MIME Type">
                <input name="mime_type" type="text" defaultValue={file?.mime_type ?? ''} placeholder="e.g. application/pdf" style={inputStyle} />
              </Field>
              <Field label="Extension">
                <input name="extension" type="text" defaultValue={file?.extension ?? ''} placeholder="e.g. pdf, dwg, xlsx" style={inputStyle} />
              </Field>
            </div>
          </div>
        </div>

        {/* Section: Revision */}
        <div>
          <p style={sectionTitleStyle}>Revision</p>
          <div style={fieldGroupStyle}>
            <Field label="Revision Number">
              <input name="revision_number" type="number" min={0} defaultValue={file?.revision_number ?? ''} style={inputStyle} />
            </Field>
            <Field label="Version Label">
              <input name="version_label" type="text" defaultValue={file?.version_label ?? ''} placeholder="e.g. Rev A, P01" style={inputStyle} />
            </Field>
          </div>
        </div>

        {/* Section: Notes */}
        <div>
          <p style={sectionTitleStyle}>Notes</p>
          <Field label="Notes">
            <textarea name="notes" rows={3} defaultValue={file?.notes ?? ''} placeholder="Additional notes…" style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }} />
          </Field>
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
            {isPending ? 'Saving…' : mode === 'create' ? 'Add File' : 'Save Changes'}
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
