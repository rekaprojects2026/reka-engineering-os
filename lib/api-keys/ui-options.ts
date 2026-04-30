import { API_KEY_SCOPES, API_KEY_SCOPE_LABELS } from '@/lib/api/scopes'

export function listScopeOptionsForUi(): { value: (typeof API_KEY_SCOPES)[number]; label: string }[] {
  return API_KEY_SCOPES.map((value) => ({ value, label: API_KEY_SCOPE_LABELS[value] }))
}
