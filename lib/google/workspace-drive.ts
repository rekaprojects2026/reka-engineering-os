import type { SupabaseClient } from '@supabase/supabase-js'
import { google } from 'googleapis'
import type { drive_v3 } from 'googleapis'

function oauthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!clientId || !clientSecret || !appUrl) return null
  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    `${appUrl.replace(/\/$/, '')}/api/integrations/google/oauth/callback`,
  )
}

/** Escape a literal for use inside Google Drive `q` query strings. */
export function escapeDriveQueryLiteral(name: string): string {
  return name.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

export async function getWorkspaceDrive(supabase: SupabaseClient): Promise<{ drive: drive_v3.Drive } | null> {
  const oauth2 = oauthClient()
  if (!oauth2) return null

  const { data: row } = await supabase.from('google_workspace_tokens').select('*').eq('id', 'default').maybeSingle()
  if (!row?.refresh_token) return null

  oauth2.setCredentials({
    refresh_token: row.refresh_token as string,
    access_token: (row.access_token as string) || undefined,
    expiry_date: row.expires_at ? new Date(row.expires_at as string).getTime() : undefined,
  })

  const drive = google.drive({ version: 'v3', auth: oauth2 })
  return { drive }
}

/**
 * Creates a Drive folder at My Drive root when workspace tokens exist. Returns null if Drive is not connected.
 * @deprecated Prefer findOrCreateFolder + hierarchy for new projects.
 */
export async function createDriveFolderForProject(
  supabase: SupabaseClient,
  folderName: string,
): Promise<{ id: string; webViewLink?: string | null } | null> {
  const client = await getWorkspaceDrive(supabase)
  if (!client) return null

  const res = await client.drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    },
    fields: 'id, webViewLink',
  })

  const id = res.data.id
  if (!id) return null
  return { id, webViewLink: res.data.webViewLink }
}

/**
 * Find a folder by exact name under parent (or at My Drive root when parentId is null).
 * If missing, creates it. Returns folder ID.
 */
export async function findOrCreateFolder(
  drive: drive_v3.Drive,
  name: string,
  parentId: string | null,
): Promise<string> {
  const safeName = escapeDriveQueryLiteral(name)
  const parentClause = parentId
    ? `'${escapeDriveQueryLiteral(parentId)}' in parents`
    : `'root' in parents`
  const q = `name = '${safeName}' and ${parentClause} and mimeType = 'application/vnd.google-apps.folder' and trashed = false`

  const listRes = await drive.files.list({
    q,
    fields: 'files(id)',
    pageSize: 1,
    supportsAllDrives: false,
  })

  const existing = listRes.data.files?.[0]?.id
  if (existing) return existing

  const created = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      ...(parentId ? { parents: [parentId] } : {}),
    },
    fields: 'id',
  })

  const id = created.data.id
  if (!id) throw new Error('Drive folder create returned no id')
  return id
}

/**
 * Share a Drive folder with a user by email (reader or writer). Fails silently (logs only).
 */
export async function shareDriveFolderWithEmail(
  drive: drive_v3.Drive,
  folderId: string,
  email: string,
  role: 'reader' | 'writer' = 'writer',
): Promise<void> {
  const trimmed = email.trim().toLowerCase()
  if (!trimmed) return
  try {
    await drive.permissions.create({
      fileId: folderId,
      requestBody: {
        type: 'user',
        role,
        emailAddress: trimmed,
      },
      sendNotificationEmail: false,
    })
  } catch (err) {
    console.error(`[Drive] Failed to share folder ${folderId} with ${trimmed}:`, err)
  }
}

/** Share a folder with many emails in parallel. */
export async function shareDriveFolderWithEmails(
  drive: drive_v3.Drive,
  folderId: string,
  emails: string[],
  role: 'reader' | 'writer' = 'writer',
): Promise<void> {
  const unique = [...new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean))]
  if (unique.length === 0) return
  await Promise.allSettled(unique.map((email) => shareDriveFolderWithEmail(drive, folderId, email, role)))
}
