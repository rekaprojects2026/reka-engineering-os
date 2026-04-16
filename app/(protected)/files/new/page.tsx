import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { FileForm } from '@/components/modules/files/FileForm'
import { getSessionProfile } from '@/lib/auth/session'
import { requireTasksDeliverablesFilesNewPageAccess } from '@/lib/auth/access-surface'
import { getProjects } from '@/lib/projects/queries'
import { getTasksByProjectId } from '@/lib/tasks/queries'
import { getDeliverablesByProjectId } from '@/lib/deliverables/queries'
import { getSettingOptions } from '@/lib/settings/queries'

export const metadata = { title: 'Add File — Engineering Agency OS' }

interface PageProps {
  searchParams: Promise<{ project_id?: string }>
}

export default async function NewFilePage({ searchParams }: PageProps) {
  const profile = await getSessionProfile()
  requireTasksDeliverablesFilesNewPageAccess(profile.system_role)

  const params = await searchParams
  const [projectsRaw, fileCategoryOptions] = await Promise.all([
    getProjects(),
    getSettingOptions('file_category'),
  ])
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
          fileCategoryOptions={fileCategoryOptions}
        />
      </SectionCard>
    </div>
  )
}
