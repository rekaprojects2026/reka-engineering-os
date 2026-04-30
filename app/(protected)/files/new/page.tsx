import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { FileForm } from '@/components/modules/files/FileForm'
import { getSessionProfile } from '@/lib/auth/session'
import { requireTasksDeliverablesFilesNewPageAccess } from '@/lib/auth/access-surface'
import { projectOptionsForMutationForms } from '@/lib/auth/query-scope'
import { getTasksByProjectId } from '@/lib/tasks/queries'
import { getDeliverablesByProjectId } from '@/lib/deliverables/queries'
import { parseCodeMap } from '@/lib/files/naming'
import { getNextFileSequenceNumber, getSuggestedRevisionIndex } from '@/lib/files/queries'
import { getSettingOptions, getFileNamingConfig } from '@/lib/settings/queries'

export const metadata = { title: 'Add File — ReKa Engineering OS' }

interface PageProps {
  searchParams: Promise<{ project_id?: string }>
}

export default async function NewFilePage({ searchParams }: PageProps) {
  const profile = await getSessionProfile()
  requireTasksDeliverablesFilesNewPageAccess(profile.system_role)

  const params = await searchParams
  const [projectsRaw, fileCategoryOptions, namingConfig] = await Promise.all([
    projectOptionsForMutationForms(profile, params.project_id ?? null),
    getSettingOptions('file_category'),
    getFileNamingConfig(),
  ])
  const projects = projectsRaw.map(p => ({ id: p.id, name: p.name, project_code: p.project_code }))

  const disc = parseCodeMap(namingConfig.discipline_codes)[0]?.value ?? 'MCH'
  const doc = parseCodeMap(namingConfig.doc_type_codes)[0]?.value ?? 'DR'
  let suggestedSequence = 1
  let suggestedRevisionIndex = 0
  if (params.project_id) {
    suggestedSequence = await getNextFileSequenceNumber(params.project_id, disc, doc)
    suggestedRevisionIndex = await getSuggestedRevisionIndex(params.project_id, disc, doc)
  }

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
          fileNaming={{
            config: namingConfig,
            suggestedSequence,
            suggestedRevisionIndex,
          }}
        />
      </SectionCard>
    </div>
  )
}
