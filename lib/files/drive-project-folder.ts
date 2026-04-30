import type { SupabaseClient } from '@supabase/supabase-js'
import { SOURCE_PLATFORMS } from '@/lib/constants/options'
import { buildRekaDriveFolderName } from '@/lib/files/drive-service'
import {
  findOrCreateFolder,
  getWorkspaceDrive,
  shareDriveFolderWithEmails,
} from '@/lib/google/workspace-drive'
import { getDriveRootFolderName, getSettingOptions } from '@/lib/settings/queries'
import type { ProjectSourceType } from '@/types/database'

const PHASE_FOLDERS = [
  '01-Inisiasi',
  '02-Konsep',
  '03-Design-Development',
  '04-Construction-Document',
  '05-Rendering',
] as const

export const CONSTRUCTION_ADMIN_FOLDER_NAME = '06-Construction-Admin'

function sourcePlatformFolderLabel(source: string): string {
  const row = SOURCE_PLATFORMS.find((o) => o.value === source)
  return row?.label ?? source.charAt(0).toUpperCase() + source.slice(1)
}

function sourceTypeFolderLabel(sourceType: ProjectSourceType): string {
  return sourceType === 'DOMESTIC' ? 'Domestic' : 'Platform'
}

function sanitizeFolderSegment(s: string): string {
  const t = s.replace(/[/\\?*:|"<>]/g, '-').trim()
  return t || 'Discipline'
}

async function disciplineFolderNames(
  supabase: SupabaseClient,
  disciplineValues: string[],
): Promise<string[]> {
  const opts = await getSettingOptions('discipline', supabase)
  const labelBy = new Map(opts.map((o) => [o.value, o.label]))
  return disciplineValues.map((v) => {
    const label = labelBy.get(v)
    if (label) return sanitizeFolderSegment(label)
    const words = v.replace(/_/g, ' ')
    return sanitizeFolderSegment(words.replace(/\b\w/g, (c) => c.toUpperCase()))
  })
}

/**
 * Builds full Drive hierarchy under the configured root folder.
 * Returns the innermost project folder id (REKA-…-YEAR).
 */
export async function createProjectFolderHierarchy(params: {
  supabase: SupabaseClient
  rootFolderName: string
  sourceType: ProjectSourceType
  source: string
  projectFolderName: string
  disciplineValues: string[]
}): Promise<string | null> {
  const ws = await getWorkspaceDrive(params.supabase)
  if (!ws) return null

  const { drive } = ws
  const rootId = await findOrCreateFolder(drive, params.rootFolderName, null)
  const typeId = await findOrCreateFolder(drive, sourceTypeFolderLabel(params.sourceType), rootId)
  const sourceId = await findOrCreateFolder(drive, sourcePlatformFolderLabel(params.source), typeId)
  const projectFolderId = await findOrCreateFolder(drive, params.projectFolderName, sourceId)

  const discNames = await disciplineFolderNames(params.supabase, params.disciplineValues)
  for (let i = 0; i < params.disciplineValues.length; i++) {
    const folderName = discNames[i]!
    const dRoot = await findOrCreateFolder(drive, folderName, projectFolderId)
    for (const phase of PHASE_FOLDERS) {
      await findOrCreateFolder(drive, phase, dRoot)
    }
  }

  return projectFolderId
}

/**
 * Best-effort: create Google Drive hierarchy for a new project when OAuth is configured and drive_mode is auto.
 */
/** Resolve emails (google_email ?? email) for project lead, reviewer, and team rows. */
export async function collectProjectMemberShareEmails(
  supabase: SupabaseClient,
  opts: {
    projectId: string
    leadUserId: string
    reviewerUserId: string | null
  },
): Promise<string[]> {
  const ids = new Set<string>()
  ids.add(opts.leadUserId)
  if (opts.reviewerUserId) ids.add(opts.reviewerUserId)

  const { data: assigns } = await supabase
    .from('project_team_assignments')
    .select('user_id')
    .eq('project_id', opts.projectId)

  for (const row of assigns ?? []) {
    if (row.user_id) ids.add(row.user_id)
  }

  if (ids.size === 0) return []

  const { data: profs } = await supabase
    .from('profiles')
    .select('email, google_email')
    .in('id', [...ids])

  const emails: string[] = []
  for (const p of profs ?? []) {
    const g = (p.google_email as string | null | undefined)?.trim()
    const e = (p.email as string | undefined)?.trim()
    const pick = g || e
    if (pick) emails.push(pick)
  }
  return emails
}

export async function tryCreateProjectDriveFolderAfterInsert(
  supabase: SupabaseClient,
  params: {
    projectId: string
    projectCode: string
    clientId: string
    sourceType: ProjectSourceType
    source: string
    disciplines: string[]
    driveMode: 'auto' | 'manual' | 'none'
    memberEmails?: string[]
  },
): Promise<void> {
  if (params.driveMode !== 'auto') return
  if (params.disciplines.length === 0) return

  try {
    const rootFolderName = await getDriveRootFolderName(supabase)
    const { data: client } = await supabase.from('clients').select('client_code').eq('id', params.clientId).maybeSingle()
    const clientCode = (client?.client_code as string | undefined)?.trim() || 'CLIENT'
    const projectFolderName = buildRekaDriveFolderName({
      clientCode,
      projectCode: params.projectCode || 'PROJ',
    })

    const projectFolderId = await createProjectFolderHierarchy({
      supabase,
      rootFolderName,
      sourceType: params.sourceType,
      source: params.source,
      projectFolderName,
      disciplineValues: params.disciplines,
    })

    if (!projectFolderId) return

    const link = `https://drive.google.com/drive/folders/${projectFolderId}`
    await supabase
      .from('projects')
      .update({
        google_drive_folder_id: projectFolderId,
        google_drive_folder_link: link,
      })
      .eq('id', params.projectId)

    if (params.memberEmails && params.memberEmails.length > 0) {
      const ws = await getWorkspaceDrive(supabase)
      if (ws) {
        await shareDriveFolderWithEmails(ws.drive, projectFolderId, params.memberEmails)
      }
    }
  } catch (err) {
    console.error('[Google Drive] Failed to create folder hierarchy:', err)
  }
}

/** Adds `06-Construction-Admin` under each discipline folder inside the project Drive folder. */
export async function addConstructionAdminFoldersUnderProject(
  supabase: SupabaseClient,
  params: { projectFolderId: string; disciplineValues: string[] },
): Promise<void> {
  const ws = await getWorkspaceDrive(supabase)
  if (!ws) throw new Error('Google Drive is not connected.')

  const { drive } = ws
  const discNames = await disciplineFolderNames(supabase, params.disciplineValues)
  for (const folderName of discNames) {
    const dRoot = await findOrCreateFolder(drive, folderName, params.projectFolderId)
    await findOrCreateFolder(drive, CONSTRUCTION_ADMIN_FOLDER_NAME, dRoot)
  }
}
