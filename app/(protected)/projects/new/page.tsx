import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { ProjectForm } from '@/components/modules/projects/ProjectForm'
import { getSessionProfile } from '@/lib/auth/session'
import { requireProjectsNewPageAccess } from '@/lib/auth/access-surface'
import { getClientsForSelect } from '@/lib/clients/queries'
import { getUsersForSelect } from '@/lib/users/queries'
import { getSettingOptions } from '@/lib/settings/queries'

export const metadata = { title: 'New Project — Engineering Agency OS' }

export default async function NewProjectPage() {
  const profile = await getSessionProfile()
  requireProjectsNewPageAccess(profile.system_role)

  const [clients, users, disciplineOptions, projectTypeOptions] = await Promise.all([
    getClientsForSelect(),
    getUsersForSelect(),
    getSettingOptions('discipline'),
    getSettingOptions('project_type'),
  ])

  return (
    <div>
      <PageHeader
        title="New Project"
        subtitle="Create a new engineering project."
      />
      <SectionCard>
        <ProjectForm mode="create" clients={clients} users={users} disciplineOptions={disciplineOptions} projectTypeOptions={projectTypeOptions} />
      </SectionCard>
    </div>
  )
}
