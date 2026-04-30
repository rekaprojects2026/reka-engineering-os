/**
 * Stage RBAC-03 — scoped project lists for create/edit forms (dropdown data minimization).
 */

import { effectiveRole, isManagement, isManajer } from '@/lib/auth/permissions'
import type { SessionProfile } from '@/lib/auth/session'
import { userCanEditProjectMetadata, userCanViewProject } from '@/lib/auth/access-surface'
import { getProjectById, getProjects, type ProjectWithRelations } from '@/lib/projects/queries'
import {
  getProjectMemberUsers,
  getUsersForCoordinatorProjectPortfolio,
  getUsersForSelect,
  type ProjectMemberUserRow,
  type UserSelectRow,
} from '@/lib/users/queries'

/**
 * Projects shown in task/deliverable/file forms.
 * - Management: all projects
 * - Manajer: assigned projects, or a single locked project when they may operate on it
 * - Other roles (edit pages): only the locked project when the user may view it
 */
export async function projectOptionsForMutationForms(
  profile: SessionProfile,
  lockedProjectId?: string | null,
): Promise<ProjectWithRelations[]> {
  const r = effectiveRole(profile.system_role)
  if (isManagement(profile.system_role)) return (await getProjects()).rows

  if (isManajer(r)) {
    if (lockedProjectId) {
      const p = await getProjectById(lockedProjectId)
      if (!p) return []
      if (!(await userCanEditProjectMetadata(profile, p))) return []
      return [p]
    }
    return (await getProjects({ assignedUserId: profile.id })).rows
  }

  if (lockedProjectId) {
    const p = await getProjectById(lockedProjectId)
    if (!p) return []
    if (!(await userCanViewProject(profile, p))) return []
    return [p]
  }

  return []
}

/**
 * Profiles for task/deliverable assignment dropdowns.
 * When `lockedProjectId` is set, only that project’s roster (team + lead + reviewer).
 * Otherwise: management sees all users; manajer sees portfolio union; others see all users.
 */
export async function usersForAssignmentPickers(
  profile: SessionProfile,
  opts: { mode: 'create' | 'edit'; lockedProjectId: string | null },
): Promise<UserSelectRow[] | ProjectMemberUserRow[]> {
  const r = effectiveRole(profile.system_role)
  if (opts.lockedProjectId) {
    return getProjectMemberUsers(opts.lockedProjectId)
  }
  if (isManagement(profile.system_role)) return getUsersForSelect()
  if (isManajer(r)) return getUsersForCoordinatorProjectPortfolio(profile.id)
  return getUsersForSelect()
}
