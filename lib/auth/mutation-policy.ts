/**
 * Stage RBAC-03 — server-side mutation authorization helpers.
 * Used by server actions only.
 */

import { getSessionProfile, type SessionProfile } from '@/lib/auth/session'
import {
  canAccessExpenses,
  canOperateFinance,
  canProposeCompensation,
  isBD,
  isDirektur,
  isFinance,
  isFreelancer,
  isManajer,
  isManagement,
  isMember,
  isOpsLead,
  isTD,
} from '@/lib/auth/permissions'
import {
  userCanEditDeliverable,
  userCanEditFile,
  userCanEditProjectMetadata,
  userCanViewDeliverable,
  userCanViewFile,
  userCanViewProject,
  userCanViewTask,
} from '@/lib/auth/access-surface'
import { getProjectById, type ProjectWithRelations } from '@/lib/projects/queries'
import { getDeliverableById, type DeliverableWithRelations } from '@/lib/deliverables/queries'
import { getTaskById, type TaskWithRelations } from '@/lib/tasks/queries'
import type { FileWithRelations } from '@/lib/files/queries'

export const MUTATION_FORBIDDEN = 'You do not have permission to perform this action.'

export async function loadMutationProfile(): Promise<SessionProfile> {
  return getSessionProfile()
}

export function ensureFinanceOrDirektur(profile: SessionProfile): string | null {
  if (!isDirektur(profile.system_role) && !isFinance(profile.system_role)) return MUTATION_FORBIDDEN
  return null
}

export function ensureFinance(profile: SessionProfile): string | null {
  if (!isFinance(profile.system_role)) return MUTATION_FORBIDDEN
  return null
}

export function ensureTD(profile: SessionProfile): string | null {
  if (!isTD(profile.system_role)) return MUTATION_FORBIDDEN
  return null
}

export function ensureOpsLead(profile: SessionProfile): string | null {
  if (!isOpsLead(profile.system_role)) return MUTATION_FORBIDDEN
  return null
}

export function ensureManagement(profile: SessionProfile): string | null {
  if (!isManagement(profile.system_role)) return MUTATION_FORBIDDEN
  return null
}

export function ensureWorkLogMutation(profile: SessionProfile): string | null {
  const r = profile.system_role
  if (isMember(r) || isFreelancer(r) || isTD(r) || isDirektur(r) || isFinance(r)) return null
  return MUTATION_FORBIDDEN
}

export function ensureExpenseSubmitMutation(profile: SessionProfile): string | null {
  if (!canAccessExpenses(profile.system_role)) return MUTATION_FORBIDDEN
  return null
}

export function ensureExpenseReviewMutation(profile: SessionProfile): string | null {
  const r = profile.system_role
  if (isDirektur(r) || isTD(r) || isFinance(r)) return null
  return MUTATION_FORBIDDEN
}

export function ensureCanProposeCompensation(profile: SessionProfile): string | null {
  if (!canProposeCompensation(profile.system_role)) return MUTATION_FORBIDDEN
  return null
}

export function ensureCanConfirmCompensation(profile: SessionProfile): string | null {
  if (!canOperateFinance(profile.system_role)) return MUTATION_FORBIDDEN
  return null
}

/** @deprecated Prefer ensureManagement() */
export function ensureAdmin(profile: SessionProfile): string | null {
  return ensureManagement(profile)
}

/** @deprecated Prefer ensureOpsLead() or ensureManagement() */
export function ensureAdminOrCoordinator(profile: SessionProfile): string | null {
  if (!isManagement(profile.system_role) && !isOpsLead(profile.system_role)) {
    return MUTATION_FORBIDDEN
  }
  return null
}

export async function ensureProjectOperationalMutation(
  profile: SessionProfile,
  projectId: string,
): Promise<{ error: string } | { project: ProjectWithRelations }> {
  const project = await getProjectById(projectId)
  if (!project) return { error: 'Project not found.' }
  if (project.status === 'pending_approval' || project.status === 'rejected') {
    return { error: 'This project is not active for operational changes until it is approved.' }
  }
  if (!(await userCanEditProjectMetadata(profile, project))) return { error: MUTATION_FORBIDDEN }
  return { project }
}

export function ensureCreateProjectMutation(profile: SessionProfile): string | null {
  return ensureOpsLead(profile)
}

export function ensureClientMutation(profile: SessionProfile): string | null {
  const r = profile.system_role
  if (isBD(r) || isFinance(r) || isTD(r) || isDirektur(r)) return null
  return MUTATION_FORBIDDEN
}

export function ensureIntakeMutation(profile: SessionProfile): string | null {
  const r = profile.system_role
  if (isTD(r) || isManajer(r) || isBD(r)) return null
  return MUTATION_FORBIDDEN
}

export function ensureCompensationOrPaymentMutation(profile: SessionProfile): string | null {
  return ensureFinance(profile)
}

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

export async function ensureProjectTeamMutation(
  profile: SessionProfile,
  projectId: string,
): Promise<{ error: string } | { project: ProjectWithRelations }> {
  const project = await getProjectById(projectId)
  if (!project) return { error: 'Project not found.' }
  if (project.status === 'pending_approval' || project.status === 'rejected') {
    return { error: 'Team changes are not allowed until the project is approved.' }
  }
  if (!(await userCanViewProject(profile, project))) return { error: MUTATION_FORBIDDEN }
  if (!(await userCanEditProjectMetadata(profile, project))) return { error: MUTATION_FORBIDDEN }
  return { project }
}

/** User may read/write comments on this task if they can view the task. */
export async function ensureCommentOnTask(
  profile: SessionProfile,
  taskId: string,
): Promise<{ error: string } | { task: TaskWithRelations }> {
  const task = await getTaskById(taskId)
  if (!task) return { error: 'Task not found.' }
  if (!(await userCanViewTask(profile, task))) return { error: MUTATION_FORBIDDEN }
  return { task }
}

/** User may read/write comments on this deliverable if they can view it. */
export async function ensureCommentOnDeliverable(
  profile: SessionProfile,
  deliverableId: string,
): Promise<{ error: string } | { d: DeliverableWithRelations }> {
  const d = await getDeliverableById(deliverableId)
  if (!d) return { error: 'Deliverable not found.' }
  if (!(await userCanViewDeliverable(profile, d))) return { error: MUTATION_FORBIDDEN }
  return { d }
}

/** Direktur-only mutations (API keys, webhooks, etc.). */
export function ensureDirekturMutation(profile: SessionProfile): string | null {
  if (!isDirektur(profile.system_role)) return MUTATION_FORBIDDEN
  return null
}
