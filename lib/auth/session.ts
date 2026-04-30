/**
 * lib/auth/session.ts
 * Sprint 04A — Role-based access control foundation.
 *
 * Server-only helpers for reading the current user's system_role
 * and enforcing role-based access in server components and server actions.
 *
 * Pure role predicates and nav-permission helpers live in ./permissions.ts
 * so that client components can import them without pulling in server deps.
 * We re-export them here for convenience in server code.
 */

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import type { SystemRole } from '@/types/database'

// Re-export pure helpers so server-side callers can still import from this file
export {
  effectiveRole,
  isAdmin,
  isCoordinator,
  isReviewer,
  isMember,
  isAdminOrCoordinator,
  getNavPermissions,
  isDirektur,
  isOwner,
  isTD,
  isFinance,
  isManajer,
  isBD,
  isSenior,
  isFreelancer,
  isManagement,
  isOpsLead,
  isPersonalOnly,
  isIsolated,
  canAccessProjectsNewRoute,
  canAccessTasksDeliverablesFilesNewRoute,
} from './permissions'
export type { NavPermissions } from './permissions'

import { effectiveRole as _effectiveRole } from './permissions'

// ── Session profile type ─────────────────────────────────────

export type SessionProfile = {
  id: string
  full_name: string
  email: string
  system_role: SystemRole | null
  profile_completed_at: string | null
  photo_url: string | null
}

// ── Core session helper ──────────────────────────────────────

/**
 * Returns the authenticated user's lightweight profile.
 * Redirects to /auth/login if there is no active session.
 * Returns null system_role if profile row has no role set yet.
 */
export async function getSessionProfile(): Promise<SessionProfile> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, email, system_role, profile_completed_at, photo_url')
    .eq('id', user.id)
    .single()

  return {
    id:                   user.id,
    full_name:            data?.full_name ?? user.email?.split('@')[0] ?? 'User',
    email:                data?.email ?? user.email ?? '',
    system_role:          (data?.system_role as SystemRole | null) ?? null,
    profile_completed_at: data?.profile_completed_at ?? null,
    photo_url:            data?.photo_url ?? null,
  }
}

/**
 * Same profile shape as getSessionProfile, but for Route Handlers:
 * returns null when there is no session (no redirect).
 */
export async function getSessionProfileOptional(): Promise<SessionProfile | null> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, email, system_role, profile_completed_at, photo_url')
    .eq('id', user.id)
    .single()

  return {
    id:                   user.id,
    full_name:            data?.full_name ?? user.email?.split('@')[0] ?? 'User',
    email:                data?.email ?? user.email ?? '',
    system_role:          (data?.system_role as SystemRole | null) ?? null,
    profile_completed_at: data?.profile_completed_at ?? null,
    photo_url:            data?.photo_url ?? null,
  }
}

// ── Route protection helper ──────────────────────────────────

/**
 * Enforces that the current user's system_role is in the `allowed` list.
 * Redirects to /access-denied if not.
 *
 * Usage in a Server Component:
 *   const profile = await getSessionProfile()
 *   requireRole(profile.system_role, ['admin'])
 */
export function requireRole(
  role: SystemRole | null | undefined,
  allowed: SystemRole[],
): void {
  if (_effectiveRole(role) === 'owner') return
  if (!allowed.includes(_effectiveRole(role))) {
    redirect('/access-denied')
  }
}
