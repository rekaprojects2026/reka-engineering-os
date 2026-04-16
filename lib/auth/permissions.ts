/**
 * lib/auth/permissions.ts
 * Pure role-predicate and nav-permission helpers.
 * Safe to import from both server components AND client components
 * because this file has zero server-only dependencies.
 */

import type { SystemRole } from '@/types/database'

// ── Role predicates ──────────────────────────────────────────

export function effectiveRole(role: SystemRole | null | undefined): SystemRole {
  return role ?? 'member'
}

export function isAdmin(role: SystemRole | null | undefined): boolean {
  return effectiveRole(role) === 'admin'
}

export function isCoordinator(role: SystemRole | null | undefined): boolean {
  return effectiveRole(role) === 'coordinator'
}

export function isReviewer(role: SystemRole | null | undefined): boolean {
  return effectiveRole(role) === 'reviewer'
}

export function isMember(role: SystemRole | null | undefined): boolean {
  return effectiveRole(role) === 'member'
}

export function isAdminOrCoordinator(role: SystemRole | null | undefined): boolean {
  const r = effectiveRole(role)
  return r === 'admin' || r === 'coordinator'
}

// ── Route / CTA surface (Stage RBAC-02) ──────────────────────
// Pure predicates aligned to docs/ROLE_PERMISSION_HARDENING_BRIEFING.md
// Server-side mutation checks are deferred to Stage RBAC-03.

/** Global “New Project” — admin only (coordinators do not create org-wide projects). */
export function canAccessProjectsNewRoute(role: SystemRole | null | undefined): boolean {
  return effectiveRole(role) === 'admin'
}

/** /tasks/new, /deliverables/new, /files/new — coordinators may create in scope; route still guarded separately on project hub. */
export function canAccessTasksDeliverablesFilesNewRoute(role: SystemRole | null | undefined): boolean {
  return isAdminOrCoordinator(role)
}

/** Primary list/header CTAs for adding file metadata (same as new-route gate). */
export function canShowFilesAddButton(role: SystemRole | null | undefined): boolean {
  return isAdminOrCoordinator(role)
}

// ── Nav visibility + labelling helpers ───────────────────────

export type NavPermissions = {
  showClients:      boolean
  showIntakes:      boolean
  showTeam:         boolean
  showCompensation: boolean
  showPayments:     boolean
  showSettings:     boolean
  showMyPayments:   boolean
  /** Label overrides for roles that see a personal scope */
  labelProjects:     string
  labelTasks:        string
  labelDeliverables: string
  labelFiles:        string
  labelDashboard:    string
}

export function getNavPermissions(role: SystemRole | null | undefined): NavPermissions {
  const r = effectiveRole(role)
  const personal = r === 'member'

  return {
    showClients:      r === 'admin' || r === 'coordinator',
    showIntakes:      r === 'admin' || r === 'coordinator',
    showTeam:         r === 'admin',
    showCompensation: r === 'admin',
    showPayments:     r === 'admin',
    showSettings:     r === 'admin',
    showMyPayments:   r === 'member' || r === 'reviewer',

    labelDashboard:    personal ? 'My Dashboard'    : 'Dashboard',
    labelProjects:     personal ? 'My Projects'     : 'Projects',
    labelTasks:        personal ? 'My Tasks'        : 'Tasks',
    labelDeliverables: personal ? 'My Deliverables' : 'Deliverables',
    labelFiles:        personal ? 'My Files'        : 'Files',
  }
}
