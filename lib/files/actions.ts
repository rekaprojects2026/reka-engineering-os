'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { effectiveRole, isFreelancer, isManajer, isManagement } from '@/lib/auth/permissions'
import {
  loadMutationProfile,
  ensureProjectOperationalMutation,
  ensureFileUpdateAccess,
  MUTATION_FORBIDDEN,
} from '@/lib/auth/mutation-policy'
import { formatRevision, generateFileCode, parseCodeMap } from '@/lib/files/naming'
import { deleteFromR2 } from '@/lib/files/r2-service'
import { publicObjectUrlForKey } from '@/lib/files/r2'
import { getFileById, getNextFileSequenceNumber } from '@/lib/files/queries'
import { getFileNamingConfig } from '@/lib/settings/queries'

async function cleanupR2OnFileUpdate(
  previous: { provider: string; r2_key: string | null },
  newProvider: string,
  newR2Key: string | null,
) {
  if (previous.provider !== 'r2' || !previous.r2_key) return
  if (newProvider !== 'r2') {
    try {
      await deleteFromR2(previous.r2_key)
    } catch (e) {
      console.error('R2 delete on provider change', e)
    }
    return
  }
  if (newR2Key && newR2Key !== previous.r2_key) {
    try {
      await deleteFromR2(previous.r2_key)
    } catch (e) {
      console.error('R2 delete on key replace', e)
    }
  }
}

// ─── Create ───────────────────────────────────────────────────
export async function createFile(formData: FormData) {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const fileName = (formData.get('file_name') as string)?.trim()
  const projectId = (formData.get('project_id') as string)?.trim()

  if (!fileName) return { error: 'File name is required.' }
  if (!projectId) return { error: 'Project is required.' }

  const gate = await ensureProjectOperationalMutation(profile, projectId)
  if ('error' in gate) return { error: gate.error }

  const provider = (formData.get('provider') as string) || 'manual'

  const namingConfig = await getFileNamingConfig()
  const discipline_code = ((formData.get('discipline_code') as string) || '').trim().toUpperCase()
  const doc_type_code = ((formData.get('doc_type_code') as string) || '').trim().toUpperCase()
  if (!discipline_code || !doc_type_code) {
    return { error: 'Discipline code and document type code are required for file registration.' }
  }
  const allowedDisc = new Set(parseCodeMap(namingConfig.discipline_codes).map((e) => e.value.toUpperCase()))
  const allowedDoc = new Set(parseCodeMap(namingConfig.doc_type_codes).map((e) => e.value.toUpperCase()))
  if (!allowedDisc.has(discipline_code) || !allowedDoc.has(doc_type_code)) {
    return { error: 'Invalid discipline or document type for the current naming configuration.' }
  }

  const seqRaw = (formData.get('sequence_number') as string)?.trim()
  let sequenceNumber = parseInt(seqRaw || '', 10)
  if (!Number.isFinite(sequenceNumber) || sequenceNumber < 1) {
    sequenceNumber = await getNextFileSequenceNumber(projectId, discipline_code, doc_type_code)
  }

  const revRaw = (formData.get('revision_index') as string)?.trim()
  let revisionIndex = parseInt(revRaw || '', 10)
  if (!Number.isFinite(revisionIndex) || revisionIndex < 0) revisionIndex = 0

  const { data: projRow, error: projErr } = await supabase
    .from('projects')
    .select('project_code')
    .eq('id', projectId)
    .single()
  if (projErr || !projRow?.project_code) return { error: 'Project not found.' }

  const revision_code = formatRevision(revisionIndex, namingConfig.revision_format)
  const file_code = generateFileCode({
    projectCode: projRow.project_code,
    disciplineCode: discipline_code,
    docTypeCode: doc_type_code,
    sequenceNumber,
    revisionIndex,
    separator: namingConfig.separator || '-',
    revisionFormat: namingConfig.revision_format || 'R0_RA_RB',
  })

  const r2_key = provider === 'r2' ? (formData.get('r2_key') as string)?.trim() || null : null
  if (provider === 'r2' && !r2_key) {
    return { error: 'Upload a file to Cloudflare R2 before saving.' }
  }
  const fsRaw = (formData.get('file_size_bytes') as string)?.trim()
  let file_size_bytes: number | null = null
  if (provider === 'r2' && fsRaw) {
    const n = parseInt(fsRaw, 10)
    if (Number.isFinite(n) && n >= 0) file_size_bytes = n
  }

  const payload = {
    file_name:              fileName,
    project_id:             projectId,
    task_id:                (formData.get('task_id') as string)?.trim() || null,
    deliverable_id:         (formData.get('deliverable_id') as string)?.trim() || null,
    file_category:          (formData.get('file_category') as string) || 'working_file',
    provider,
    manual_link:            provider === 'manual' ? (formData.get('manual_link') as string)?.trim() || null : null,
    external_file_id:       provider === 'google_drive' ? (formData.get('external_file_id') as string)?.trim() || null : null,
    google_web_view_link:   provider === 'google_drive' ? (formData.get('google_web_view_link') as string)?.trim() || null : null,
    mime_type:              (formData.get('mime_type') as string)?.trim() || null,
    extension:              (formData.get('extension') as string)?.trim() || null,
    r2_key:                 provider === 'r2' ? r2_key : null,
    r2_url:                 provider === 'r2' && r2_key ? publicObjectUrlForKey(r2_key) : null,
    file_size_bytes:        provider === 'r2' ? file_size_bytes : null,
    revision_number:        revisionIndex,
    version_label:          (formData.get('version_label') as string)?.trim() || null,
    notes:                  (formData.get('notes') as string)?.trim() || null,
    uploaded_by_user_id:    user.id,
    discipline_code,
    doc_type_code,
    file_code,
    revision_code,
  }

  const { data, error } = await supabase
    .from('project_files')
    .insert(payload)
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/projects/${projectId}`)
  redirect(`/files/${data.id}`)
}

// ─── Update ───────────────────────────────────────────────────
export async function updateFile(id: string, formData: FormData) {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const checked = await ensureFileUpdateAccess(profile, id, getFileById)
  if ('error' in checked) return { error: checked.error }
  const f = checked.f

  const role = effectiveRole(profile.system_role)

  if (role === 'member' || isFreelancer(role)) {
    if (f.uploaded_by_user_id !== user.id) return { error: MUTATION_FORBIDDEN }

    const fileName = (formData.get('file_name') as string)?.trim()
    if (!fileName) return { error: 'File name is required.' }

    const provider = (formData.get('provider') as string) || 'manual'
    const r2_key = provider === 'r2' ? (formData.get('r2_key') as string)?.trim() || null : null
    if (provider === 'r2' && !r2_key) {
      return { error: 'Upload a file to Cloudflare R2 before saving.' }
    }
    const fsRaw = (formData.get('file_size_bytes') as string)?.trim()
    let file_size_bytes: number | null = null
    if (provider === 'r2' && fsRaw) {
      const n = parseInt(fsRaw, 10)
      if (Number.isFinite(n) && n >= 0) file_size_bytes = n
    }

    await cleanupR2OnFileUpdate({ provider: f.provider, r2_key: f.r2_key }, provider, r2_key)

    const payload = {
      file_name:              fileName,
      project_id:             f.project_id,
      task_id:                f.task_id,
      deliverable_id:         f.deliverable_id,
      file_category:          (formData.get('file_category') as string) || 'working_file',
      provider,
      manual_link:            provider === 'manual' ? (formData.get('manual_link') as string)?.trim() || null : null,
      external_file_id:       provider === 'google_drive' ? (formData.get('external_file_id') as string)?.trim() || null : null,
      google_web_view_link:   provider === 'google_drive' ? (formData.get('google_web_view_link') as string)?.trim() || null : null,
      mime_type:              (formData.get('mime_type') as string)?.trim() || null,
      extension:              (formData.get('extension') as string)?.trim() || null,
      r2_key:                 provider === 'r2' ? r2_key : null,
      r2_url:                 provider === 'r2' && r2_key ? publicObjectUrlForKey(r2_key) : null,
      file_size_bytes:        provider === 'r2' ? file_size_bytes : null,
      revision_number:        parseInt((formData.get('revision_number') as string) || '', 10) || null,
      version_label:          (formData.get('version_label') as string)?.trim() || null,
      notes:                  (formData.get('notes') as string)?.trim() || null,
    }

    const { error } = await supabase.from('project_files').update(payload).eq('id', id)
    if (error) return { error: error.message }

    revalidatePath(`/files/${id}`)
    revalidatePath(`/projects/${f.project_id}`)
    redirect(`/files/${id}`)
  }

  if (!isManagement(role) && !isManajer(role)) {
    return { error: MUTATION_FORBIDDEN }
  }

  const fileName = (formData.get('file_name') as string)?.trim()
  const projectId = (formData.get('project_id') as string)?.trim()

  if (!fileName) return { error: 'File name is required.' }
  if (!projectId) return { error: 'Project is required.' }

  if (role === 'manajer') {
    const dest = await ensureProjectOperationalMutation(profile, projectId)
    if ('error' in dest) return { error: dest.error }
  }

  const provider = (formData.get('provider') as string) || 'manual'
  const r2_key = provider === 'r2' ? (formData.get('r2_key') as string)?.trim() || null : null
  if (provider === 'r2' && !r2_key) {
    return { error: 'Upload a file to Cloudflare R2 before saving.' }
  }
  const fsRaw = (formData.get('file_size_bytes') as string)?.trim()
  let file_size_bytes: number | null = null
  if (provider === 'r2' && fsRaw) {
    const n = parseInt(fsRaw, 10)
    if (Number.isFinite(n) && n >= 0) file_size_bytes = n
  }

  await cleanupR2OnFileUpdate({ provider: f.provider, r2_key: f.r2_key }, provider, r2_key)

  const payload = {
    file_name:              fileName,
    project_id:             projectId,
    task_id:                (formData.get('task_id') as string)?.trim() || null,
    deliverable_id:         (formData.get('deliverable_id') as string)?.trim() || null,
    file_category:          (formData.get('file_category') as string) || 'working_file',
    provider,
    manual_link:            provider === 'manual' ? (formData.get('manual_link') as string)?.trim() || null : null,
    external_file_id:       provider === 'google_drive' ? (formData.get('external_file_id') as string)?.trim() || null : null,
    google_web_view_link:   provider === 'google_drive' ? (formData.get('google_web_view_link') as string)?.trim() || null : null,
    mime_type:              (formData.get('mime_type') as string)?.trim() || null,
    extension:              (formData.get('extension') as string)?.trim() || null,
    r2_key:                 provider === 'r2' ? r2_key : null,
    r2_url:                 provider === 'r2' && r2_key ? publicObjectUrlForKey(r2_key) : null,
    file_size_bytes:        provider === 'r2' ? file_size_bytes : null,
    revision_number:        parseInt((formData.get('revision_number') as string) || '', 10) || null,
    version_label:          (formData.get('version_label') as string)?.trim() || null,
    notes:                  (formData.get('notes') as string)?.trim() || null,
  }

  const { error } = await supabase
    .from('project_files')
    .update(payload)
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath(`/files/${id}`)
  revalidatePath(`/projects/${projectId}`)
  if (f.project_id !== projectId) {
    revalidatePath(`/projects/${f.project_id}`)
  }
  redirect(`/files/${id}`)
}

export async function deleteFile(fileId: string): Promise<{ error: string } | void> {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const checked = await ensureFileUpdateAccess(profile, fileId, getFileById)
  if ('error' in checked) return { error: checked.error }
  const row = checked.f

  if (row.provider === 'r2' && row.r2_key) {
    try {
      await deleteFromR2(row.r2_key)
    } catch (e) {
      console.error('deleteFromR2 failed', e)
    }
  }

  const { error } = await supabase.from('project_files').delete().eq('id', fileId)
  if (error) return { error: error.message }

  revalidatePath('/files')
  revalidatePath(`/projects/${row.project_id}`)
  redirect('/files')
}

// ─── Approve file version (admin / coordinator on project) ─────
export async function approveFile(fileId: string) {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const f = await getFileById(fileId)
  if (!f) throw new Error('File not found.')

  const gate = await ensureProjectOperationalMutation(profile, f.project_id)
  if ('error' in gate) throw new Error(gate.error)
  if (f.is_approved_version) {
    revalidatePath(`/files/${fileId}`)
    revalidatePath(`/projects/${f.project_id}`)
    return
  }

  const { error } = await supabase
    .from('project_files')
    .update({
      is_approved_version:  true,
      approved_at:          new Date().toISOString(),
      approved_by:          user.id,
    })
    .eq('id', fileId)

  if (error) throw new Error(error.message)
  revalidatePath(`/files/${fileId}`)
  revalidatePath(`/projects/${f.project_id}`)
}
