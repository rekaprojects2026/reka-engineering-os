import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getSessionProfileOptional } from '@/lib/auth/session'
import {
  ensureFileUpdateAccess,
  ensureProjectOperationalMutation,
} from '@/lib/auth/mutation-policy'
import { getFileById, getNextFileSequenceNumber } from '@/lib/files/queries'
import { generateFileCode, parseCodeMap } from '@/lib/files/naming'
import { getFileNamingConfig } from '@/lib/settings/queries'
import { presignPutObject } from '@/lib/files/r2-service'
import { getR2Env } from '@/lib/files/r2'

const BLOCKED_EXT = new Set([
  'exe', 'msi', 'bat', 'cmd', 'scr', 'com', 'pif', 'vbs', 'js', 'ps1', 'sh',
])

function extensionFromFileName(fileName: string): string {
  const base = fileName.split(/[/\\]/).pop() ?? fileName
  const i = base.lastIndexOf('.')
  if (i <= 0 || i === base.length - 1) return ''
  return base.slice(i + 1).toLowerCase()
}

function sanitizeFileSegment(name: string): string {
  const base = (name.split(/[/\\]/).pop() ?? name).slice(0, 200)
  const s = base.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/_+/g, '_')
  return s || 'upload.bin'
}

export async function POST(request: Request) {
  if (!getR2Env()) {
    return NextResponse.json({ error: 'R2 is not configured on this server.' }, { status: 503 })
  }

  const profile = await getSessionProfileOptional()
  if (!profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const b = body as Record<string, unknown>
  const projectId = typeof b.projectId === 'string' ? b.projectId.trim() : ''
  const fileName = typeof b.fileName === 'string' ? b.fileName.trim() : ''
  const contentType =
    typeof b.contentType === 'string' && b.contentType.trim()
      ? b.contentType.trim()
      : 'application/octet-stream'
  const existingFileId = typeof b.existingFileId === 'string' ? b.existingFileId.trim() : ''

  if (!projectId || !fileName) {
    return NextResponse.json({ error: 'projectId and fileName are required.' }, { status: 400 })
  }

  const ext = extensionFromFileName(fileName)
  if (ext && BLOCKED_EXT.has(ext)) {
    return NextResponse.json({ error: 'This file type is not allowed for upload.' }, { status: 400 })
  }

  const supabase = await createServerClient()
  let objectKey: string

  if (existingFileId) {
    const gate = await ensureFileUpdateAccess(profile, existingFileId, getFileById)
    if ('error' in gate) {
      const status = gate.error === 'File not found.' ? 404 : 403
      return NextResponse.json({ error: gate.error }, { status })
    }
    const f = gate.f
    if (f.project_id !== projectId) {
      return NextResponse.json({ error: 'Project mismatch.' }, { status: 400 })
    }
    const code = f.file_code?.trim() || `legacy-${f.id}`
    objectKey = `${projectId}/${code}/${sanitizeFileSegment(fileName)}`
  } else {
    const op = await ensureProjectOperationalMutation(profile, projectId)
    if ('error' in op) {
      return NextResponse.json({ error: op.error }, { status: 403 })
    }

    const disciplineCode = (typeof b.disciplineCode === 'string' ? b.disciplineCode : '').trim().toUpperCase()
    const docTypeCode = (typeof b.docTypeCode === 'string' ? b.docTypeCode : '').trim().toUpperCase()
    if (!disciplineCode || !docTypeCode) {
      return NextResponse.json(
        { error: 'disciplineCode and docTypeCode are required for new uploads.' },
        { status: 400 },
      )
    }

    const namingConfig = await getFileNamingConfig()
    const allowedDisc = new Set(parseCodeMap(namingConfig.discipline_codes).map((e) => e.value.toUpperCase()))
    const allowedDoc = new Set(parseCodeMap(namingConfig.doc_type_codes).map((e) => e.value.toUpperCase()))
    if (!allowedDisc.has(disciplineCode) || !allowedDoc.has(docTypeCode)) {
      return NextResponse.json(
        { error: 'Invalid discipline or document type for naming configuration.' },
        { status: 400 },
      )
    }

    let sequenceNumber = typeof b.sequenceNumber === 'number' ? b.sequenceNumber : parseInt(String(b.sequenceNumber ?? ''), 10)
    if (!Number.isFinite(sequenceNumber) || sequenceNumber < 1) {
      sequenceNumber = await getNextFileSequenceNumber(projectId, disciplineCode, docTypeCode)
    }

    let revisionIndex = typeof b.revisionIndex === 'number' ? b.revisionIndex : parseInt(String(b.revisionIndex ?? ''), 10)
    if (!Number.isFinite(revisionIndex) || revisionIndex < 0) revisionIndex = 0

    const { data: projRow, error: projErr } = await supabase
      .from('projects')
      .select('project_code')
      .eq('id', projectId)
      .single()
    if (projErr || !projRow?.project_code) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 })
    }

    const fileCode = generateFileCode({
      projectCode: projRow.project_code,
      disciplineCode,
      docTypeCode,
      sequenceNumber,
      revisionIndex,
      separator: namingConfig.separator || '-',
      revisionFormat: namingConfig.revision_format || 'R0_RA_RB',
    })

    objectKey = `${projectId}/${fileCode}/${sanitizeFileSegment(fileName)}`
  }

  try {
    const uploadUrl = await presignPutObject(objectKey, contentType)
    return NextResponse.json({ uploadUrl, key: objectKey, method: 'PUT' as const })
  } catch (e) {
    console.error('R2 presign PUT failed', e)
    return NextResponse.json({ error: 'Could not create upload URL.' }, { status: 500 })
  }
}
