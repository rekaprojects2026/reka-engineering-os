'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { markProjectPendingApprovalNotificationsRead } from '@/lib/notifications/helpers'
import { logActivity } from '@/lib/activity/actions'
import {
  loadMutationProfile,
  ensureCreateProjectMutation,
  ensureProjectOperationalMutation,
  MUTATION_FORBIDDEN,
} from '@/lib/auth/mutation-policy'
import { isDirektur, isManajer, isOpsLead, isTD } from '@/lib/auth/permissions'
import { userCanEditProjectMetadata, userCanViewProject } from '@/lib/auth/access-surface'
import { getProjectById, isUserAssignedToProject } from '@/lib/projects/queries'
import { ensureDefaultTerminsForProject } from '@/lib/termins/ensure-default-termins'
import { parseContractFromForm } from '@/lib/projects/contract-from-form'
import { tryCreateProjectDriveFolderAfterInsert, addConstructionAdminFoldersUnderProject } from '@/lib/files/drive-project-folder'
import { extractGoogleDriveFolderIdFromUrl } from '@/lib/files/drive-service'
import type { ProjectDriveMode } from '@/types/database'
import { normalizeProjectDisciplines } from '@/lib/projects/helpers'

function parseDisciplinesFromForm(formData: FormData): string[] {
  const raw = formData.getAll('disciplines')
  return [...new Set(raw.map((v) => String(v).trim()).filter(Boolean))]
}

function parseDriveModeFromForm(formData: FormData): ProjectDriveMode {
  const v = (formData.get('drive_mode') as string)?.trim()
  if (v === 'manual' || v === 'none' || v === 'auto') return v
  return 'auto'
}

function buildProjectInsertPayload(
  formData: FormData,
  userId: string,
  opts: { status: string; approval_requested_at: string | null },
) {
  const name = (formData.get('name') as string)?.trim()
  const clientId = (formData.get('client_id') as string)?.trim()
  const leadUserId = (formData.get('project_lead_user_id') as string)?.trim()
  const targetDueDate = (formData.get('target_due_date') as string)?.trim()
  const intakeId = (formData.get('intake_id') as string)?.trim() || null
  const reviewerUserId = (formData.get('reviewer_user_id') as string)?.trim() || null
  const contract = parseContractFromForm(formData)
  const disciplines = parseDisciplinesFromForm(formData)
  const primaryDiscipline = disciplines[0] ?? 'mechanical'
  const driveMode = parseDriveModeFromForm(formData)
  const linkRaw = (formData.get('google_drive_folder_link') as string)?.trim() || null
  let google_drive_folder_link: string | null = linkRaw
  let google_drive_folder_id: string | null = null
  if (driveMode === 'manual' && linkRaw) {
    google_drive_folder_id = extractGoogleDriveFolderIdFromUrl(linkRaw)
  }
  if (driveMode === 'auto' || driveMode === 'none') {
    google_drive_folder_link = driveMode === 'none' ? null : null
    google_drive_folder_id = null
  }

  return {
    name,
    client_id: clientId,
    intake_id: intakeId,
    source: (formData.get('source') as string) || 'direct',
    external_reference_url: (formData.get('external_reference_url') as string)?.trim() || null,
    discipline: primaryDiscipline,
    disciplines,
    drive_mode: driveMode,
    project_type: (formData.get('project_type') as string) || 'design',
    scope_summary: (formData.get('scope_summary') as string)?.trim() || null,
    start_date: (formData.get('start_date') as string) || new Date().toISOString().split('T')[0],
    target_due_date: targetDueDate,
    project_lead_user_id: leadUserId,
    reviewer_user_id: reviewerUserId,
    priority: (formData.get('priority') as string) || 'medium',
    status: opts.status,
    approval_requested_at: opts.approval_requested_at,
    progress_percent: 0,
    waiting_on: (formData.get('waiting_on') as string) || 'none',
    google_drive_folder_link,
    google_drive_folder_id,
    notes_internal: (formData.get('notes_internal') as string)?.trim() || null,
    created_by: userId,
    project_code: '',
    ...contract,
  }
}

function buildProjectUpdatePayload(formData: FormData) {
  const contract = parseContractFromForm(formData)
  const disciplines = parseDisciplinesFromForm(formData)
  const primaryDiscipline = disciplines[0] ?? 'mechanical'
  const driveMode = parseDriveModeFromForm(formData)
  const linkRaw = (formData.get('google_drive_folder_link') as string)?.trim() || null
  const drivePatch =
    driveMode === 'manual'
      ? {
          google_drive_folder_link: linkRaw,
          google_drive_folder_id: linkRaw ? extractGoogleDriveFolderIdFromUrl(linkRaw) : null,
        }
      : driveMode === 'none'
        ? { google_drive_folder_link: null, google_drive_folder_id: null }
        : {}

  return {
    name: (formData.get('name') as string)?.trim(),
    client_id: (formData.get('client_id') as string)?.trim(),
    source: (formData.get('source') as string),
    external_reference_url: (formData.get('external_reference_url') as string)?.trim() || null,
    discipline: primaryDiscipline,
    disciplines,
    drive_mode: driveMode,
    project_type: (formData.get('project_type') as string),
    scope_summary: (formData.get('scope_summary') as string)?.trim() || null,
    start_date: (formData.get('start_date') as string),
    target_due_date: (formData.get('target_due_date') as string)?.trim(),
    actual_completion_date: (formData.get('actual_completion_date') as string) || null,
    project_lead_user_id: (formData.get('project_lead_user_id') as string)?.trim(),
    reviewer_user_id: (formData.get('reviewer_user_id') as string)?.trim() || null,
    priority: (formData.get('priority') as string),
    status: (formData.get('status') as string),
    waiting_on: (formData.get('waiting_on') as string),
    notes_internal: (formData.get('notes_internal') as string)?.trim() || null,
    ...drivePatch,
    ...contract,
  }
}

// ─── Create ───────────────────────────────────────────────────
export async function createProject(formData: FormData) {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const perm = ensureCreateProjectMutation(profile)
  if (perm) return { error: perm }

  const name = (formData.get('name') as string)?.trim()
  const clientId = (formData.get('client_id') as string)?.trim()
  const leadUserId = (formData.get('project_lead_user_id') as string)?.trim()
  const targetDueDate = (formData.get('target_due_date') as string)?.trim()

  if (!name) return { error: 'Project name is required.' }
  if (!clientId) return { error: 'Client is required.' }
  if (!leadUserId) return { error: 'Project lead is required.' }
  if (!targetDueDate) return { error: 'Target due date is required.' }

  const disciplines = parseDisciplinesFromForm(formData)
  const driveMode = parseDriveModeFromForm(formData)
  if (disciplines.length === 0) return { error: 'Pilih minimal satu disiplin.' }
  const driveLink = (formData.get('google_drive_folder_link') as string)?.trim() || ''
  if (driveMode === 'manual') {
    if (!driveLink) return { error: 'Masukkan link folder Google Drive.' }
    if (!extractGoogleDriveFolderIdFromUrl(driveLink)) return { error: 'Link Google Drive tidak valid.' }
  }

  const contract = parseContractFromForm(formData)
  if (contract.source_type === 'DOMESTIC' && (contract.contract_value == null || contract.contract_value <= 0)) {
    return { error: 'Nilai kontrak wajib diisi untuk project Domestic.' }
  }

  const isByDirektur = isDirektur(profile.system_role)
  const initialStatus = isByDirektur ? 'new' : 'pending_approval'
  const approvalTime = isByDirektur ? null : new Date().toISOString()

  const payload = buildProjectInsertPayload(formData, user.id, {
    status: initialStatus,
    approval_requested_at: approvalTime,
  })

  const { data, error } = await supabase
    .from('projects')
    .insert(payload)
    .select('id, project_code')
    .single()

  if (error) return { error: error.message }

  const inserted = data as { id: string; project_code: string }
  try {
    await tryCreateProjectDriveFolderAfterInsert(supabase, {
      projectId: inserted.id,
      projectCode: inserted.project_code ?? '',
      clientId,
      sourceType: contract.source_type,
      source: (formData.get('source') as string) || 'direct',
      disciplines,
      driveMode,
    })
  } catch (e) {
    console.error('Google Drive folder (non-fatal):', e)
  }

  const terminSlice = {
    id: inserted.id,
    status: initialStatus,
    source_type: contract.source_type,
    contract_value: contract.contract_value,
    contract_currency: contract.contract_currency,
    has_retention: contract.has_retention,
    retention_percentage: contract.retention_percentage,
  }
  const terminErr = await ensureDefaultTerminsForProject(supabase, terminSlice)
  if (terminErr.error) {
    console.error('ensureDefaultTerminsForProject:', terminErr.error)
  }

  await logActivity({
    entity_type: 'project',
    entity_id: inserted.id,
    action_type: 'created',
    user_id: user.id,
    note: isByDirektur ? `Project '${name}' created` : `Project '${name}' submitted for approval`,
  })

  revalidatePath('/projects')
  revalidatePath(`/clients/${clientId}`)
  revalidateTag('dashboard')
  revalidateTag('projects')
  redirect(`/projects/${inserted.id}`)
}

// ─── Update ───────────────────────────────────────────────────
export async function updateProject(id: string, formData: FormData) {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const project = await getProjectById(id)
  if (!project) return { error: 'Project not found.' }
  if (!(await userCanEditProjectMetadata(profile, project))) return { error: MUTATION_FORBIDDEN }

  const name = (formData.get('name') as string)?.trim()
  const clientId = (formData.get('client_id') as string)?.trim()
  const leadUserId = (formData.get('project_lead_user_id') as string)?.trim()
  const targetDueDate = (formData.get('target_due_date') as string)?.trim()

  if (!name) return { error: 'Project name is required.' }
  if (!clientId) return { error: 'Client is required.' }
  if (!leadUserId) return { error: 'Project lead is required.' }
  if (!targetDueDate) return { error: 'Target due date is required.' }

  const disciplines = parseDisciplinesFromForm(formData)
  if (disciplines.length === 0) return { error: 'Pilih minimal satu disiplin.' }
  const driveMode = parseDriveModeFromForm(formData)
  const driveLink = (formData.get('google_drive_folder_link') as string)?.trim() || ''
  if (driveMode === 'manual') {
    if (!driveLink) return { error: 'Masukkan link folder Google Drive.' }
    if (!extractGoogleDriveFolderIdFromUrl(driveLink)) return { error: 'Link Google Drive tidak valid.' }
  }

  const contract = parseContractFromForm(formData)
  if (contract.source_type === 'DOMESTIC' && (contract.contract_value == null || contract.contract_value <= 0)) {
    return { error: 'Nilai kontrak wajib diisi untuk project Domestic.' }
  }

  const payload = buildProjectUpdatePayload(formData)
  if (project.status === 'pending_approval' || project.status === 'rejected') {
    payload.status = project.status
  }

  const { error } = await supabase
    .from('projects')
    .update(payload)
    .eq('id', id)

  if (error) return { error: error.message }

  const merged = { ...project, ...payload }
  const terminErr = await ensureDefaultTerminsForProject(supabase, merged)
  if (terminErr.error) {
    console.error('ensureDefaultTerminsForProject:', terminErr.error)
  }

  await logActivity({
    entity_type: 'project',
    entity_id: id,
    action_type: 'status_updated',
    user_id: user.id,
    note: `Project updated (status ${payload.status})`,
  })

  revalidatePath('/projects')
  revalidatePath(`/projects/${id}`)
  revalidatePath(`/clients/${clientId}`)
  revalidateTag('dashboard')
  revalidateTag('projects')
  redirect(`/projects/${id}`)
}

/** Direktur: approve pending project (optional field updates merged in one step). */
export async function approveProject(projectId: string, formData?: FormData): Promise<{ error?: string }> {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  if (!isDirektur(profile.system_role)) return { error: MUTATION_FORBIDDEN }

  const project = await getProjectById(projectId)
  if (!project || project.status !== 'pending_approval') {
    return { error: 'Project is not waiting for approval.' }
  }

  if (formData) {
    const c = parseContractFromForm(formData)
    if (c.source_type === 'DOMESTIC' && (c.contract_value == null || c.contract_value <= 0)) {
      return { error: 'Nilai kontrak wajib diisi untuk project Domestic.' }
    }
    const disciplines = parseDisciplinesFromForm(formData)
    if (disciplines.length === 0) return { error: 'Pilih minimal satu disiplin.' }
    const driveMode = parseDriveModeFromForm(formData)
    const driveLink = (formData.get('google_drive_folder_link') as string)?.trim() || ''
    if (driveMode === 'manual') {
      if (!driveLink) return { error: 'Masukkan link folder Google Drive.' }
      if (!extractGoogleDriveFolderIdFromUrl(driveLink)) return { error: 'Link Google Drive tidak valid.' }
    }
  }

  const now = new Date().toISOString()
  const base = {
    status: 'new',
    approval_reviewed_by: profile.id,
    approval_reviewed_at: now,
    rejection_note: null as string | null,
  }

  let patch: Record<string, unknown> = { ...base }
  if (formData) {
    const p = buildProjectUpdatePayload(formData)
    patch = {
      ...p,
      ...base,
    }
  }

  const { error } = await supabase
    .from('projects')
    .update(patch)
    .eq('id', projectId)
    .eq('status', 'pending_approval')

  if (error) return { error: error.message }

  await markProjectPendingApprovalNotificationsRead(supabase, profile.id, projectId)

  const { data: fresh, error: selErr } = await supabase
    .from('projects')
    .select('id, source_type, status, contract_value, contract_currency, has_retention, retention_percentage')
    .eq('id', projectId)
    .single()

  if (!selErr && fresh) {
    const terminErr = await ensureDefaultTerminsForProject(supabase, fresh)
    if (terminErr.error) {
      console.error('ensureDefaultTerminsForProject:', terminErr.error)
    }
  }

  await logActivity({
    entity_type: 'project',
    entity_id: projectId,
    action_type: 'status_updated',
    user_id: profile.id,
    note: 'Project approved by Direktur',
  })

  revalidatePath('/projects')
  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/dashboard')
  revalidateTag('dashboard')
  revalidateTag('projects')
  return {}
}

/** Direktur: reject with required note. */
export async function rejectProject(projectId: string, rejectionNote: string): Promise<{ error?: string }> {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  if (!isDirektur(profile.system_role)) return { error: MUTATION_FORBIDDEN }
  const trimmed = rejectionNote.trim()
  if (!trimmed) return { error: 'Catatan alasan penolakan wajib diisi.' }

  const now = new Date().toISOString()
  const { error } = await supabase
    .from('projects')
    .update({
      status: 'rejected',
      approval_reviewed_by: profile.id,
      approval_reviewed_at: now,
      rejection_note: trimmed,
    })
    .eq('id', projectId)
    .eq('status', 'pending_approval')

  if (error) return { error: error.message }

  await markProjectPendingApprovalNotificationsRead(supabase, profile.id, projectId)

  await logActivity({
    entity_type: 'project',
    entity_id: projectId,
    action_type: 'status_updated',
    user_id: profile.id,
    note: 'Project rejected by Direktur',
  })

  revalidatePath('/projects')
  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/dashboard')
  revalidateTag('dashboard')
  revalidateTag('projects')
  return {}
}

/** Ops lead: resubmit rejected project for approval. */
export async function resubmitProject(id: string, formData: FormData): Promise<{ error?: string }> {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  if (!isOpsLead(profile.system_role)) return { error: MUTATION_FORBIDDEN }

  const existing = await getProjectById(id)
  if (!existing || existing.status !== 'rejected') {
    return { error: 'Project can only be resubmitted when it is rejected.' }
  }

  if (!(await userCanEditProjectMetadata(profile, existing))) {
    return { error: MUTATION_FORBIDDEN }
  }

  if (isManajer(profile.system_role)) {
    const okLead = existing.project_lead_user_id === profile.id
    const okAssign = await isUserAssignedToProject(profile.id, id)
    if (!okLead && !okAssign) return { error: MUTATION_FORBIDDEN }
  }

  const name = (formData.get('name') as string)?.trim()
  const clientId = (formData.get('client_id') as string)?.trim()
  const leadUserId = (formData.get('project_lead_user_id') as string)?.trim()
  const targetDueDate = (formData.get('target_due_date') as string)?.trim()

  if (!name) return { error: 'Project name is required.' }
  if (!clientId) return { error: 'Client is required.' }
  if (!leadUserId) return { error: 'Project lead is required.' }
  if (!targetDueDate) return { error: 'Target due date is required.' }

  const disciplines = parseDisciplinesFromForm(formData)
  if (disciplines.length === 0) return { error: 'Pilih minimal satu disiplin.' }
  const driveMode = parseDriveModeFromForm(formData)
  const driveLink = (formData.get('google_drive_folder_link') as string)?.trim() || ''
  if (driveMode === 'manual') {
    if (!driveLink) return { error: 'Masukkan link folder Google Drive.' }
    if (!extractGoogleDriveFolderIdFromUrl(driveLink)) return { error: 'Link Google Drive tidak valid.' }
  }

  const c = parseContractFromForm(formData)
  if (c.source_type === 'DOMESTIC' && (c.contract_value == null || c.contract_value <= 0)) {
    return { error: 'Nilai kontrak wajib diisi untuk project Domestic.' }
  }

  const payload = {
    ...buildProjectUpdatePayload(formData),
    status: 'pending_approval',
    approval_requested_at: new Date().toISOString(),
    rejection_note: null,
    approval_reviewed_by: null,
    approval_reviewed_at: null,
  }

  const { error } = await supabase
    .from('projects')
    .update(payload)
    .eq('id', id)
    .eq('status', 'rejected')

  if (error) return { error: error.message }

  await logActivity({
    entity_type: 'project',
    entity_id: id,
    action_type: 'status_updated',
    user_id: profile.id,
    note: 'Project resubmitted for approval',
  })

  revalidatePath('/projects')
  revalidatePath(`/projects/${id}`)
  revalidatePath(`/clients/${clientId}`)
  revalidatePath('/dashboard')
  revalidateTag('dashboard')
  revalidateTag('projects')
  return {}
}

// ─── Quick status update (for inline/kanban) ──────────────────
export async function updateProjectStatus(id: string, status: string) {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  const project = await getProjectById(id)
  if (!project) throw new Error('Project not found.')

  if (project.status === 'pending_approval' && !isDirektur(profile.system_role)) {
    throw new Error(MUTATION_FORBIDDEN)
  }
  if (['pending_approval', 'rejected'].includes(project.status)) {
    throw new Error('Status is managed through the approval workflow.')
  }

  const gate = await ensureProjectOperationalMutation(profile, id)
  if ('error' in gate) throw new Error(gate.error)

  const { error } = await supabase.from('projects').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/projects')
  revalidatePath(`/projects/${id}`)
  revalidateTag('dashboard')
  revalidateTag('projects')
}

// ─── Mark project problematic (admin / coordinator on project) ─
/** TD or Manajer project lead: add `06-Construction-Admin` under each discipline folder in Drive. */
export async function addConstructionAdminFolders(projectId: string): Promise<void> {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  const project = await getProjectById(projectId)
  if (!project) redirect(`/projects/${projectId}?construction_admin_error=${encodeURIComponent('Project not found.')}`)
  if (project.status === 'pending_approval' || project.status === 'rejected') {
    redirect(
      `/projects/${projectId}?construction_admin_error=${encodeURIComponent('Project is not active for this action.')}`,
    )
  }
  if (!(await userCanViewProject(profile, project))) {
    redirect(`/projects/${projectId}?construction_admin_error=${encodeURIComponent(MUTATION_FORBIDDEN)}`)
  }
  const allowed =
    isTD(profile.system_role) ||
    (isManajer(profile.system_role) && project.project_lead_user_id === profile.id)
  if (!allowed) {
    redirect(`/projects/${projectId}?construction_admin_error=${encodeURIComponent(MUTATION_FORBIDDEN)}`)
  }
  if (project.drive_mode !== 'auto' || !project.google_drive_folder_id || project.drive_construction_admin_created) {
    redirect(
      `/projects/${projectId}?construction_admin_error=${encodeURIComponent('Construction Admin folders cannot be added for this project.')}`,
    )
  }

  const disciplines = normalizeProjectDisciplines(project)
  if (disciplines.length === 0) {
    redirect(`/projects/${projectId}?construction_admin_error=${encodeURIComponent('Project has no disciplines.')}`)
  }

  try {
    await addConstructionAdminFoldersUnderProject(supabase, {
      projectFolderId: project.google_drive_folder_id,
      disciplineValues: disciplines,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Drive API error.'
    redirect(`/projects/${projectId}?construction_admin_error=${encodeURIComponent(msg)}`)
  }

  const { error } = await supabase
    .from('projects')
    .update({ drive_construction_admin_created: true })
    .eq('id', projectId)

  if (error) {
    redirect(`/projects/${projectId}?construction_admin_error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/projects')
  revalidateTag('projects')
  redirect(`/projects/${projectId}`)
}

export async function markProjectProblematic(
  projectId: string,
  isProblematic: boolean,
  note?: string | null,
) {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  const project = await getProjectById(projectId)
  if (!project) throw new Error('Project not found.')
  if (project.status === 'pending_approval' || project.status === 'rejected') {
    throw new Error(MUTATION_FORBIDDEN)
  }

  const gate = await ensureProjectOperationalMutation(profile, projectId)
  if ('error' in gate) throw new Error(gate.error)

  const trimmed = typeof note === 'string' ? note.trim() : ''
  const { error } = await supabase
    .from('projects')
    .update({
      is_problematic: isProblematic,
      problem_note: isProblematic && trimmed ? trimmed : null,
    })
    .eq('id', projectId)

  if (error) throw new Error(error.message)
  revalidatePath('/projects')
  revalidatePath(`/projects/${projectId}`)
  revalidateTag('dashboard')
  revalidateTag('projects')
}
