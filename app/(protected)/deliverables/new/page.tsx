import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { DeliverableForm } from '@/components/modules/deliverables/DeliverableForm'
import { getSessionProfile } from '@/lib/auth/session'
import { requireTasksDeliverablesFilesNewPageAccess } from '@/lib/auth/access-surface'
import { getUsersForSelect } from '@/lib/users/queries'
import { getProjects } from '@/lib/projects/queries'
import { getTasksByProjectId } from '@/lib/tasks/queries'
import { getSettingOptions } from '@/lib/settings/queries'

export const metadata = { title: 'New Deliverable — Engineering Agency OS' }

interface PageProps {
  searchParams: Promise<{ project_id?: string }>
}

export default async function NewDeliverablePage({ searchParams }: PageProps) {
  const profile = await getSessionProfile()
  requireTasksDeliverablesFilesNewPageAccess(profile.system_role)

  const params = await searchParams
  const [projectsRaw, users, deliverableTypeOptions] = await Promise.all([
    getProjects(),
    getUsersForSelect(),
    getSettingOptions('deliverable_type'),
  ])

  const projects = projectsRaw.map(p => ({ id: p.id, name: p.name, project_code: p.project_code }))

  // If project_id provided, fetch tasks for that project
  const tasks = params.project_id
    ? (await getTasksByProjectId(params.project_id)).map(t => ({ id: t.id, title: t.title }))
    : []

  return (
    <div>
      <PageHeader
        title="New Deliverable"
        subtitle="Track a new project output."
      />
      <SectionCard>
        <DeliverableForm
          mode="create"
          projects={projects}
          users={users}
          tasks={tasks}
          defaultProjectId={params.project_id}
          deliverableTypeOptions={deliverableTypeOptions}
        />
      </SectionCard>
    </div>
  )
}
