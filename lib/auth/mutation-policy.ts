/**
 * Stage RBAC-03 — server-side mutation authorization helpers.
 * Used by server actions only.
 */

import { getSessionProfile, type SessionProfile } from '@/lib/auth/session'
import { effectiveRole } from '@/lib/auth/permissions'
import {
  userCanEditDeliverable,
  userCanEditFile,
  userCanEditProjectMetadata,
  userCanViewDeliverable,
  userCanViewFile,
  userCanViewProject,
} from '@/lib/auth/access-surface'
import { getProjectById, type ProjectWithRelations } from '@/lib/projects/queries'
import type { DeliverableWithRelations } from '@/lib/deliverables/queries'
import type { FileWithRelations } from '@/lib/files/queries'

export const MUTATION_FORBIDDEN = 'You do not have permission to perform this action.'

export async function loadMutationProfile(): Promise<SessionProfile> {
  return getSessionProfile()
}

export function ensureAdmin(profile: SessionProfile): string | null {
  if (effectiveRole(profile.system_role) !== 'admin') return MUTATION_FORBIDDEN
  return null
}

export function ensureAdminOrCoordinator(profile: SessionProfile): string | null {
  const r = effectiveRole(profile.system_role)
  if (r !== 'admin' && r !== 'coordinator') return MUTATION_FORBIDDEN
  return null
}

/** Admin or coordinator who may operate on this project (tasks, deliverables, files, team roster). */
export async function ensureProjectOperationalMutation(
  profile: SessionProfile,
  projectId: string,
): Promise<{ error: string } | { project: ProjectWithRelations }> {
  const project = await getProjectById(projectId)
  if (!project) return { error: 'Project not found.' }
  if (!(await userCanEditProjectMetadata(profile, project))) return { error: MUTATION_FORBIDDEN }
  return { project }
}

/** Global project creation (createProject, intake conversion that creates a project). */
export function ensureCreateProjectMutation(profile: SessionProfile): string | null {
  if (effectiveRole(profile.system_role) !== 'admin') return MUTATION_FORBIDDEN
  return null
}

/** Client create/update — admin only (coordinators are read-only on clients in the approved matrix). */
export function ensureClientMutation(profile: SessionProfile): string | null {
  return ensureAdmin(profile)
}

/** Intake create/update — admin or coordinator. */
export function ensureIntakeMutation(profile: SessionProfile): string | null {
  return ensureAdminOrCoordinator(profile)
}

/** Compensation / payment mutations — admin only. */
export function ensureCompensationOrPaymentMutation(profile: SessionProfile): string | null {
  return ensureAdmin(profile)
}

/** View + edit deliverable for mutation (update body). */
export async function ensureDeliverableUpdateAccess(
  profile: SessionProfile,
  deliverableId: string,
  loader: (id: string) => Promise<DeliverableWithRelations | null>,
): Promise<{ error: string } | { d: DeliverableWithRelations }> {
  const d = await loader(deliverableId)
  if (!d) return { error: 'Deliverable not found.' }
  if (!(await userCanViewDeliverable(profile, d))) return { error: MUTATION_FORBIDDEN }
  if (!(await userCanEditDeliverable(profile, d))) return { error: MUTATION_FORBIDDEN }
  return { d }
}

/** View + edit file for mutation. */
export async function ensureFileUpdateAccess(
  profile: SessionProfile,
  fileId: string,
  loader: (id: string) => Promise<FileWithRelations | null>,
): Promise<{ error: string } | { f: FileWithRelations }> {
  const f = await loader(fileId)
  if (!f) return { error: 'File not found.' }
  if (!(await userCanViewFile(profile, f))) return { error: MUTATION_FORBIDDEN }
  if (!(await userCanEditFile(profile, f))) return { error: MUTATION_FORBIDDEN }
  return { f }
}

/** Project must exist and caller may attach team members. */
export async function ensureProjectTeamMutation(
  profile: SessionProfile,
  projectId: string,
): Promise<{ error: string } | { project: ProjectWithRelations }> {
  const project = await getProjectById(projectId)
  if (!project) return { error: 'Project not found.' }
  if (!(await userCanViewProject(profile, project))) return { error: MUTATION_FORBIDDEN }
  if (!(await userCanEditProjectMetadata(profile, project))) return { error: MUTATION_FORBIDDEN }
  return { project }
}
