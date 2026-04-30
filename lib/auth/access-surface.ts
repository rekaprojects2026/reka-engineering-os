/**
 * Stage RBAC-02 — server-only helpers for page/route and coarse entity access.
 * Import only from Server Components / server actions; not safe for client bundles.
 */

import { redirect } from 'next/navigation'
import {
  isBD,
  isDirektur,
  isFreelancer,
  isManagement,
  isManajer,
  isMember,
  isOpsLead,
  isSenior,
  isTD,
} from '@/lib/auth/permissions'
import type { SessionProfile } from '@/lib/auth/session'
import {
  getProjectById,
  isUserAssignedToProject,
  type ProjectWithRelations,
} from '@/lib/projects/queries'
import type { TaskWithRelations } from '@/lib/tasks/queries'
import type { DeliverableWithRelations } from '@/lib/deliverables/queries'
import type { FileWithRelations } from '@/lib/files/queries'

/** No tasks/deliverables/files edits while waiting on Direktur or after rejection (until re-approved). */
function isProjectOperationalFrozen(status: string): boolean {
  return status === 'pending_approval' || status === 'rejected'
}

// ── New-route gates (no DB) ─────────────────────────────────

export function requireProjectsNewPageAccess(role: SessionProfile['system_role']): void {
  if (!isOpsLead(role)) redirect('/access-denied')
}

export function requireTasksDeliverablesFilesNewPageAccess(role: SessionProfile['system_role']): void {
  if (!isManagement(role) && !isOpsLead(role)) redirect('/access-denied')
}

// ── Project ───────────────────────────────────────────────────

export async function userCanViewProject(
  profile: SessionProfile,
  project: ProjectWithRelations,
): Promise<boolean> {
  if (isManagement(profile.system_role)) return true
  if (isBD(profile.system_role)) return true
  if (project.reviewer_user_id === profile.id) return true
  if (project.project_lead_user_id === profile.id) return true
  if (await isUserAssignedToProject(profile.id, project.id)) return true
  return false
}

export async function userCanEditProjectMetadata(
  profile: SessionProfile,
  project: ProjectWithRelations,
): Promise<boolean> {
  const st = project.status

  if (st === 'pending_approval') {
    return isDirektur(profile.system_role)
  }

  if (st === 'rejected') {
    if (isDirektur(profile.system_role)) return true
    if (isTD(profile.system_role)) return true
    if (isManajer(profile.system_role)) {
      if (project.project_lead_user_id === profile.id) return true
      return isUserAssignedToProject(profile.id, project.id)
    }
    return false
  }

  if (isTD(profile.system_role)) return true
  if (!isManajer(profile.system_role)) return false
  if (project.project_lead_user_id === profile.id) return true
  return isUserAssignedToProject(profile.id, project.id)
}

export async function requireProjectView(profile: SessionProfile, project: ProjectWithRelations): Promise<void> {
  if (!(await userCanViewProject(profile, project))) redirect('/access-denied')
}

export async function requireProjectMetadataEdit(
  profile: SessionProfile,
  project: ProjectWithRelations,
): Promise<void> {
  if (!(await userCanEditProjectMetadata(profile, project))) redirect('/access-denied')
}

// ── Task ─────────────────────────────────────────────────────

export async function userCanViewTask(profile: SessionProfile, task: TaskWithRelations): Promise<boolean> {
  if (isManagement(profile.system_role)) return true
  if (task.assigned_to_user_id === profile.id) return true
  if (task.reviewer_user_id === profile.id) return true
  const project = await getProjectById(task.project_id)
  if (!project) return false
  return userCanViewProject(profile, project)
}

export async function userCanEditTask(
  profile: SessionProfile,
  task: TaskWithRelations,
): Promise<boolean> {
  const project = await getProjectById(task.project_id)
  if (!project) return false
  if (isProjectOperationalFrozen(project.status)) return false

  if (isManagement(profile.system_role)) return true
  if (task.assigned_to_user_id === profile.id) return true
  if (task.reviewer_user_id === profile.id) return true
  if (isManajer(profile.system_role)) {
    return userCanEditProjectMetadata(profile, project)
  }
  return false
}

export async function requireTaskView(profile: SessionProfile, task: TaskWithRelations): Promise<void> {
  if (!(await userCanViewTask(profile, task))) redirect('/access-denied')
}

export async function requireTaskEditPage(profile: SessionProfile, task: TaskWithRelations): Promise<void> {
  if (!(await userCanEditTask(profile, task))) redirect('/access-denied')
}

// ── Deliverable ───────────────────────────────────────────────

export async function userCanViewDeliverable(
  profile: SessionProfile,
  d: DeliverableWithRelations,
): Promise<boolean> {
  if (isManagement(profile.system_role)) return true
  if (d.prepared_by_user_id === profile.id) return true
  if (d.reviewed_by_user_id === profile.id) return true
  const project = await getProjectById(d.project_id)
  if (!project) return false
  return userCanViewProject(profile, project)
}

export async function userCanEditDeliverable(
  profile: SessionProfile,
  d: DeliverableWithRelations,
): Promise<boolean> {
  const project = await getProjectById(d.project_id)
  if (!project) return false
  if (isProjectOperationalFrozen(project.status)) return false

  if (isManagement(profile.system_role)) return true
  if (d.prepared_by_user_id === profile.id) return true
  if (isSenior(profile.system_role)) {
    if (d.reviewed_by_user_id === profile.id) return true
    if (project.reviewer_user_id === profile.id) return true
    return false
  }
  if (isManajer(profile.system_role)) {
    return userCanEditProjectMetadata(profile, project)
  }
  return false
}

export async function requireDeliverableView(
  profile: SessionProfile,
  d: DeliverableWithRelations,
): Promise<void> {
  if (!(await userCanViewDeliverable(profile, d))) redirect('/access-denied')
}

export async function requireDeliverableEditPage(
  profile: SessionProfile,
  d: DeliverableWithRelations,
): Promise<void> {
  if (!(await userCanEditDeliverable(profile, d))) redirect('/access-denied')
}

// ── File ─────────────────────────────────────────────────────

export async function userCanViewFile(profile: SessionProfile, f: FileWithRelations): Promise<boolean> {
  if (isManagement(profile.system_role)) return true
  const project = await getProjectById(f.project_id)
  if (!project) return false
  if (f.uploaded_by_user_id === profile.id) return true
  return userCanViewProject(profile, project)
}

export async function userCanEditFile(profile: SessionProfile, f: FileWithRelations): Promise<boolean> {
  const project = await getProjectById(f.project_id)
  if (!project) return false
  if (isProjectOperationalFrozen(project.status)) return false

  if (isManagement(profile.system_role)) return true
  if ((isMember(profile.system_role) || isFreelancer(profile.system_role)) && f.uploaded_by_user_id === profile.id) {
    return true
  }
  if (isManajer(profile.system_role)) {
    return userCanEditProjectMetadata(profile, project)
  }
  return false
}

export async function requireFileView(profile: SessionProfile, f: FileWithRelations): Promise<void> {
  if (!(await userCanViewFile(profile, f))) redirect('/access-denied')
}

export async function requireFileEditPage(profile: SessionProfile, f: FileWithRelations): Promise<void> {
  if (!(await userCanEditFile(profile, f))) redirect('/access-denied')
}
