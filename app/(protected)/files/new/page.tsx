import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { FileForm } from '@/components/modules/files/FileForm'
import { getProjects } from '@/lib/projects/queries'
import { getTasksByProjectId } from '@/lib/tasks/queries'
import { getDeliverablesByProjectId } from '@/lib/deliverables/queries'

export const metadata = { title: 'Add File — Engineering Agency OS' }

interface PageProps {
  searchParams: Promise<{ project_id?: string }>
}

export default async function NewFilePage({ searchParams }: PageProps) {
  const params = await searchParams
  const projectsRaw = await getProjects()
  const projects = projectsRaw.map(p => ({ id: p.id, name: p.name, project_code: p.project_code }))

  const tasks = params.project_id
    ? (await getTasksByProjectId(params.project_id)).map(t => ({ id: t.id, title: t.title }))
    : []

  const deliverables = params.project_id
    ? (await getDeliverablesByProjectId(params.project_id)).map(d => ({ id: d.id, name: d.name }))
    : []

  return (
    <div>
      <PageHeader title="Add File" subtitle="Attach file metadata to a project." />
      <SectionCard>
        <FileForm
          mode="create"
          projects={projects}
          tasks={tasks}
          deliverables={deliverables}
          defaultProjectId={params.project_id}
        />
      </SectionCard>
    </div>
  )
}
