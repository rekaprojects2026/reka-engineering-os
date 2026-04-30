'use client'

import { useTransition, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createFile, updateFile } from '@/lib/files/actions'
import { FileUploadInput, type R2UploadState } from '@/components/modules/files/FileUploadInput'
import { DeleteFileButton } from '@/components/modules/files/DeleteFileButton'
import { FILE_PROVIDER_OPTIONS } from '@/lib/constants/options'
import type { FileEditFormScope } from '@/lib/auth/edit-form-scopes'
import type { ProjectFile } from '@/types/database'
import type { FileNamingConfig } from '@/lib/files/naming'
import { parseCodeMap } from '@/lib/files/naming'
import { FormSection } from '@/components/shared/FormSection'
import { FileNamingPreview } from '@/components/shared/FileNamingPreview'

type OptionPair = { value: string; label: string }

interface FileFormProps {
  mode: 'create' | 'edit'
  file?: ProjectFile
  projects: { id: string; name: string; project_code: string }[]
  tasks?: { id: string; title: string }[]
  deliverables?: { id: string; name: string }[]
  defaultProjectId?: string
  fileCategoryOptions: OptionPair[]
  fileEditScope?: FileEditFormScope
  /** When set (create flow), server generates file_code from naming rules. */
  fileNaming?: {
    config: FileNamingConfig
    suggestedSequence: number
    suggestedRevisionIndex: number
  }
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

const noticeStyle: React.CSSProperties = {
  padding: '10px 12px',
  backgroundColor: 'var(--color-info-subtle)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-control)',
  fontSize: '0.8125rem',
  color: 'var(--color-text-secondary)',
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
        {label}{required && <span style={{ color: 'var(--color-danger)', marginLeft: '2px' }}>*</span>}
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
          border: '1px solid var(--color-border-strong)',
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
          {isPending ? 'Saving…' : mode === 'create' ? 'Add File' : 'Save Changes'}
        </button>
        <button type="button" onClick={onCancel} disabled={isPending} style={{
          padding: '9px 16px',
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-text-secondary)',
          border: '1px solid var(--color-border)',
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

function linkageSummary(
  file: ProjectFile,
  projects: FileFormProps['projects'],
  tasks: FileFormProps['tasks'],
  deliverables: FileFormProps['deliverables'],
) {
  const p = projects.find(x => x.id === file.project_id)
  const t = tasks?.find(x => x.id === file.task_id)
  const d = deliverables?.find(x => x.id === file.deliverable_id)
  return {
    projectLine: p ? `${p.name} (${p.project_code})` : file.project_id,
    taskLine: t?.title ?? (file.task_id ? file.task_id : '—'),
    deliverableLine: d?.name ?? (file.deliverable_id ? file.deliverable_id : '—'),
  }
}

export function FileForm({
  mode,
  file,
  projects,
  tasks,
  deliverables,
  defaultProjectId,
  fileCategoryOptions,
  fileEditScope,
  fileNaming,
}: FileFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [provider, setProvider] = useState(file?.provider ?? 'manual')
  const [r2Meta, setR2Meta] = useState<R2UploadState | null>(() =>
    file?.provider === 'r2' && file.r2_key
      ? {
          r2Key: file.r2_key,
          fileSizeBytes: file.file_size_bytes ?? 0,
          mimeType: file.mime_type ?? 'application/octet-stream',
          extension: file.extension ?? '',
        }
      : null,
  )
  const mimeRef = useRef<HTMLInputElement>(null)
  const extRef = useRef<HTMLInputElement>(null)

  const scope: FileEditFormScope = mode === 'create' ? 'full' : (fileEditScope ?? 'full')

  function handleProviderChange(value: string) {
    setProvider(value)
    if (value !== 'r2') {
      setR2Meta(null)
      if (mimeRef.current) mimeRef.current.value = mode === 'edit' && file ? (file.mime_type ?? '') : ''
      if (extRef.current) extRef.current.value = mode === 'edit' && file ? (file.extension ?? '') : ''
      return
    }
    if (mode === 'edit' && file?.r2_key) {
      setR2Meta({
        r2Key: file.r2_key,
        fileSizeBytes: file.file_size_bytes ?? 0,
        mimeType: file.mime_type ?? 'application/octet-stream',
        extension: file.extension ?? '',
      })
      if (mimeRef.current) mimeRef.current.value = file.mime_type ?? ''
      if (extRef.current) extRef.current.value = file.extension ?? ''
    }
  }

  function applyR2UploadMeta(meta: R2UploadState) {
    setR2Meta(meta)
    if (mimeRef.current) mimeRef.current.value = meta.mimeType
    if (extRef.current) extRef.current.value = meta.extension
  }

  function handleSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault()
    setError(null)
    const fd = new FormData(ev.currentTarget)
    const p = (fd.get('provider') as string) || 'manual'
    if (p === 'r2' && !(fd.get('r2_key') as string)?.toString().trim()) {
      setError('Upload a file to Cloudflare R2 before saving.')
      return
    }
    startTransition(async () => {
      const result = mode === 'create'
        ? await createFile(fd)
        : await updateFile(file!.id, fd)
      if (result?.error) setError(result.error)
    })
  }

  if (mode === 'edit' && scope === 'uploader' && file) {
    const { projectLine, taskLine, deliverableLine } = linkageSummary(file, projects, tasks, deliverables)
    return (
      <form id="file-uploader-form" onSubmit={handleSubmit}>
        <input type="hidden" name="r2_key" value={r2Meta?.r2Key ?? ''} />
        <input type="hidden" name="file_size_bytes" value={r2Meta != null ? String(r2Meta.fileSizeBytes) : ''} />
        <input type="hidden" name="project_id" value={file.project_id} />
        <input type="hidden" name="task_id" value={file.task_id ?? ''} />
        <input type="hidden" name="deliverable_id" value={file.deliverable_id ?? ''} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <p style={{ ...noticeStyle, marginBottom: '20px' }}>
            You can update file metadata and links. Project and task linkage are locked; ask a coordinator if those need to change.
          </p>
          <FormSection title="Project & linkage (read-only)" first>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Field label="Project">
                <div style={readOnlyBoxStyle}>{projectLine}</div>
              </Field>
              <div style={fieldGroupStyle}>
                <Field label="Linked task">
                  <div style={readOnlyBoxStyle}>{taskLine}</div>
                </Field>
                <Field label="Linked deliverable">
                  <div style={readOnlyBoxStyle}>{deliverableLine}</div>
                </Field>
              </div>
            </div>
          </FormSection>
          <FormSection title="File information">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Field label="File name" required>
                <input
                  name="file_name"
                  type="text"
                  required
                  defaultValue={file.file_name}
                  style={inputStyle}
                />
              </Field>
              <div style={fieldGroupStyle}>
                <Field label="Category" required>
                  <select name="file_category" defaultValue={file.file_category ?? 'working_file'} style={inputStyle}>
                    {fileCategoryOptions.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Provider" required>
                  <select
                    name="provider"
                    value={provider}
                    onChange={(e) => handleProviderChange(e.target.value)}
                    style={inputStyle}
                  >
                    {FILE_PROVIDER_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>
          </FormSection>
          <FormSection title={provider === 'google_drive' ? 'Google Drive details' : provider === 'r2' ? 'Cloudflare R2' : 'External link'}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {provider === 'manual' && (
                <Field label="Link URL">
                  <input
                    name="manual_link"
                    type="url"
                    defaultValue={file.manual_link ?? ''}
                    placeholder="https://…"
                    style={inputStyle}
                  />
                </Field>
              )}
              {provider === 'google_drive' && (
                <>
                  <div style={{
                    padding: '10px 12px',
                    backgroundColor: 'var(--color-info-subtle)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-control)',
                    fontSize: '0.8125rem',
                    color: 'var(--color-info)',
                  }}>
                    Google Drive integration is not yet active. Enter metadata manually for now.
                  </div>
                  <div style={fieldGroupStyle}>
                    <Field label="Drive file ID">
                      <input name="external_file_id" type="text" defaultValue={file.external_file_id ?? ''} placeholder="Google Drive file ID" style={inputStyle} />
                    </Field>
                    <Field label="Web view link">
                      <input name="google_web_view_link" type="url" defaultValue={file.google_web_view_link ?? ''} placeholder="https://drive.google.com/file/d/…" style={inputStyle} />
                    </Field>
                  </div>
                </>
              )}
              {provider === 'r2' && (
                <FileUploadInput
                  formId="file-uploader-form"
                  existingFileId={file.id}
                  disabled={isPending}
                  onUploaded={applyR2UploadMeta}
                  onClear={() => {
                    setR2Meta(null)
                    if (mimeRef.current) mimeRef.current.value = ''
                    if (extRef.current) extRef.current.value = ''
                  }}
                />
              )}
              <div style={fieldGroupStyle}>
                <Field label="MIME type">
                  <input ref={mimeRef} name="mime_type" type="text" defaultValue={file.mime_type ?? ''} placeholder="e.g. application/pdf" style={inputStyle} />
                </Field>
                <Field label="Extension">
                  <input ref={extRef} name="extension" type="text" defaultValue={file.extension ?? ''} placeholder="e.g. pdf, dwg" style={inputStyle} />
                </Field>
              </div>
            </div>
          </FormSection>
          <FormSection title="Revision">
            <div style={fieldGroupStyle}>
              <Field label="Revision number">
                <input name="revision_number" type="number" min={0} defaultValue={file.revision_number ?? ''} style={inputStyle} />
              </Field>
              <Field label="Version label">
                <input name="version_label" type="text" defaultValue={file.version_label ?? ''} style={inputStyle} />
              </Field>
            </div>
          </FormSection>
          <FormSection title="Notes">
            <Field label="Notes">
              <textarea name="notes" rows={3} defaultValue={file.notes ?? ''} placeholder="Additional notes…" style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }} />
            </Field>
          </FormSection>
          <FormChrome error={error} isPending={isPending} mode={mode} onCancel={() => router.back()} />
        </div>
      </form>
    )
  }

  const selectedProjectCode =
    projects.find((p) => p.id === (defaultProjectId ?? ''))?.project_code ?? 'RKA2401'
  const disciplineOpts = fileNaming ? parseCodeMap(fileNaming.config.discipline_codes) : []
  const docTypeOpts = fileNaming ? parseCodeMap(fileNaming.config.doc_type_codes) : []
  const defaultDisc = disciplineOpts[0]?.value ?? 'MCH'
  const defaultDoc = docTypeOpts[0]?.value ?? 'DR'

  return (
    <form id="file-form" onSubmit={handleSubmit} key={defaultProjectId ?? 'no-project'}>
      <input type="hidden" name="r2_key" value={r2Meta?.r2Key ?? ''} />
      <input type="hidden" name="file_size_bytes" value={r2Meta != null ? String(r2Meta.fileSizeBytes) : ''} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>

        <FormSection title="File Information" first>
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
                  {fileCategoryOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Provider" required>
                <select
                  name="provider"
                  value={provider}
                  onChange={(e) => handleProviderChange(e.target.value)}
                  style={inputStyle}
                >
                  {FILE_PROVIDER_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        </FormSection>

        <FormSection title="Project & Linkage">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ maxWidth: '50%' }}>
              <Field label="Project" required>
                <select
                  name="project_id"
                  defaultValue={file?.project_id ?? defaultProjectId ?? ''}
                  style={inputStyle}
                  required
                  onChange={(e) => {
                    const v = e.target.value
                    if (v) router.push(`/files/new?project_id=${encodeURIComponent(v)}`)
                    else router.push('/files/new')
                  }}
                >
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
        </FormSection>

        {mode === 'create' && fileNaming && (
          <FormSection title="File code (naming)">
            <p style={{ ...noticeStyle, marginBottom: '14px' }}>
              Pilih disiplin dan tipe dokumen sesuai konfigurasi Settings → File naming. Nomor urut dan revisi bisa disesuaikan; kosongkan nomor urut untuk mengisi otomatis di server.
            </p>
            <div style={fieldGroupStyle}>
              <Field label="Disiplin" required>
                <select name="discipline_code" required defaultValue={defaultDisc} style={inputStyle}>
                  {disciplineOpts.map((o) => (
                    <option key={o.value} value={o.value}>{o.label} ({o.value})</option>
                  ))}
                </select>
              </Field>
              <Field label="Tipe dokumen" required>
                <select name="doc_type_code" required defaultValue={defaultDoc} style={inputStyle}>
                  {docTypeOpts.map((o) => (
                    <option key={o.value} value={o.value}>{o.label} ({o.value})</option>
                  ))}
                </select>
              </Field>
            </div>
            <div style={{ ...fieldGroupStyle, marginTop: '14px' }}>
              <Field label="Nomor urut (opsional)">
                <input
                  name="sequence_number"
                  type="number"
                  min={1}
                  placeholder={`Default ~${fileNaming.suggestedSequence}`}
                  style={inputStyle}
                />
              </Field>
              <Field label="Revisi (index 0=…)">
                <input
                  name="revision_index"
                  type="number"
                  min={0}
                  defaultValue={fileNaming.suggestedRevisionIndex}
                  style={inputStyle}
                />
              </Field>
            </div>
            <div style={{ marginTop: '14px' }}>
              <FileNamingPreview
                config={fileNaming.config}
                projectCode={selectedProjectCode}
                discipline={defaultDisc}
                docType={defaultDoc}
                sequence={fileNaming.suggestedSequence}
                revision={fileNaming.suggestedRevisionIndex}
              />
            </div>
          </FormSection>
        )}

        <FormSection title={provider === 'google_drive' ? 'Google Drive Details' : provider === 'r2' ? 'Cloudflare R2' : 'External Link'}>
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
                  backgroundColor: 'var(--color-info-subtle)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-control)',
                  fontSize: '0.8125rem',
                  color: 'var(--color-info)',
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
            {provider === 'r2' && (
              <FileUploadInput
                formId="file-form"
                existingFileId={mode === 'edit' ? file?.id : undefined}
                disabled={isPending}
                onUploaded={applyR2UploadMeta}
                onClear={() => {
                  setR2Meta(null)
                  if (mimeRef.current) mimeRef.current.value = ''
                  if (extRef.current) extRef.current.value = ''
                }}
              />
            )}
            <div style={fieldGroupStyle}>
              <Field label="MIME Type">
                <input ref={mimeRef} name="mime_type" type="text" defaultValue={file?.mime_type ?? ''} placeholder="e.g. application/pdf" style={inputStyle} />
              </Field>
              <Field label="Extension">
                <input ref={extRef} name="extension" type="text" defaultValue={file?.extension ?? ''} placeholder="e.g. pdf, dwg, xlsx" style={inputStyle} />
              </Field>
            </div>
          </div>
        </FormSection>

        <FormSection title="Revision">
          <div style={fieldGroupStyle}>
            <Field label="Revision Number">
              <input name="revision_number" type="number" min={0} defaultValue={file?.revision_number ?? ''} style={inputStyle} />
            </Field>
            <Field label="Version Label">
              <input name="version_label" type="text" defaultValue={file?.version_label ?? ''} placeholder="e.g. Rev A, P01" style={inputStyle} />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Notes">
          <Field label="Notes">
            <textarea name="notes" rows={3} defaultValue={file?.notes ?? ''} placeholder="Additional notes…" style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }} />
          </Field>
        </FormSection>

        {mode === 'edit' && file && (
          <FormSection title="Delete record">
            <p style={{ ...noticeStyle, marginBottom: '12px' }}>
              Removes this file from the catalog. If the provider is R2, the object is deleted from the bucket when possible.
            </p>
            <DeleteFileButton fileId={file.id} fileName={file.file_name} />
          </FormSection>
        )}

        <FormChrome error={error} isPending={isPending} mode={mode} onCancel={() => router.back()} />
      </div>
    </form>
  )
}
