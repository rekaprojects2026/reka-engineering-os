'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { isDirektur, isManajer, isTD } from '@/lib/auth/permissions'
import type { SystemRole } from '@/types/database'
import {
  ensureProjectOperationalMutation,
  loadMutationProfile,
  MUTATION_FORBIDDEN,
} from '@/lib/auth/mutation-policy'

function canManagePortalRole(role: SystemRole | null): boolean {
  return isDirektur(role) || isTD(role) || isManajer(role)
}

export async function createClientPortalToken(input: {
  projectId: string
  label?: string
  expiresAt?: string | null
}): Promise<{ ok: true; token: string } | { error: string }> {
  const profile = await loadMutationProfile()
  const supabase = await createServerClient()

  if (!canManagePortalRole(profile.system_role)) return { error: MUTATION_FORBIDDEN }

  const gate = await ensureProjectOperationalMutation(profile, input.projectId)
  if ('error' in gate) return { error: gate.error }

  const { data, error } = await supabase
    .from('client_portal_tokens')
    .insert({
      project_id: input.projectId,
      label: input.label?.trim() || null,
      expires_at: input.expiresAt?.trim() || null,
      created_by: profile.id,
    })
    .select('token')
    .single()

  if (error || !data) return { error: error?.message ?? 'Insert failed' }
  revalidatePath(`/projects/${input.projectId}`)
  return { ok: true, token: data.token as string }
}

export async function setClientPortalTokenActive(input: {
  id: string
  projectId: string
  isActive: boolean
}): Promise<{ ok: true } | { error: string }> {
  const profile = await loadMutationProfile()
  const supabase = await createServerClient()

  if (!canManagePortalRole(profile.system_role)) return { error: MUTATION_FORBIDDEN }

  const gate = await ensureProjectOperationalMutation(profile, input.projectId)
  if ('error' in gate) return { error: gate.error }

  const { error } = await supabase
    .from('client_portal_tokens')
    .update({ is_active: input.isActive })
    .eq('id', input.id)
    .eq('project_id', input.projectId)

  if (error) return { error: error.message }
  revalidatePath(`/projects/${input.projectId}`)
  return { ok: true }
}
