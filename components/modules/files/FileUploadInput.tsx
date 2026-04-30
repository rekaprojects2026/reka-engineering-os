'use client'

import { useRef, useState, useTransition } from 'react'
import { formatBytes } from '@/lib/utils/formatters'

export interface R2UploadState {
  r2Key: string
  fileSizeBytes: number
  mimeType: string
  extension: string
}

function readFormField(form: HTMLFormElement, name: string): string {
  const v = new FormData(form).get(name)
  return typeof v === 'string' ? v.trim() : ''
}

function extensionFromFile(file: File): string {
  const n = file.name.split(/[/\\]/).pop() ?? file.name
  const i = n.lastIndexOf('.')
  if (i <= 0 || i === n.length - 1) return ''
  return n.slice(i + 1).toLowerCase()
}

const fieldHintStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--color-text-muted)',
  marginTop: '6px',
  lineHeight: 1.45,
}

interface FileUploadInputProps {
  formId: string
  /** When set, key is derived from the existing file record (edit / replace flow). */
  existingFileId?: string
  disabled?: boolean
  onUploaded: (state: R2UploadState) => void
  onClear: () => void
}

export function FileUploadInput({
  formId,
  existingFileId,
  disabled,
  onUploaded,
  onClear,
}: FileUploadInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const [lastLabel, setLastLabel] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function pickFile() {
    setLocalError(null)
    inputRef.current?.click()
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const form = document.getElementById(formId) as HTMLFormElement | null
    if (!form) {
      setLocalError('Form not found. Refresh the page and try again.')
      return
    }

    const projectId = readFormField(form, 'project_id')
    if (!projectId) {
      setLocalError('Select a project first.')
      return
    }

    startTransition(async () => {
      setLocalError(null)
      try {
        const body: Record<string, unknown> = {
          projectId,
          fileName: file.name,
          contentType: file.type || 'application/octet-stream',
          contentLength: file.size,
        }
        if (existingFileId) {
          body.existingFileId = existingFileId
        } else {
          const disciplineCode = readFormField(form, 'discipline_code')
          const docTypeCode = readFormField(form, 'doc_type_code')
          const seqRaw = readFormField(form, 'sequence_number')
          const revRaw = readFormField(form, 'revision_index')
          if (!disciplineCode || !docTypeCode) {
            setLocalError('Set discipline and document type (file code section) before uploading.')
            return
          }
          body.disciplineCode = disciplineCode
          body.docTypeCode = docTypeCode
          if (seqRaw) {
            const n = parseInt(seqRaw, 10)
            if (Number.isFinite(n)) body.sequenceNumber = n
          }
          if (revRaw) {
            const n = parseInt(revRaw, 10)
            if (Number.isFinite(n)) body.revisionIndex = n
          }
        }

        const presignRes = await fetch('/api/files/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const presignJson = (await presignRes.json().catch(() => ({}))) as {
          error?: string
          uploadUrl?: string
          key?: string
        }
        if (!presignRes.ok) {
          setLocalError(typeof presignJson.error === 'string' ? presignJson.error : 'Could not start upload.')
          return
        }
        const { uploadUrl, key } = presignJson
        if (!uploadUrl || !key) {
          setLocalError('Invalid presign response.')
          return
        }

        const putRes = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type || 'application/octet-stream',
          },
        })
        if (!putRes.ok) {
          setLocalError('Upload to storage failed. Try again or contact support.')
          return
        }

        onUploaded({
          r2Key: key,
          fileSizeBytes: file.size,
          mimeType: file.type || 'application/octet-stream',
          extension: extensionFromFile(file),
        })
        setLastLabel(`${file.name} (${formatBytes(file.size)})`)
      } catch {
        setLocalError('Network error during upload.')
      }
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <input
        ref={inputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={onFileChange}
        disabled={disabled || isPending}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        <button
          type="button"
          onClick={pickFile}
          disabled={disabled || isPending}
          style={{
            padding: '8px 14px',
            backgroundColor: disabled || isPending ? 'var(--color-surface-muted)' : 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-control)',
            fontSize: '0.8125rem',
            fontWeight: 500,
            cursor: disabled || isPending ? 'not-allowed' : 'pointer',
          }}
        >
          {isPending ? 'Uploading…' : 'Choose file & upload to R2'}
        </button>
        {lastLabel && (
          <button
            type="button"
            onClick={() => {
              setLastLabel(null)
              onClear()
            }}
            disabled={disabled || isPending}
            style={{
              padding: '6px 10px',
              fontSize: '0.75rem',
              color: 'var(--color-danger)',
              background: 'none',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-control)',
              cursor: disabled || isPending ? 'not-allowed' : 'pointer',
            }}
          >
            Clear upload
          </button>
        )}
      </div>
      {localError && (
        <p role="alert" style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-danger)' }}>
          {localError}
        </p>
      )}
      <p style={fieldHintStyle}>
        Files are stored in your private R2 bucket using the same file-code rules as the database record. Executable
        script types are blocked.
      </p>
    </div>
  )
}
