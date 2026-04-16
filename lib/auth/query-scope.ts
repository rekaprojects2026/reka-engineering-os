/**
 * Stage RBAC-03 — scoped project lists for create/edit forms (dropdown data minimization).
 */

import { effectiveRole } from '@/lib/auth/permissions'
import type { SessionProfile } from '@/lib/auth/session'
import { userCanEditProjectMetadata, userCanViewProject } from '@/lib/auth/access-surface'
import { getProjectById, getProjects, type ProjectWithRelations } from '@/lib/projects/queries'

/**
 * Projects shown in task/deliverable/file forms.
 * - Admin: all projects
 * - Coordinator: assigned projects, or a single locked project if they may operate on it
 * - Other roles (edit pages): only the locked project when the user may view it
 */
export async function projectOptionsForMutationForms(
  profile: SessionProfile,
  lockedProjectId?: string | null,
): Promise<ProjectWithRelations[]> {
  const r = effectiveRole(profile.system_role)
  if (r === 'admin') return getProjects()

  if (r === 'coordinator') {
    if (lockedProjectId) {
      const p = await getProjectById(lockedProjectId)
      if (!p) return []
      if (!(await userCanEditProjectMetadata(profile, p))) return []
      return [p]
    }
    return getProjects({ assignedUserId: profile.id })
  }

  if (lockedProjectId) {
    const p = await getProjectById(lockedProjectId)
    if (!p) return []
    if (!(await userCanViewProject(profile, p))) return []
    return [p]
  }

  return []
}
