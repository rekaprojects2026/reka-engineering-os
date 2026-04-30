export const API_KEY_SCOPES = [
  'projects:read',
  'tasks:read',
  'invoices:read',
  'clients:read',
] as const

export type ApiKeyScope = (typeof API_KEY_SCOPES)[number]

export const API_KEY_SCOPE_LABELS: Record<ApiKeyScope, string> = {
  'projects:read': 'Projects (read)',
  'tasks:read': 'Tasks (read)',
  'invoices:read': 'Invoices (read)',
  'clients:read': 'Clients (read)',
}

export function isApiKeyScope(s: string): s is ApiKeyScope {
  return (API_KEY_SCOPES as readonly string[]).includes(s)
}
