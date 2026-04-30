/**
 * Stage RBAC-04 — edit-form scope labels for UI alignment with server mutation rules.
 * Safe to import from Server Components (no async DB reads).
 */

import type { SessionProfile } from '@/lib/auth/session'
import { effectiveRole, isManagement, isMember, isOpsLead, isSenior } from '@/lib/auth/permissions'
import type { Task } from '@/types/database'
import type { Deliverable } from '@/types/database'
import type { ProjectFile } from '@/types/database'

export type TaskEditFormScope = 'full' | 'reviewer' | 'assignee'

export function getTaskEditFormScope(profile: SessionProfile, task: Task): TaskEditFormScope {
  const r = effectiveRole(profile.system_role)
  if (isManagement(r) || isOpsLead(r)) return 'full'
  if (isSenior(r) && task.reviewer_user_id === profile.id) return 'reviewer'
  return 'assignee'
}

export type DeliverableEditFormScope = 'full' | 'reviewer' | 'preparer'

export function getDeliverableEditFormScope(
  profile: SessionProfile,
  d: Deliverable,
): DeliverableEditFormScope {
  const r = effectiveRole(profile.system_role)
  if (isManagement(r) || isOpsLead(r)) return 'full'
  if (isSenior(r)) return 'reviewer'
  if (isMember(r) && d.prepared_by_user_id === profile.id) return 'preparer'
  return 'preparer'
}

export type FileEditFormScope = 'full' | 'uploader'

export function getFileEditFormScope(profile: SessionProfile, file: ProjectFile): FileEditFormScope {
  const r = effectiveRole(profile.system_role)
  if (isManagement(r) || isOpsLead(r)) return 'full'
  return 'uploader'
}
