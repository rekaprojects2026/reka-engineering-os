import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { TaskForm } from '@/components/modules/tasks/TaskForm'
import { getSessionProfile } from '@/lib/auth/session'
import { requireTaskEditPage } from '@/lib/auth/access-surface'
import { getTaskById } from '@/lib/tasks/queries'
import { projectOptionsForMutationForms } from '@/lib/auth/query-scope'
import { getUsersForSelect } from '@/lib/users/queries'
import { getSettingOptions } from '@/lib/settings/queries'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const task = await getTaskById(id)
  return { title: task ? `Edit ${task.title} — Engineering Agency OS` : 'Task Not Found' }
}

export default async function EditTaskPage({ params }: PageProps) {
  const { id } = await params
  const profile = await getSessionProfile()
  const task = await getTaskById(id)
  if (!task) notFound()
  await requireTaskEditPage(profile, task)

  const [projectsRaw, users, taskCategoryOptions] = await Promise.all([
    projectOptionsForMutationForms(profile, task.project_id),
    getUsersForSelect(),
    getSettingOptions('task_category'),
  ])

  const projects = projectsRaw.map(p => ({ id: p.id, name: p.name, project_code: p.project_code }))

  return (
    <div>
      <PageHeader
        title={`Edit: ${task.title}`}
        subtitle={task.projects ? `${task.projects.project_code}` : ''}
      />
      <SectionCard>
        <TaskForm mode="edit" task={task} projects={projects} users={users} taskCategoryOptions={taskCategoryOptions} />
      </SectionCard>
    </div>
  )
}
