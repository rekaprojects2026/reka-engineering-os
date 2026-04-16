import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { FileForm } from '@/components/modules/files/FileForm'
import { getSessionProfile } from '@/lib/auth/session'
import { requireFileEditPage } from '@/lib/auth/access-surface'
import { getFileById } from '@/lib/files/queries'
import { getProjects } from '@/lib/projects/queries'
import { getTasksByProjectId } from '@/lib/tasks/queries'
import { getDeliverablesByProjectId } from '@/lib/deliverables/queries'
import { getSettingOptions } from '@/lib/settings/queries'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const f = await getFileById(id)
  return { title: f ? `Edit ${f.file_name} — Engineering Agency OS` : 'File Not Found' }
}

export default async function EditFilePage({ params }: PageProps) {
  const { id } = await params
  const profile = await getSessionProfile()
  const [file, projectsRaw, fileCategoryOptions] = await Promise.all([
    getFileById(id),
    getProjects(),
    getSettingOptions('file_category'),
  ])

  if (!file) notFound()
  await requireFileEditPage(profile, file)

  const projects = projectsRaw.map(p => ({ id: p.id, name: p.name, project_code: p.project_code }))

  const tasks = file.project_id
    ? (await getTasksByProjectId(file.project_id)).map(t => ({ id: t.id, title: t.title }))
    : []

  const deliverables = file.project_id
    ? (await getDeliverablesByProjectId(file.project_id)).map(d => ({ id: d.id, name: d.name }))
    : []

  return (
    <div>
      <PageHeader title={`Edit: ${file.file_name}`} subtitle={file.projects ? file.projects.project_code : ''} />
      <SectionCard>
        <FileForm mode="edit" file={file} projects={projects} tasks={tasks} deliverables={deliverables} fileCategoryOptions={fileCategoryOptions} />
      </SectionCard>
    </div>
  )
}
