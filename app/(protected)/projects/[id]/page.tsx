import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getSessionProfile } from '@/lib/auth/session'
import { isBD, isDirektur, isFinance, isManajer, isManagement, isOpsLead, isTD } from '@/lib/auth/permissions'
import { requireProjectView, userCanEditProjectMetadata } from '@/lib/auth/access-surface'
import { SectionHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { ProjectStatusBadge } from '@/components/modules/projects/ProjectStatusBadge'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { ProgressBar, type ProgressBarTone } from '@/components/shared/ProgressBar'
import { TeamMemberList } from '@/components/modules/projects/TeamMemberList'
import { AddTeamMemberForm } from '@/components/modules/projects/AddTeamMemberForm'
import { ProjectTasksTable } from '@/components/modules/projects/ProjectTasksTable'
import { ProjectGantt } from '@/components/modules/projects/ProjectGantt'
import { PhaseBoard } from '@/components/modules/projects/PhaseBoard'
import { ProjectNotes } from '@/components/modules/projects/ProjectNotes'
import { ClientPortalManager } from '@/components/modules/projects/ClientPortalManager'
import { BurndownChart } from '@/components/modules/projects/BurndownChart'
import { DeliverableStatusBadge } from '@/components/modules/deliverables/DeliverableStatusBadge'
import { getProjectById } from '@/lib/projects/queries'
import { getTerminsByProject } from '@/lib/termins/queries'
import { TerminTable } from '@/components/modules/projects/TerminTable'
import { getTeamByProjectId } from '@/lib/projects/team-queries'
import { getProjectTopLevelTaskProgressCounts, getTasksByProjectId } from '@/lib/tasks/queries'
import { getProjectPhases } from '@/lib/phases/queries'
import { getProjectNotes } from '@/lib/project-notes/queries'
import { getPortalTokensForProject } from '@/lib/portal/queries'
import { getProjectBurndown, type BurndownPoint } from '@/lib/projects/burndown-queries'
import { getDeliverablesByProjectId, type DeliverableWithRelations } from '@/lib/deliverables/queries'
import { getFilesByProjectId, type FileWithRelations } from '@/lib/files/queries'
import { getUsersForSelect } from '@/lib/users/queries'
import { getProjectActivity, type ActivityLogEntry } from '@/lib/activity/queries'
import { getDeadlineHistory } from '@/lib/deadline-changes/actions'
import { ExtendDeadlineButton } from '@/components/modules/projects/ExtendDeadlineButton'
import { ProjectApprovalBanner } from '@/components/modules/projects/ProjectApprovalBanner'
import { ProjectProblematicBanner } from '@/components/modules/projects/ProjectProblematicBanner'
import { ProblemToggle } from '@/components/shared/ProblemToggle'
import { addConstructionAdminFolders, markProjectProblematic } from '@/lib/projects/actions'
import { normalizeProjectDisciplines } from '@/lib/projects/helpers'
import { markTaskProblematic } from '@/lib/tasks/actions'
import { ApproveFileButton } from '@/components/modules/files/ApproveFileButton'
import { CopyDriveFolderNameButton } from '@/components/modules/projects/CopyDriveFolderNameButton'
import { buildRekaDriveFolderName } from '@/lib/files/drive-service'
import { formatDate, formatMoney } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils/cn'
import { Card } from '@/components/ui/card'
import {
  Pencil,
  ExternalLink,
  FolderOpen,
  ClipboardList,
  CheckSquare,
  FileText,
  Users,
  Activity,
  Plus,
  Banknote,
  CalendarRange,
  Layers,
  StickyNote,
  BarChart2,
  Link2,
} from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string; construction_admin_error?: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const project = await getProjectById(id)
  return { title: project ? `${project.name} — ReKa Engineering OS` : 'Project not found — ReKa Engineering OS' }
}

export default async function ProjectDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { tab, construction_admin_error: constructionAdminError } = await searchParams
  if (tab === 'files') {
    redirect(`/projects/${id}?tab=deliverables`)
  }
  const activeTab = tab || 'overview'

  const profile = await getSessionProfile()
  const project = await getProjectById(id)
  if (!project) notFound()

  const sourceType = project.source_type ?? 'DOMESTIC'
  if (activeTab === 'termin' && sourceType !== 'DOMESTIC') {
    redirect(`/projects/${id}`)
  }

  await requireProjectView(profile, project)
  const canEditProjectMeta = await userCanEditProjectMetadata(profile, project)
  const allowOps =
    project.status !== 'pending_approval' && project.status !== 'rejected'
  const showResubmitCta =
    project.status === 'rejected' && isOpsLead(profile.system_role) && canEditProjectMeta
  const showClientIntakeLinks =
    isManagement(profile.system_role) || isOpsLead(profile.system_role) || isBD(profile.system_role)

  const taskProgressTopLevel = await getProjectTopLevelTaskProgressCounts(id)

  const clientName = project.clients?.client_name ?? '—'
  const leadName = project.lead?.full_name ?? '—'
  const reviewerName = project.reviewer?.full_name ?? null

  const [teamMembers, users] =
    activeTab === 'team' ? await Promise.all([getTeamByProjectId(id), getUsersForSelect()]) : [[], []]

  const needsProjectTasks = activeTab === 'tasks' || activeTab === 'timeline' || activeTab === 'phases'
  const projectTasks = needsProjectTasks ? await getTasksByProjectId(id) : []

  const projectPhases = activeTab === 'phases' ? await getProjectPhases(id) : []

  const projectNotes = activeTab === 'notes' ? await getProjectNotes(id) : []

  const portalTokens =
    activeTab === 'portal'
      ? await getPortalTokensForProject(id).catch(() => [])
      : []

  let burndownPoints: BurndownPoint[] = []
  let burndownTotal = 0
  if (activeTab === 'analytics') {
    const bd = await getProjectBurndown(id, project.start_date, project.target_due_date).catch(() => ({
      points: [] as BurndownPoint[],
      totalTasks: 0,
    }))
    burndownPoints = bd.points
    burndownTotal = bd.totalTasks
  }

  const appOrigin = process.env.NEXT_PUBLIC_APP_URL ?? ''

  const canManageClientPortal =
    (isTD(profile.system_role) || isDirektur(profile.system_role) || isManajer(profile.system_role)) &&
    allowOps &&
    canEditProjectMeta

  const projectDeliverables = activeTab === 'deliverables' ? await getDeliverablesByProjectId(id) : []

  const projectFiles = activeTab === 'deliverables' ? await getFilesByProjectId(id) : []

  const projectActivity = activeTab === 'activity' ? await getProjectActivity(id) : []

  const deadlineHistory = activeTab === 'overview' ? await getDeadlineHistory('project', id) : []

  const termins =
    activeTab === 'termin' && sourceType === 'DOMESTIC'
      ? await getTerminsByProject(id).catch(() => [])
      : []

  const isManajerLead = isManajer(profile.system_role) && project.project_lead_user_id === profile.id
  const isTDOrDirektur = isTD(profile.system_role) || isDirektur(profile.system_role)
  const canDeleteProjectPhase = isTDOrDirektur
  const isFinanceUser = isFinance(profile.system_role)
  const canAddConstructionAdmin =
    allowOps &&
    project.drive_mode === 'auto' &&
    Boolean(project.google_drive_folder_id) &&
    !project.drive_construction_admin_created &&
    (isTD(profile.system_role) || isManajerLead)

  const tabs = [
    { key: 'overview', label: 'Overview', icon: <ClipboardList size={13} /> },
    { key: 'team', label: 'Team', icon: <Users size={13} /> },
    ...(sourceType === 'DOMESTIC'
      ? [{ key: 'termin' as const, label: 'Termin', icon: <Banknote size={13} /> }]
      : []),
    { key: 'tasks', label: 'Tasks', icon: <CheckSquare size={13} /> },
    { key: 'timeline', label: 'Timeline', icon: <CalendarRange size={13} /> },
    { key: 'phases', label: 'Phases', icon: <Layers size={13} /> },
    { key: 'deliverables', label: 'Deliverables & Files', icon: <FileText size={13} /> },
    { key: 'activity', label: 'Activity', icon: <Activity size={13} /> },
    { key: 'notes', label: 'Notes', icon: <StickyNote size={13} /> },
    { key: 'analytics', label: 'Analytics', icon: <BarChart2 size={13} /> },
    { key: 'portal', label: 'Client portal', icon: <Link2 size={13} /> },
  ]

  const discParts = normalizeProjectDisciplines(project).map(
    (d) => d.charAt(0).toUpperCase() + d.slice(1).replace(/_/g, ' '),
  )
  const discSubtitle =
    discParts.length > 0
      ? discParts.join(' · ')
      : project.discipline
        ? project.discipline.charAt(0).toUpperCase() + project.discipline.slice(1).replace(/_/g, ' ')
        : '—'
  const subtitle = `${project.project_code} · ${discSubtitle} · ${project.project_type.charAt(0).toUpperCase() + project.project_type.slice(1)}`
  const today = new Date().toISOString().split('T')[0]
  const isDueOverdue = project.target_due_date && project.target_due_date < today
  const progressPct = project.progress_percent ?? 0
  const progressPresentation = projectProgressPresentation(progressPct)
  const progressTooltip = `${taskProgressTopLevel.done} dari ${taskProgressTopLevel.total} tasks selesai`

  return (
    <div>
      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/projects"
              className="shrink-0 text-[0.8125rem] text-[var(--color-text-muted)] no-underline transition-colors hover:text-[var(--color-text-secondary)]"
            >
              ← Projects
            </Link>
            <span className="text-[var(--color-border)]">/</span>
            <span className="max-w-[300px] truncate text-[0.8125rem] font-medium text-[var(--color-text-primary)] sm:max-w-md">
              {project.name}
            </span>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <ProjectStatusBadge status={project.status} />
            <PriorityBadge priority={project.priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'} />
            {project.waiting_on !== 'none' ? (
              <span className="rounded-full bg-[var(--color-warning-subtle)] px-2.5 py-0.5 text-[0.75rem] font-medium text-[var(--color-warning)]">
                Waiting: {(project.waiting_on ?? 'none').charAt(0).toUpperCase() + (project.waiting_on ?? 'none').slice(1)}
              </span>
            ) : null}
            {allowOps && canEditProjectMeta ? (
              <ProblemToggle
                entityId={project.id}
                entityType="project"
                isProblematic={project.is_problematic}
                problemNote={project.problem_note}
                onMark={markProjectProblematic}
              />
            ) : null}
            {canEditProjectMeta ? (
              <Link
                href={`/projects/${project.id}/edit`}
                className="btn-secondary inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-[0.8125rem] font-medium no-underline"
              >
                <Pencil size={13} aria-hidden="true" />
                Edit Project
              </Link>
            ) : null}
          </div>
        </div>
        <p className="text-[0.8125rem] text-[var(--color-text-muted)]">{subtitle}</p>
        {(project.target_due_date || project.progress_percent != null) && (
          <div className="flex flex-wrap items-center gap-4 border-t border-[var(--color-border)] pt-3">
            {project.target_due_date && (
              <span
                className={cn(
                  'whitespace-nowrap text-xs',
                  isDueOverdue ? 'font-semibold text-[var(--color-danger)]' : 'text-[var(--color-text-muted)]',
                )}
              >
                Due {formatDate(project.target_due_date)}
              </span>
            )}
            {project.progress_percent != null && (
              <div
                className="flex min-w-[110px] shrink-0 items-center gap-1.5"
                title={progressTooltip}
              >
                <ProgressBar value={progressPct} height={5} tone={progressPresentation.tone} />
                <span className="whitespace-nowrap text-[0.6875rem] text-[var(--color-text-muted)]">
                  {progressPct}%
                </span>
              </div>
            )}
          </div>
        )}
        {project.is_problematic ? (
          <ProjectProblematicBanner
            projectId={project.id}
            problemNote={project.problem_note}
            canResolve={allowOps && canEditProjectMeta}
          />
        ) : null}
      </div>

      <ProjectApprovalBanner
        project={project}
        isDirektur={isDirektur(profile.system_role)}
        showResubmitCta={showResubmitCta}
      />

      {constructionAdminError ? (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-danger-subtle)] px-4 py-3 text-[0.8125rem] text-[var(--color-danger)]"
        >
          {decodeURIComponent(constructionAdminError)}
        </div>
      ) : null}

      <div className="mb-6 flex flex-wrap gap-1 border-b-2 border-[var(--color-border)]">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/projects/${project.id}${t.key === 'overview' ? '' : `?tab=${t.key}`}`}
            className={cn(
              '-mb-0.5 flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-[0.8125rem] font-medium no-underline transition-colors',
              activeTab === t.key
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]',
            )}
          >
            {t.icon}
            {t.label}
          </Link>
        ))}
      </div>

      {activeTab === 'overview' && (
        <OverviewTab
          project={project}
          clientName={clientName}
          leadName={leadName}
          reviewerName={reviewerName}
          showClientIntakeLinks={showClientIntakeLinks}
          canEditProjectMeta={canEditProjectMeta}
          allowOps={allowOps}
          deadlineHistory={deadlineHistory}
          taskProgressTopLevel={taskProgressTopLevel}
          sourceType={sourceType}
          canAddConstructionAdmin={canAddConstructionAdmin}
        />
      )}
      {activeTab === 'termin' && sourceType === 'DOMESTIC' && (
        <section className="space-y-4">
          <SectionHeader title="Termin & pembayaran" />
          <TerminTable
            termins={termins}
            isManajerLead={isManajerLead}
            isTDOrDirektur={isTDOrDirektur}
            isFinance={isFinanceUser}
          />
        </section>
      )}
      {activeTab === 'team' && (
        <TeamTab
          projectId={project.id}
          teamMembers={teamMembers}
          users={users}
          projectDisciplines={normalizeProjectDisciplines(project)}
          leadName={leadName}
          reviewerName={reviewerName}
          canManageTeam={allowOps && canEditProjectMeta}
        />
      )}
      {activeTab === 'tasks' && (
        <ProjectTasksTable
          projectId={project.id}
          tasks={projectTasks}
          showAddTask={allowOps && canEditProjectMeta}
          canFlagProblems={allowOps && canEditProjectMeta}
          markTaskProblematic={markTaskProblematic}
        />
      )}
      {activeTab === 'timeline' && (
        <section className="space-y-4">
          <SectionHeader title="Timeline proyek" />
          <ProjectGantt tasks={projectTasks} projectId={project.id} />
        </section>
      )}
      {activeTab === 'phases' && (
        <section className="space-y-4">
          <SectionHeader title="Phase & sprint" />
          <PhaseBoard
            phases={projectPhases}
            tasks={projectTasks}
            projectId={project.id}
            canManage={allowOps && canEditProjectMeta}
            canDeletePhase={canDeleteProjectPhase}
          />
        </section>
      )}
      {activeTab === 'deliverables' && (
        <DeliverablesTab
          projectId={project.id}
          deliverables={projectDeliverables}
          files={projectFiles}
          showAddDeliverable={allowOps && canEditProjectMeta}
          showAddFile={allowOps && canEditProjectMeta}
          driveFolderLink={project.google_drive_folder_link}
          canApproveFiles={allowOps && canEditProjectMeta}
        />
      )}
      {activeTab === 'activity' && <ActivityTab logs={projectActivity} />}
      {activeTab === 'notes' && (
        <section className="space-y-4">
          <SectionHeader title="Project notes" />
          <ProjectNotes
            notes={projectNotes}
            projectId={id}
            canUseNotes={allowOps}
            canDeleteNote={isTDOrDirektur}
          />
        </section>
      )}
      {activeTab === 'analytics' && (
        <section className="space-y-4">
          <SectionHeader title="Burndown" />
          <BurndownChart data={burndownPoints} totalTasks={burndownTotal} />
        </section>
      )}
      {activeTab === 'portal' && (
        <section className="space-y-4">
          <SectionHeader title="Client portal" />
          {canManageClientPortal ? (
            <ClientPortalManager projectId={id} tokens={portalTokens} appOrigin={appOrigin} />
          ) : (
            <p className="text-[0.875rem] text-[var(--color-text-muted)]">
              Hanya Direktur, Technical Director, atau Manajer yang dapat mengelola link portal untuk proyek ini.
            </p>
          )}
        </section>
      )}
    </div>
  )
}

function projectProgressPresentation(pct: number): { label: string; tone: ProgressBarTone } {
  if (pct === 0) return { label: 'Belum Dimulai', tone: 'neutral' }
  if (pct <= 33) return { label: 'Baru Mulai', tone: 'danger' }
  if (pct <= 66) return { label: 'Sedang Berjalan', tone: 'warning' }
  if (pct < 100) return { label: 'Hampir Selesai', tone: 'primary' }
  return { label: '✓ Selesai', tone: 'success' }
}

/* ─── Overview Tab ─────────────────────────────────────────────── */
function OverviewTab({
  project,
  clientName,
  leadName,
  reviewerName,
  showClientIntakeLinks,
  canEditProjectMeta,
  allowOps,
  deadlineHistory,
  taskProgressTopLevel,
  sourceType,
  canAddConstructionAdmin,
}: {
  project: Awaited<ReturnType<typeof getProjectById>> & {}
  clientName: string
  leadName: string
  reviewerName: string | null
  showClientIntakeLinks: boolean
  canEditProjectMeta: boolean
  allowOps: boolean
  deadlineHistory: Awaited<ReturnType<typeof getDeadlineHistory>>
  taskProgressTopLevel: { total: number; done: number }
  sourceType: string
  canAddConstructionAdmin: boolean
}) {
  if (!project) return null

  const progressPct = project.progress_percent ?? 0
  const { label: progressLabel, tone: progressTone } = projectProgressPresentation(progressPct)
  const progressTooltip = `${taskProgressTopLevel.done} dari ${taskProgressTopLevel.total} tasks selesai`

  const driveFolderClipboardName =
    project.project_code
      ? buildRekaDriveFolderName({
          clientCode: project.clients?.client_code ?? '',
          projectCode: project.project_code,
        })
      : ''

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {sourceType === 'PLATFORM' ? (
          <Card className="border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
            <p className="m-0 text-[0.8125rem] text-[var(--color-text-secondary)]">
              Project via platform — penagihan dan pembayaran dikelola oleh platform (Fiverr/Upwork). Tidak ada tracking
              termin atau BAST di modul ini.
            </p>
          </Card>
        ) : null}
        {project.progress_percent != null && (
          <Card className="p-6">
            <SectionHeader title="Progress proyek" />
            <div className="space-y-2" title={progressTooltip}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[0.875rem] font-medium text-[var(--color-text-primary)]">{progressLabel}</span>
                <span className="font-mono text-[0.8125rem] text-[var(--color-text-muted)]">{progressPct}%</span>
              </div>
              <ProgressBar value={progressPct} height={8} tone={progressTone} />
              <p className="text-[0.75rem] text-[var(--color-text-muted)]">{progressTooltip}</p>
            </div>
          </Card>
        )}

        <Card className="p-6">
          <SectionHeader title="Project details" />
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailField label="Client">
              {project.clients && showClientIntakeLinks ? (
                <Link
                  href={`/clients/${project.clients.id}`}
                  className="font-medium text-[var(--color-primary)] no-underline hover:underline"
                >
                  {clientName}
                </Link>
              ) : (
                <span className="font-medium">{clientName}</span>
              )}
            </DetailField>
            <DetailField label="Source">
              <span className="capitalize">{project.source}</span>
            </DetailField>
            <DetailField label="Jenis billing">
              <span>{sourceType === 'DOMESTIC' ? 'Domestic (termin & BAST)' : 'Platform'}</span>
            </DetailField>
            {sourceType === 'DOMESTIC' && project.contract_value != null ? (
              <DetailField label="Nilai kontrak">
                <span className="font-medium">
                  {formatMoney(project.contract_value, project.contract_currency ?? 'IDR')}
                </span>
                {project.has_retention ? (
                  <span className="mt-1 block text-[0.75rem] text-[var(--color-text-muted)]">
                    Retensi: {project.retention_percentage ?? 5}%
                  </span>
                ) : null}
              </DetailField>
            ) : null}
            <DetailField label="Disciplines">
              {normalizeProjectDisciplines(project).length === 0 ? (
                <span className="text-[var(--color-text-muted)]">—</span>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {normalizeProjectDisciplines(project).map((d) => (
                    <span
                      key={d}
                      className="rounded-md bg-[var(--color-surface-muted)] px-2 py-0.5 text-[0.75rem] capitalize text-[var(--color-text-secondary)]"
                    >
                      {d.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              )}
            </DetailField>
            <DetailField label="Project type">
              <span className="capitalize">{project.project_type}</span>
            </DetailField>
            <DetailField label="Start date">{formatDate(project.start_date)}</DetailField>
            <DetailField label="Target due date">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span>{formatDate(project.target_due_date)}</span>
                  {allowOps && canEditProjectMeta ? (
                    <ExtendDeadlineButton
                      projectId={project.id}
                      currentDueDate={project.target_due_date}
                    />
                  ) : null}
                </div>
                {deadlineHistory.length > 0 ? (
                  <details className="group text-[0.75rem] text-[var(--color-text-muted)]">
                    <summary className="cursor-pointer select-none list-none text-[0.75rem] font-medium text-[var(--color-text-secondary)] marker:content-[''] [&::-webkit-details-marker]:hidden">
                      <span className="underline decoration-[var(--color-border)] decoration-dotted underline-offset-2 group-open:no-underline">
                        Deadline History
                      </span>
                    </summary>
                    <ul className="mt-2 space-y-1.5 border-l-2 border-[var(--color-border)] pl-3">
                      {deadlineHistory.map((row) => {
                        const name =
                          row.profiles &&
                          typeof row.profiles === 'object' &&
                          'full_name' in row.profiles
                            ? (row.profiles as { full_name: string | null }).full_name
                            : null
                        return (
                          <li key={row.id} className="text-[0.75rem] leading-relaxed text-[var(--color-text-muted)]">
                            {`${formatDate(row.old_due_date)} → ${formatDate(row.new_due_date)} · ‘${row.reason || '—'}’ · oleh ${name ?? '—'} · ${formatDate(row.changed_at)}`}
                          </li>
                        )
                      })}
                    </ul>
                  </details>
                ) : null}
              </div>
            </DetailField>
            {project.actual_completion_date && (
              <DetailField label="Completed">{formatDate(project.actual_completion_date)}</DetailField>
            )}
            <DetailField label="Waiting on">
              <span className="capitalize">{project.waiting_on === 'none' ? '—' : project.waiting_on}</span>
            </DetailField>
          </dl>
        </Card>

        {project.scope_summary && (
          <Card className="p-6">
            <SectionHeader title="Scope summary" />
            <p className="whitespace-pre-wrap text-[0.875rem] leading-relaxed text-[var(--color-text-secondary)]">
              {project.scope_summary}
            </p>
          </Card>
        )}

        {project.notes_internal && (
          <Card className="p-6">
            <SectionHeader title="Internal notes" />
            <p className="whitespace-pre-wrap text-[0.875rem] leading-relaxed text-[var(--color-text-secondary)]">
              {project.notes_internal}
            </p>
          </Card>
        )}
      </div>

      <div className="space-y-4">
        <Card className="p-5">
          <SectionHeader title="Assignment" />
          <dl className="space-y-4">
            <DetailField label="Project lead">{leadName}</DetailField>
            <DetailField label="Reviewer">
              {reviewerName ?? <span className="text-[var(--color-text-muted)]">Not assigned</span>}
            </DetailField>
          </dl>
        </Card>

        {project.intakes && (
          <Card className="p-5">
            <SectionHeader title="Linked intake" />
            {showClientIntakeLinks ? (
              <Link href={`/intakes/${project.intakes.id}`} className="flex flex-col gap-0.5 no-underline">
                <span className="font-mono text-[0.75rem] text-[var(--color-text-muted)]">{project.intakes.intake_code}</span>
                <span className="text-[0.875rem] font-medium text-[var(--color-primary)]">{project.intakes.title}</span>
              </Link>
            ) : (
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-[0.75rem] text-[var(--color-text-muted)]">{project.intakes.intake_code}</span>
                <span className="text-[0.875rem] font-medium text-[var(--color-text-primary)]">{project.intakes.title}</span>
              </div>
            )}
          </Card>
        )}

        {(project.external_reference_url || project.google_drive_folder_link) && (
          <Card className="p-5">
            <SectionHeader title="Links" />
            <div className="flex flex-col gap-2.5">
              {project.external_reference_url && (
                <a
                  href={project.external_reference_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 break-all text-[0.875rem] font-medium text-[var(--color-primary)] no-underline hover:underline"
                >
                  <ExternalLink size={13} aria-hidden="true" />
                  External reference
                </a>
              )}
              {project.google_drive_folder_link && (
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                  <a
                    href={project.google_drive_folder_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[0.875rem] font-medium text-[var(--color-primary)] no-underline hover:underline"
                  >
                    <FolderOpen size={13} aria-hidden="true" />
                    Google Drive folder
                  </a>
                  {driveFolderClipboardName ? (
                    <CopyDriveFolderNameButton folderName={driveFolderClipboardName} />
                  ) : null}
                </div>
              )}
              {canAddConstructionAdmin ? (
                <form action={addConstructionAdminFolders.bind(null, project.id)} className="mt-3">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[0.8125rem] font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-muted)]"
                  >
                    + Tambah Fase Construction Admin di Drive
                  </button>
                </form>
              ) : null}
              {project.drive_construction_admin_created ? (
                <p className="mt-2 text-[0.75rem] text-[var(--color-text-muted)]">
                  Fase Construction Admin sudah ditambahkan di Drive.
                </p>
              ) : null}
            </div>
          </Card>
        )}

        <Card className="p-5">
          <SectionHeader title="Record info" />
          <dl className="space-y-4">
            <DetailField label="Created">{formatDate(project.created_at)}</DetailField>
            <DetailField label="Last updated">{formatDate(project.updated_at)}</DetailField>
          </dl>
        </Card>
      </div>
    </div>
  )
}

/* ─── Team Tab ─────────────────────────────────────────────────── */
function TeamTab({
  projectId,
  teamMembers,
  users,
  projectDisciplines,
  leadName,
  reviewerName,
  canManageTeam,
}: {
  projectId: string
  teamMembers: Awaited<ReturnType<typeof getTeamByProjectId>>
  users: Awaited<ReturnType<typeof getUsersForSelect>>
  projectDisciplines: string[]
  leadName: string
  reviewerName: string | null
  canManageTeam: boolean
}) {
  const assignedUserIds = teamMembers.map((m) => m.user_id)

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-[var(--color-border)] p-6 pb-4">
            <SectionHeader
              title="Team members"
              className="mb-0"
            >
              <span className="text-[0.75rem] text-[var(--color-text-muted)]">
                {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}
              </span>
            </SectionHeader>
          </div>
          <TeamMemberList members={teamMembers} projectId={projectId} allowRemove={canManageTeam} />
        </Card>

        {canManageTeam && (
          <Card className="p-6">
            <SectionHeader title="Add team member" />
            <AddTeamMemberForm
              projectId={projectId}
              users={users}
              assignedUserIds={assignedUserIds}
              projectDisciplines={projectDisciplines}
            />
          </Card>
        )}
      </div>

      <div className="space-y-4">
        <Card className="p-5">
          <SectionHeader title="Project assignment" />
          <dl className="space-y-4">
            <DetailField label="Project lead">{leadName}</DetailField>
            <DetailField label="Reviewer">
              {reviewerName ?? <span className="text-[var(--color-text-muted)]">Not assigned</span>}
            </DetailField>
          </dl>
        </Card>
      </div>
    </div>
  )
}

/* ─── Deliverables & Files Tab ───────────────────────────────── */
function DeliverablesTab({
  projectId,
  deliverables,
  files,
  showAddDeliverable,
  showAddFile,
  driveFolderLink,
  canApproveFiles,
}: {
  projectId: string
  deliverables: DeliverableWithRelations[]
  files: FileWithRelations[]
  showAddDeliverable: boolean
  showAddFile: boolean
  driveFolderLink: string | null
  canApproveFiles: boolean
}) {
  const delHeaders = ['Deliverable', 'Type', 'Rev', 'Prepared By', 'Status', 'Approved', 'Submitted', 'File']
  const typeLabels: Record<string, string> = {
    drawing: 'Drawing',
    '3d_model': '3D Model',
    report: 'Report',
    boq: 'BOQ',
    calculation_sheet: 'Calc Sheet',
    presentation: 'Presentation',
    specification: 'Specification',
    revision_package: 'Rev Package',
    submission_package: 'Sub Package',
  }
  const categoryLabels: Record<string, string> = {
    reference: 'Reference',
    draft: 'Draft',
    working_file: 'Working File',
    review_copy: 'Review Copy',
    final: 'Final',
    submission: 'Submission',
    supporting_document: 'Supporting Doc',
  }
  const fileHeaders = ['Filename', 'Type', 'Uploaded by', 'Date', 'Approved?', 'Link']

  const thClass =
    'whitespace-nowrap bg-[var(--color-surface-subtle)] px-3.5 py-2 text-left text-[0.6875rem] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]'
  const tdClass = 'px-3.5 py-2 text-[0.8125rem]'

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] p-6 pb-4">
          <SectionHeader title="Deliverables" className="mb-0" />
          {showAddDeliverable ? (
            <Link
              href={`/deliverables/new?project_id=${projectId}`}
              className="inline-flex shrink-0 items-center gap-1 text-[0.75rem] font-medium text-[var(--color-primary)] no-underline hover:underline"
            >
              <Plus size={12} aria-hidden="true" />
              Add Deliverable
            </Link>
          ) : null}
        </div>
        {deliverables.length === 0 ? (
          <div className="p-4">
            <EmptyState compact icon={<FileText size={16} />} title="No deliverables created for this project yet." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  {delHeaders.map((h) => (
                    <th key={h} className={thClass}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deliverables.map((d) => {
                  const isRevisionRequested = d.status === 'revision_requested'

                  return (
                    <tr
                      key={d.id}
                      className={cn(
                        'border-b border-[var(--color-border)] last:border-b-0',
                        isRevisionRequested && 'bg-[var(--color-danger-subtle)]',
                      )}
                    >
                      <td className={cn(tdClass, 'max-w-[220px]')}>
                        <Link href={`/deliverables/${d.id}`} className="no-underline">
                          <span className="block truncate font-medium text-[var(--color-text-primary)]">{d.name}</span>
                        </Link>
                      </td>
                      <td className={cn(tdClass, 'text-[var(--color-text-secondary)]')}>{typeLabels[d.type] ?? d.type}</td>
                      <td className={tdClass}>
                        <span className="rounded bg-[var(--color-surface-subtle)] px-1.5 py-0.5 font-mono text-[0.75rem] font-semibold text-[var(--color-text-primary)]">
                          R{d.revision_number}
                        </span>
                        {d.version_label && (
                          <span className="ml-1 text-[0.6875rem] text-[var(--color-text-muted)]">{d.version_label}</span>
                        )}
                      </td>
                      <td className={cn(tdClass, 'text-[var(--color-text-secondary)]')}>{d.preparer?.full_name ?? '—'}</td>
                      <td className={tdClass}>
                        <DeliverableStatusBadge status={d.status} />
                      </td>
                      <td className={tdClass}>
                        {d.status === 'approved' ? (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-[var(--color-primary-subtle)] px-2 py-0.5 text-[0.6875rem] font-semibold text-[var(--color-primary)]">
                            ✓ Approved
                          </span>
                        ) : (
                          <span className="text-[0.75rem] text-[var(--color-text-muted)]">—</span>
                        )}
                      </td>
                      <td className={cn(tdClass, 'whitespace-nowrap text-[0.75rem] text-[var(--color-text-muted)]')}>
                        {formatDate(d.submitted_to_client_date)}
                      </td>
                      <td className={tdClass}>
                        {d.file_link ? (
                          <a
                            href={d.file_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--color-primary)]"
                          >
                            <ExternalLink size={13} />
                          </a>
                        ) : (
                          <span className="text-[0.75rem] text-[var(--color-text-muted)]">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="border-t border-[var(--color-border)]" role="separator" />

      {driveFolderLink && (
        <Card className="p-6">
          <SectionHeader title="Project Drive folder" />
          <a
            href={driveFolderLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[0.875rem] font-medium text-[var(--color-primary)] no-underline hover:underline"
          >
            <FolderOpen size={14} />
            Open project folder in Google Drive
          </a>
        </Card>
      )}

      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] p-6 pb-4">
          <SectionHeader title="Files" className="mb-0" />
          {showAddFile ? (
            <Link
              href={`/files/new?project_id=${projectId}`}
              className="inline-flex shrink-0 items-center gap-1 text-[0.75rem] font-medium text-[var(--color-primary)] no-underline hover:underline"
            >
              <Plus size={12} aria-hidden="true" />
              Upload File
            </Link>
          ) : null}
        </div>
        {files.length === 0 ? (
          <div className="p-4">
            <EmptyState compact icon={<FolderOpen size={16} />} title="No files attached to this project yet." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  {fileHeaders.map((h) => (
                    <th key={h} className={thClass}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {files.map((f) => {
                  const link = f.manual_link || f.google_web_view_link
                  return (
                    <tr key={f.id} className="border-b border-[var(--color-border)] last:border-b-0">
                      <td className={cn(tdClass, 'max-w-[220px]')}>
                        <Link href={`/files/${f.id}`} className="flex items-center gap-1 no-underline">
                          <span className="truncate font-medium text-[var(--color-text-primary)]">{f.file_name}</span>
                          {f.extension && (
                            <span className="shrink-0 rounded bg-[var(--color-surface-subtle)] px-1 py-0 text-[0.625rem] font-semibold uppercase text-[var(--color-text-muted)]">
                              {f.extension}
                            </span>
                          )}
                        </Link>
                      </td>
                      <td className={cn(tdClass, 'text-[var(--color-text-secondary)]')}>
                        {categoryLabels[f.file_category] ?? f.file_category}
                      </td>
                      <td className={cn(tdClass, 'text-[var(--color-text-secondary)]')}>{f.uploader?.full_name ?? '—'}</td>
                      <td className={cn(tdClass, 'whitespace-nowrap text-[0.75rem] text-[var(--color-text-muted)]')}>
                        {formatDate(f.created_at)}
                      </td>
                      <td className={tdClass}>
                        {f.is_approved_version ? (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-[var(--color-primary-subtle)] px-2 py-0.5 text-[0.6875rem] font-semibold text-[var(--color-primary)]">
                            ✓ Approved
                          </span>
                        ) : canApproveFiles ? (
                          <ApproveFileButton fileId={f.id} />
                        ) : (
                          <span className="text-[0.75rem] text-[var(--color-text-muted)]">—</span>
                        )}
                      </td>
                      <td className={tdClass}>
                        {link ? (
                          <a href={link} target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)]">
                            <ExternalLink size={13} />
                          </a>
                        ) : (
                          <span className="text-[0.75rem] text-[var(--color-text-muted)]">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

/* ─── Activity Tab ─────────────────────────────────────────────── */
const ACTION_LABELS: Record<string, string> = {
  created: 'Project created',
  status_updated: 'Status updated',
  converted: 'Converted from intake',
}

function ActivityTab({ logs }: { logs: ActivityLogEntry[] }) {
  if (logs.length === 0) {
    return (
      <Card className="p-6">
        <SectionHeader title="Activity" />
        <EmptyState compact icon={<Activity size={16} />} title="No activity recorded for this project yet." />
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-[var(--color-border)] p-6 pb-4">
        <SectionHeader title="Activity" className="mb-0" />
      </div>
      <div className="flex flex-col">
        {logs.map((log) => (
          <div
            key={log.id}
            className="flex flex-wrap items-baseline gap-2.5 border-b border-[var(--color-border)] px-4 py-2.5 last:border-b-0 sm:flex-nowrap sm:gap-2.5"
          >
            <span className="min-w-0 flex-1 text-[0.8125rem] font-medium text-[var(--color-text-primary)]">
              {ACTION_LABELS[log.action_type] ?? log.action_type.replace(/_/g, ' ')}
              {log.note && <span className="font-normal text-[var(--color-text-secondary)]"> — {log.note}</span>}
            </span>
            <span className="shrink-0 whitespace-nowrap text-[0.6875rem] text-[var(--color-text-muted)]">
              {log.actor?.full_name ?? 'System'}
            </span>
            <span className="min-w-[5rem] shrink-0 whitespace-nowrap text-right text-[0.6875rem] text-[var(--color-text-muted)]">
              {formatDate(log.created_at)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}

/* ─── Shared detail field (dl dt/dd) ───────────────────────────── */
function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[0.75rem] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">{label}</dt>
      <dd className="mt-1 text-[0.875rem] text-[var(--color-text-primary)] [&>a]:text-[var(--color-primary)]">{children}</dd>
    </div>
  )
}
