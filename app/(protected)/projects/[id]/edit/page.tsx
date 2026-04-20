import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { ProjectForm } from '@/components/modules/projects/ProjectForm'
import { getSessionProfile } from '@/lib/auth/session'
import { requireProjectMetadataEdit, requireProjectView } from '@/lib/auth/access-surface'
import { getProjectById } from '@/lib/projects/queries'
import { effectiveRole } from '@/lib/auth/permissions'
import { getClientsForCoordinatorScopedSelect, getClientsForSelect } from '@/lib/clients/queries'
import { getUsersForProjectAssignment, getUsersForSelect } from '@/lib/users/queries'
import { getSettingOptions } from '@/lib/settings/queries'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const project = await getProjectById(id)
  return { title: project ? `Edit ${project.name} — ReKa Engineering OS` : 'Project not found — ReKa Engineering OS' }
}

export default async function EditProjectPage({ params }: PageProps) {
  const { id } = await params
  const profile = await getSessionProfile()
  const r = effectiveRole(profile.system_role)
  const [project, clients, users, disciplineOptions, projectTypeOptions] = await Promise.all([
    getProjectById(id),
    r === 'coordinator' ? getClientsForCoordinatorScopedSelect(profile.id) : getClientsForSelect(),
    r === 'coordinator' ? getUsersForProjectAssignment(id) : getUsersForSelect(),
    getSettingOptions('discipline'),
    getSettingOptions('project_type'),
  ])

  if (!project) notFound()
  await requireProjectView(profile, project)
  await requireProjectMetadataEdit(profile, project)

  return (
    <div>
      <PageHeader
        title={`Edit: ${project.name}`}
        subtitle={`${project.project_code}`}
      />
      <SectionCard className="overflow-visible">
        <ProjectForm mode="edit" project={project} clients={clients} users={users} disciplineOptions={disciplineOptions} projectTypeOptions={projectTypeOptions} />
      </SectionCard>
    </div>
  )
}
