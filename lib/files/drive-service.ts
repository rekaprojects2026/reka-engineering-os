/**
 * Google Drive Service — Scaffold
 *
 * This module provides the interface and placeholder implementation
 * for Google Drive integration. No live API calls are made yet.
 *
 * When Google Drive integration is ready, implement:
 * 1. OAuth flow (server-side token exchange)
 * 2. Google Picker integration (client-side file selection)
 * 3. Drive API calls (list, metadata, permissions)
 *
 * Required environment variables (not yet needed):
 *   GOOGLE_CLIENT_ID
 *   GOOGLE_CLIENT_SECRET
 *   GOOGLE_REDIRECT_URI
 *   GOOGLE_API_KEY (for Picker)
 *
 * @see https://developers.google.com/drive/api/v3/about-sdk
 */

// ─── Types ────────────────────────────────────────────────────

export interface DriveFileMetadata {
  id: string
  name: string
  mimeType: string
  webViewLink: string
  iconLink?: string
  parents?: string[]
  modifiedTime?: string
  size?: string
}

export interface DriveServiceConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  apiKey: string
}

// ─── Service Interface ────────────────────────────────────────

export interface IDriveService {
  isConfigured(): boolean
  getFileMetadata(fileId: string): Promise<DriveFileMetadata | null>
  listFolderContents(folderId: string): Promise<DriveFileMetadata[]>
}

// ─── Scaffold Implementation ──────────────────────────────────

export class DriveService implements IDriveService {
  private config: DriveServiceConfig | null = null

  constructor() {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = process.env.GOOGLE_REDIRECT_URI
    const apiKey = process.env.GOOGLE_API_KEY

    if (clientId && clientSecret && redirectUri && apiKey) {
      this.config = { clientId, clientSecret, redirectUri, apiKey }
    }
  }

  /**
   * Check if Google Drive credentials are configured.
   * Returns false until env vars are set.
   */
  isConfigured(): boolean {
    return this.config !== null
  }

  /**
   * Placeholder: Fetch file metadata from Drive API.
   * Not implemented until OAuth is ready.
   */
  async getFileMetadata(_fileId: string): Promise<DriveFileMetadata | null> {
    if (!this.isConfigured()) return null
    // TODO: Implement with googleapis library
    // const drive = google.drive({ version: 'v3', auth: oauthClient })
    // const res = await drive.files.get({ fileId, fields: '...' })
    return null
  }

  /**
   * Placeholder: List contents of a Drive folder.
   * Not implemented until OAuth is ready.
   */
  async listFolderContents(_folderId: string): Promise<DriveFileMetadata[]> {
    if (!this.isConfigured()) return []
    // TODO: Implement with googleapis library
    return []
  }
}

// Singleton instance
export const driveService = new DriveService()

// ─── Drive folder naming (manual copy / paste; no API) ─────────

/**
 * Suggested Google Drive folder name for a project (clipboard helper).
 * Format: `REKA-[CLIENT_CODE]-[PROJECT_CODE]-[YEAR]` (e.g. REKA-PT001-PRJ042-2026).
 * `year` defaults to the current calendar year when omitted.
 */
export function buildRekaDriveFolderName(params: {
  clientCode: string
  projectCode: string
  year?: number
}): string {
  const y = params.year ?? new Date().getFullYear()
  const sanitize = (raw: string) => {
    const t = raw.replace(/[^a-zA-Z0-9_-]+/g, '').toUpperCase()
    return t || 'UNKNOWN'
  }
  return `REKA-${sanitize(params.clientCode)}-${sanitize(params.projectCode)}-${y}`
}

/** Extract folder id from a Google Drive folder URL, if possible. */
export function extractGoogleDriveFolderIdFromUrl(url: string): string | null {
  const t = url.trim()
  const m1 = t.match(/\/folders\/([a-zA-Z0-9_-]+)/)
  if (m1?.[1]) return m1[1]
  const m2 = t.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  return m2?.[1] ?? null
}
