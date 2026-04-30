import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { TaskForm } from '@/components/modules/tasks/TaskForm'
import { getSessionProfile } from '@/lib/auth/session'
import { requireTaskEditPage } from '@/lib/auth/access-surface'
import { getTaskById } from '@/lib/tasks/queries'
import { projectOptionsForMutationForms, usersForAssignmentPickers } from '@/lib/auth/query-scope'
import { getTaskEditFormScope } from '@/lib/auth/edit-form-scopes'
import { getSettingOptions } from '@/lib/settings/queries'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const task = await getTaskById(id)
  return { title: task ? `Edit ${task.title} — ReKa Engineering OS` : 'Task not found — ReKa Engineering OS' }
}

export default async function EditTaskPage({ params }: PageProps) {
  const { id } = await params
  const profile = await getSessionProfile()
  const task = await getTaskById(id)
  if (!task) notFound()
  await requireTaskEditPage(profile, task)

  const taskEditScope = getTaskEditFormScope(profile, task)

  const [projectsRaw, users, taskCategoryOptions] = await Promise.all([
    projectOptionsForMutationForms(profile, task.project_id),
    taskEditScope === 'full'
      ? usersForAssignmentPickers(profile, { mode: 'edit', lockedProjectId: task.project_id })
      : Promise.resolve([]),
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
        <TaskForm
          mode="edit"
          task={task}
          projects={projects}
          users={users}
          taskCategoryOptions={taskCategoryOptions}
          taskEditScope={taskEditScope}
        />
      </SectionCard>
    </div>
  )
}
