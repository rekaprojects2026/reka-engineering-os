import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { TaskForm } from '@/components/modules/tasks/TaskForm'
import { getSessionProfile } from '@/lib/auth/session'
import { requireTasksDeliverablesFilesNewPageAccess } from '@/lib/auth/access-surface'
import { getUsersForSelect } from '@/lib/users/queries'
import { getProjects } from '@/lib/projects/queries'
import { getSettingOptions } from '@/lib/settings/queries'

export const metadata = { title: 'New Task — Engineering Agency OS' }

interface PageProps {
  searchParams: Promise<{ project_id?: string }>
}

export default async function NewTaskPage({ searchParams }: PageProps) {
  const profile = await getSessionProfile()
  requireTasksDeliverablesFilesNewPageAccess(profile.system_role)

  const params = await searchParams
  const [projectsRaw, users, taskCategoryOptions] = await Promise.all([
    getProjects(),
    getUsersForSelect(),
    getSettingOptions('task_category'),
  ])

  const projects = projectsRaw.map(p => ({ id: p.id, name: p.name, project_code: p.project_code }))

  return (
    <div>
      <PageHeader
        title="New Task"
        subtitle="Create a new work item."
      />
      <SectionCard>
        <TaskForm
          mode="create"
          projects={projects}
          users={users}
          defaultProjectId={params.project_id}
          taskCategoryOptions={taskCategoryOptions}
        />
      </SectionCard>
    </div>
  )
}
