import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { DeliverableForm } from '@/components/modules/deliverables/DeliverableForm'
import { getDeliverableById } from '@/lib/deliverables/queries'
import { getProjects } from '@/lib/projects/queries'
import { getUsersForSelect } from '@/lib/users/queries'
import { getTasksByProjectId } from '@/lib/tasks/queries'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const d = await getDeliverableById(id)
  return { title: d ? `Edit ${d.name} — Engineering Agency OS` : 'Deliverable Not Found' }
}

export default async function EditDeliverablePage({ params }: PageProps) {
  const { id } = await params
  const [deliverable, projectsRaw, users] = await Promise.all([
    getDeliverableById(id),
    getProjects(),
    getUsersForSelect(),
  ])

  if (!deliverable) notFound()

  const projects = projectsRaw.map(p => ({ id: p.id, name: p.name, project_code: p.project_code }))

  // Fetch tasks for the deliverable's project to show linked task options
  const tasks = deliverable.project_id
    ? (await getTasksByProjectId(deliverable.project_id)).map(t => ({ id: t.id, title: t.title }))
    : []

  return (
    <div>
      <PageHeader
        title={`Edit: ${deliverable.name}`}
        subtitle={deliverable.projects ? `${deliverable.projects.project_code}` : ''}
      />
      <SectionCard>
        <DeliverableForm
          mode="edit"
          deliverable={deliverable}
          projects={projects}
          users={users}
          tasks={tasks}
        />
      </SectionCard>
    </div>
  )
}
