import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { DeliverableForm } from '@/components/modules/deliverables/DeliverableForm'
import { getSessionProfile } from '@/lib/auth/session'
import { requireDeliverableEditPage } from '@/lib/auth/access-surface'
import { getDeliverableById } from '@/lib/deliverables/queries'
import { projectOptionsForMutationForms, usersForAssignmentPickers } from '@/lib/auth/query-scope'
import { getDeliverableEditFormScope } from '@/lib/auth/edit-form-scopes'
import { getTasksByProjectId } from '@/lib/tasks/queries'
import { getSettingOptions } from '@/lib/settings/queries'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const d = await getDeliverableById(id)
  return { title: d ? `Edit ${d.name} — ReKa Engineering OS` : 'Deliverable not found — ReKa Engineering OS' }
}

export default async function EditDeliverablePage({ params }: PageProps) {
  const { id } = await params
  const profile = await getSessionProfile()
  const deliverable = await getDeliverableById(id)
  if (!deliverable) notFound()
  await requireDeliverableEditPage(profile, deliverable)

  const deliverableEditScope = getDeliverableEditFormScope(profile, deliverable)

  const [projectsRaw, users, deliverableTypeOptions] = await Promise.all([
    projectOptionsForMutationForms(profile, deliverable.project_id),
    deliverableEditScope === 'full'
      ? usersForAssignmentPickers(profile, { mode: 'edit', lockedProjectId: deliverable.project_id })
      : Promise.resolve([]),
    getSettingOptions('deliverable_type'),
  ])

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
          deliverableTypeOptions={deliverableTypeOptions}
          deliverableEditScope={deliverableEditScope}
        />
      </SectionCard>
    </div>
  )
}
