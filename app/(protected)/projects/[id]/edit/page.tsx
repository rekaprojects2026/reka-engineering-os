import { notFound, redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { ProjectForm } from '@/components/modules/projects/ProjectForm'
import { getSessionProfile } from '@/lib/auth/session'
import { requireProjectMetadataEdit, requireProjectView } from '@/lib/auth/access-surface'
import { getProjectById } from '@/lib/projects/queries'
import { effectiveRole, isDirektur, isOpsLead } from '@/lib/auth/permissions'
import { getClientsForCoordinatorScopedSelect, getClientsForSelect } from '@/lib/clients/queries'
import { getUsersForProjectAssignment, getUsersForSelect } from '@/lib/users/queries'
import { getSettingOptions, isGoogleWorkspaceDriveConnected } from '@/lib/settings/queries'
import { getUsdToIdrRate } from '@/lib/fx/queries'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ mode?: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const project = await getProjectById(id)
  return { title: project ? `Edit ${project.name} — ReKa Engineering OS` : 'Project not found — ReKa Engineering OS' }
}

export default async function EditProjectPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { mode } = await searchParams
  const profile = await getSessionProfile()
  const r = effectiveRole(profile.system_role)
  const [project, clients, users, disciplineOptions, projectTypeOptions, fxRateToIDR, driveConnected] =
    await Promise.all([
      getProjectById(id),
      r === 'manajer' ? getClientsForCoordinatorScopedSelect(profile.id) : getClientsForSelect(),
      r === 'manajer' ? getUsersForProjectAssignment(id) : getUsersForSelect(),
      getSettingOptions('discipline'),
      getSettingOptions('project_type'),
      getUsdToIdrRate().catch(() => null as number | null),
      isGoogleWorkspaceDriveConnected(),
    ])

  if (!project) notFound()
  await requireProjectView(profile, project)

  const wantsResubmit = mode === 'resubmit'
  if (wantsResubmit) {
    if (project.status !== 'rejected' || !isOpsLead(profile.system_role)) {
      redirect(`/projects/${id}`)
    }
  }
  await requireProjectMetadataEdit(profile, project)

  const formMode = wantsResubmit ? 'resubmit' : 'edit'
  const direkturApproveFlow =
    !wantsResubmit && project.status === 'pending_approval' && isDirektur(profile.system_role)

  return (
    <div>
      <PageHeader
        title={
          formMode === 'resubmit'
            ? `Ajukan ulang: ${project.name}`
            : direkturApproveFlow
              ? `Setujui: ${project.name}`
              : `Edit: ${project.name}`
        }
        subtitle={`${project.project_code}`}
      />
      <SectionCard className="overflow-visible">
        <ProjectForm
          mode={formMode}
          direkturApproveFlow={direkturApproveFlow}
          project={project}
          clients={clients}
          users={users}
          disciplineOptions={disciplineOptions}
          projectTypeOptions={projectTypeOptions}
          fxRateToIDR={fxRateToIDR}
          driveConnected={driveConnected}
        />
      </SectionCard>
    </div>
  )
}
