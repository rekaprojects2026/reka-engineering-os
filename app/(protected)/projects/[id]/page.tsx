import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getSessionProfile } from '@/lib/auth/session'
import { isAdminOrCoordinator } from '@/lib/auth/permissions'
import { requireProjectView, userCanEditProjectMetadata } from '@/lib/auth/access-surface'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { EntityStatusStrip } from '@/components/shared/EntityStatusStrip'
import { EmptyState } from '@/components/shared/EmptyState'
import { ProjectStatusBadge } from '@/components/modules/projects/ProjectStatusBadge'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { TeamMemberList } from '@/components/modules/projects/TeamMemberList'
import { AddTeamMemberForm } from '@/components/modules/projects/AddTeamMemberForm'
import { TaskStatusBadge } from '@/components/modules/tasks/TaskStatusBadge'
import { DeliverableStatusBadge } from '@/components/modules/deliverables/DeliverableStatusBadge'
import { getProjectById } from '@/lib/projects/queries'
import { getTeamByProjectId } from '@/lib/projects/team-queries'
import { getTasksByProjectId, type TaskWithRelations } from '@/lib/tasks/queries'
import { getDeliverablesByProjectId, type DeliverableWithRelations } from '@/lib/deliverables/queries'
import { getFilesByProjectId, type FileWithRelations } from '@/lib/files/queries'
import { getUsersForSelect } from '@/lib/users/queries'
import { getProjectActivity, type ActivityLogEntry } from '@/lib/activity/queries'
import { formatDate } from '@/lib/utils/formatters'
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
  AlertTriangle,
  ExternalLink as ExternalLinkIcon,
  HardDrive,
} from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const project = await getProjectById(id)
  return { title: project ? `${project.name} — Engineering Agency OS` : 'Project Not Found' }
}

export default async function ProjectDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { tab } = await searchParams
  const activeTab = tab || 'overview'

  const profile = await getSessionProfile()
  const project = await getProjectById(id)
  if (!project) notFound()

  await requireProjectView(profile, project)
  const canEditProjectMeta = await userCanEditProjectMetadata(profile, project)
  const showClientIntakeLinks = isAdminOrCoordinator(profile.system_role)

  const clientName = project.clients?.client_name ?? '—'
  const leadName = project.lead?.full_name ?? '—'
  const reviewerName = project.reviewer?.full_name ?? null

  // Fetch tab-specific data
  const [teamMembers, users] = activeTab === 'team'
    ? await Promise.all([getTeamByProjectId(id), getUsersForSelect()])
    : [[], []]

  const projectTasks = activeTab === 'tasks'
    ? await getTasksByProjectId(id)
    : []

  const projectDeliverables = activeTab === 'deliverables'
    ? await getDeliverablesByProjectId(id)
    : []

  const projectFiles = activeTab === 'files'
    ? await getFilesByProjectId(id)
    : []

  const projectActivity = activeTab === 'activity'
    ? await getProjectActivity(id)
    : []

  const tabs = [
    { key: 'overview', label: 'Overview', icon: <ClipboardList size={13} /> },
    { key: 'team', label: 'Team', icon: <Users size={13} /> },
    { key: 'tasks', label: 'Tasks', icon: <CheckSquare size={13} /> },
    { key: 'deliverables', label: 'Deliverables', icon: <FileText size={13} /> },
    { key: 'files', label: 'Files', icon: <FolderOpen size={13} /> },
    { key: 'activity', label: 'Activity', icon: <Activity size={13} /> },
  ]

  return (
    <div>
      {/* Header */}
      <PageHeader
        title={project.name}
        subtitle={`${project.project_code} · ${project.discipline.charAt(0).toUpperCase() + project.discipline.slice(1)} · ${project.project_type.charAt(0).toUpperCase() + project.project_type.slice(1)}`}
        actions={
          canEditProjectMeta ? (
            <Link
              href={`/projects/${project.id}/edit`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-control)',
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: 'var(--color-text-secondary)',
                textDecoration: 'none',
              }}
            >
              <Pencil size={13} aria-hidden="true" />
              Edit Project
            </Link>
          ) : undefined
        }
      />

      <EntityStatusStrip
        statusBadge={<ProjectStatusBadge status={project.status} />}
        priorityBadge={<PriorityBadge priority={project.priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'} />}
        extraBadge={project.waiting_on !== 'none' ? (
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 500,
            color: 'var(--color-warning)',
            backgroundColor: 'var(--color-warning-subtle)',
            padding: '2px 10px',
            borderRadius: '12px',
          }}>
            Waiting: {(project.waiting_on ?? 'none').charAt(0).toUpperCase() + (project.waiting_on ?? 'none').slice(1)}
          </span>
        ) : undefined}
        dueDate={project.target_due_date}
        progress={project.progress_percent}
      />

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '2px solid var(--color-border)',
        marginBottom: '20px',
      }}>
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/projects/${project.id}${t.key === 'overview' ? '' : `?tab=${t.key}`}`}
            style={{
              padding: '10px 16px',
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: activeTab === t.key ? 'var(--color-primary)' : 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              textDecoration: 'none',
              borderBottom: activeTab === t.key ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: '-2px',
            }}
          >
            {t.icon}
            {t.label}
          </Link>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <OverviewTab
          project={project}
          clientName={clientName}
          leadName={leadName}
          reviewerName={reviewerName}
          showClientIntakeLinks={showClientIntakeLinks}
        />
      )}
      {activeTab === 'team' && (
        <TeamTab
          projectId={project.id}
          teamMembers={teamMembers}
          users={users}
          leadName={leadName}
          reviewerName={reviewerName}
          canManageTeam={canEditProjectMeta}
        />
      )}
      {activeTab === 'tasks' && (
        <TasksTab projectId={project.id} tasks={projectTasks} showAddTask={canEditProjectMeta} />
      )}
      {activeTab === 'deliverables' && (
        <DeliverablesTab projectId={project.id} deliverables={projectDeliverables} showAddDeliverable={canEditProjectMeta} />
      )}
      {activeTab === 'files' && (
        <FilesTab
          projectId={project.id}
          files={projectFiles}
          driveFolderLink={project.google_drive_folder_link}
          showAddFile={canEditProjectMeta}
        />
      )}
      {activeTab === 'activity' && (
        <ActivityTab logs={projectActivity} />
      )}
    </div>
  )
}

/* ─── Overview Tab ─────────────────────────────────────────────── */
function OverviewTab({
  project,
  clientName,
  leadName,
  reviewerName,
  showClientIntakeLinks,
}: {
  project: Awaited<ReturnType<typeof getProjectById>> & {}
  clientName: string
  leadName: string
  reviewerName: string | null
  showClientIntakeLinks: boolean
}) {
  if (!project) return null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>
      {/* Left column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Overview */}
        <SectionCard title="Overview">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <DetailRow label="Client">
              {project.clients && showClientIntakeLinks ? (
                <Link
                  href={`/clients/${project.clients.id}`}
                  style={{
                    color: 'var(--color-primary)',
                    textDecoration: 'none',
                    fontWeight: 500,
                    fontSize: '0.8125rem',
                  }}
                >
                  {clientName}
                </Link>
              ) : (
                <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{clientName}</span>
              )}
            </DetailRow>
            <DetailRow label="Source">
              <span style={{ textTransform: 'capitalize' }}>{project.source}</span>
            </DetailRow>
            <DetailRow label="Discipline">
              <span style={{ textTransform: 'capitalize' }}>{project.discipline}</span>
            </DetailRow>
            <DetailRow label="Project Type">
              <span style={{ textTransform: 'capitalize' }}>{project.project_type}</span>
            </DetailRow>
            <DetailRow label="Start Date">
              {formatDate(project.start_date)}
            </DetailRow>
            <DetailRow label="Target Due Date">
              {formatDate(project.target_due_date)}
            </DetailRow>
            {project.actual_completion_date && (
              <DetailRow label="Completed">
                {formatDate(project.actual_completion_date)}
              </DetailRow>
            )}
            <DetailRow label="Waiting On">
              <span style={{ textTransform: 'capitalize' }}>
                {project.waiting_on === 'none' ? '—' : project.waiting_on}
              </span>
            </DetailRow>
          </div>
        </SectionCard>

        {/* Scope */}
        {project.scope_summary && (
          <SectionCard title="Scope Summary">
            <p style={{
              fontSize: '0.8125rem',
              color: 'var(--color-text-secondary)',
              lineHeight: '1.7',
              whiteSpace: 'pre-wrap',
            }}>
              {project.scope_summary}
            </p>
          </SectionCard>
        )}

        {/* Internal Notes */}
        {project.notes_internal && (
          <SectionCard title="Internal Notes">
            <p style={{
              fontSize: '0.8125rem',
              color: 'var(--color-text-secondary)',
              lineHeight: '1.7',
              whiteSpace: 'pre-wrap',
            }}>
              {project.notes_internal}
            </p>
          </SectionCard>
        )}
      </div>

      {/* Right column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Assignment */}
        <SectionCard title="Assignment">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <DetailRow label="Project Lead">{leadName}</DetailRow>
            <DetailRow label="Reviewer">
              {reviewerName ?? <span style={{ color: 'var(--color-text-muted)' }}>Not assigned</span>}
            </DetailRow>
          </div>
        </SectionCard>

        {/* Linked Intake */}
        {project.intakes && (
          <SectionCard title="Linked Intake">
            {showClientIntakeLinks ? (
              <Link
                href={`/intakes/${project.intakes.id}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  textDecoration: 'none',
                }}
              >
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)',
                }}>
                  {project.intakes.intake_code}
                </span>
                <span style={{
                  fontSize: '0.8125rem',
                  color: 'var(--color-primary)',
                  fontWeight: 500,
                }}>
                  {project.intakes.title}
                </span>
              </Link>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)',
                }}>
                  {project.intakes.intake_code}
                </span>
                <span style={{
                  fontSize: '0.8125rem',
                  color: 'var(--color-text-primary)',
                  fontWeight: 500,
                }}>
                  {project.intakes.title}
                </span>
              </div>
            )}
          </SectionCard>
        )}

        {/* External Links */}
        {(project.external_reference_url || project.google_drive_folder_link) && (
          <SectionCard title="Links">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {project.external_reference_url && (
                <a
                  href={project.external_reference_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '0.8125rem',
                    color: 'var(--color-primary)',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    wordBreak: 'break-all',
                  }}
                >
                  <ExternalLink size={13} aria-hidden="true" />
                  External Reference
                </a>
              )}
              {project.google_drive_folder_link && (
                <a
                  href={project.google_drive_folder_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '0.8125rem',
                    color: 'var(--color-primary)',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <FolderOpen size={13} aria-hidden="true" />
                  Google Drive Folder
                </a>
              )}
            </div>
          </SectionCard>
        )}

        {/* Record Info */}
        <SectionCard title="Record Info">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <DetailRow label="Created">{formatDate(project.created_at)}</DetailRow>
            <DetailRow label="Last Updated">{formatDate(project.updated_at)}</DetailRow>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}

/* ─── Team Tab ─────────────────────────────────────────────────── */
function TeamTab({
  projectId,
  teamMembers,
  users,
  leadName,
  reviewerName,
  canManageTeam,
}: {
  projectId: string
  teamMembers: Awaited<ReturnType<typeof getTeamByProjectId>>
  users: Awaited<ReturnType<typeof getUsersForSelect>>
  leadName: string
  reviewerName: string | null
  canManageTeam: boolean
}) {
  const assignedUserIds = teamMembers.map((m) => m.user_id)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>
      {/* Left — team members table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <SectionCard
          title="Team Members"
          actions={
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}
            </span>
          }
          noPadding
        >
          <TeamMemberList members={teamMembers} projectId={projectId} allowRemove={canManageTeam} />
        </SectionCard>

        {canManageTeam && (
          <SectionCard title="Add Team Member">
            <AddTeamMemberForm
              projectId={projectId}
              users={users}
              assignedUserIds={assignedUserIds}
            />
          </SectionCard>
        )}
      </div>

      {/* Right — assignment summary */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <SectionCard title="Project Assignment">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <DetailRow label="Project Lead">{leadName}</DetailRow>
            <DetailRow label="Reviewer">
              {reviewerName ?? <span style={{ color: 'var(--color-text-muted)' }}>Not assigned</span>}
            </DetailRow>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}

/* ─── Tasks Tab ────────────────────────────────────────────────── */
function TasksTab({
  projectId,
  tasks,
  showAddTask,
}: {
  projectId: string
  tasks: TaskWithRelations[]
  showAddTask: boolean
}) {
  const today = new Date().toISOString().split('T')[0]
  const headers = ['Task', 'Category', 'Assigned To', 'Due Date', 'Priority', 'Status', 'Progress']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <SectionCard
        title="Project Tasks"
        actions={
          showAddTask ? (
            <Link
              href={`/tasks/new?project_id=${projectId}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                color: 'var(--color-primary)',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              <Plus size={12} aria-hidden="true" />
              Add Task
            </Link>
          ) : undefined
        }
        noPadding
      >
        {tasks.length === 0 ? (
          <div style={{ padding: '16px' }}>
            <EmptyState compact icon={<CheckSquare size={16} />} title="No tasks created for this project yet." />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {headers.map(h => (
                    <th
                      key={h}
                      style={{
                        padding: '8px 14px',
                        textAlign: 'left',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        color: 'var(--color-text-muted)',
                        backgroundColor: 'var(--color-surface-subtle)',
                        letterSpacing: '0.02em',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.map((task, idx) => {
                  const isOverdue = task.due_date && task.due_date < today && task.status !== 'done'
                  const isBlocked = task.status === 'blocked'

                  return (
                    <tr
                      key={task.id}
                      style={{
                        borderBottom: idx < tasks.length - 1 ? '1px solid var(--color-border)' : undefined,
                        backgroundColor: isBlocked ? 'var(--color-danger-subtle)' : isOverdue ? 'var(--color-warning-subtle)' : undefined,
                        cursor: 'pointer',
                      }}
                    >
                      <td style={{ padding: '8px 14px', maxWidth: '250px' }}>
                        <Link href={`/tasks/${task.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {isOverdue && <AlertTriangle size={12} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />}
                          <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', fontSize: '0.8125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {task.title}
                          </span>
                        </Link>
                      </td>
                      <td style={{ padding: '8px 14px', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>
                        {task.category?.replace(/_/g, ' ') ?? '—'}
                      </td>
                      <td style={{ padding: '8px 14px', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                        {task.assignee?.full_name ?? '—'}
                      </td>
                      <td style={{
                        padding: '8px 14px',
                        fontSize: '0.75rem',
                        color: isOverdue ? 'var(--color-warning)' : 'var(--color-text-muted)',
                        fontWeight: isOverdue ? 600 : 400,
                        whiteSpace: 'nowrap',
                      }}>
                        {formatDate(task.due_date)}
                      </td>
                      <td style={{ padding: '8px 14px' }}>
                        <PriorityBadge priority={task.priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'} />
                      </td>
                      <td style={{ padding: '8px 14px' }}>
                        <TaskStatusBadge status={task.status} />
                      </td>
                      <td style={{ padding: '8px 14px', minWidth: '80px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <ProgressBar value={task.progress_percent} height={5} />
                          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>{task.progress_percent}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  )
}

/* ─── Deliverables Tab ─────────────────────────────────────────── */
function DeliverablesTab({
  projectId,
  deliverables,
  showAddDeliverable,
}: {
  projectId: string
  deliverables: DeliverableWithRelations[]
  showAddDeliverable: boolean
}) {
  const headers = ['Deliverable', 'Type', 'Rev', 'Prepared By', 'Status', 'Submitted', 'File']

  const typeLabels: Record<string, string> = {
    drawing: 'Drawing', '3d_model': '3D Model', report: 'Report', boq: 'BOQ',
    calculation_sheet: 'Calc Sheet', presentation: 'Presentation', specification: 'Specification',
    revision_package: 'Rev Package', submission_package: 'Sub Package',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <SectionCard
        title="Project Deliverables"
        actions={
          showAddDeliverable ? (
            <Link
              href={`/deliverables/new?project_id=${projectId}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                color: 'var(--color-primary)',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              <Plus size={12} aria-hidden="true" />
              Add Deliverable
            </Link>
          ) : undefined
        }
        noPadding
      >
        {deliverables.length === 0 ? (
          <div style={{ padding: '16px' }}>
            <EmptyState compact icon={<FileText size={16} />} title="No deliverables created for this project yet." />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {headers.map(h => (
                    <th
                      key={h}
                      style={{
                        padding: '8px 14px',
                        textAlign: 'left',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        color: 'var(--color-text-muted)',
                        backgroundColor: 'var(--color-surface-subtle)',
                        letterSpacing: '0.02em',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deliverables.map((d, idx) => {
                  const isRevisionRequested = d.status === 'revision_requested'

                  return (
                    <tr
                      key={d.id}
                      style={{
                        borderBottom: idx < deliverables.length - 1 ? '1px solid var(--color-border)' : undefined,
                        backgroundColor: isRevisionRequested ? 'var(--color-danger-subtle)' : undefined,
                        cursor: 'pointer',
                      }}
                    >
                      <td style={{ padding: '8px 14px', maxWidth: '220px' }}>
                        <Link href={`/deliverables/${d.id}`} style={{ textDecoration: 'none' }}>
                          <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', fontSize: '0.8125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                            {d.name}
                          </span>
                        </Link>
                      </td>
                      <td style={{ padding: '8px 14px', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                        {typeLabels[d.type] ?? d.type}
                      </td>
                      <td style={{ padding: '8px 14px' }}>
                        <span style={{
                          fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 600,
                          color: 'var(--color-text-primary)', backgroundColor: 'var(--color-surface-subtle)',
                          padding: '1px 6px', borderRadius: '4px',
                        }}>
                          R{d.revision_number}
                        </span>
                        {d.version_label && (
                          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginLeft: '4px' }}>
                            {d.version_label}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '8px 14px', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                        {d.preparer?.full_name ?? '—'}
                      </td>
                      <td style={{ padding: '8px 14px' }}>
                        <DeliverableStatusBadge status={d.status} />
                      </td>
                      <td style={{ padding: '8px 14px', fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                        {formatDate(d.submitted_to_client_date)}
                      </td>
                      <td style={{ padding: '8px 14px' }}>
                        {d.file_link ? (
                          <a href={d.file_link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>
                            <ExternalLinkIcon size={13} />
                          </a>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  )
}

/* ─── Files Tab ────────────────────────────────────────────────── */
function FilesTab({
  projectId,
  files,
  driveFolderLink,
  showAddFile,
}: {
  projectId: string
  files: FileWithRelations[]
  driveFolderLink: string | null
  showAddFile: boolean
}) {
  const categoryLabels: Record<string, string> = {
    reference: 'Reference', draft: 'Draft', working_file: 'Working File',
    review_copy: 'Review Copy', final: 'Final', submission: 'Submission',
    supporting_document: 'Supporting Doc',
  }
  const headers = ['File', 'Category', 'Provider', 'Rev', 'Uploaded By', 'Added', 'Link']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Drive folder link */}
      {driveFolderLink && (
        <SectionCard title="Project Drive Folder">
          <a
            href={driveFolderLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '0.8125rem', color: 'var(--color-primary)', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: '5px',
            }}
          >
            <FolderOpen size={14} />
            Open project folder in Google Drive
          </a>
        </SectionCard>
      )}

      <SectionCard
        title="Attached Files"
        actions={
          showAddFile ? (
            <Link
              href={`/files/new?project_id=${projectId}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                fontSize: '0.75rem', color: 'var(--color-primary)',
                textDecoration: 'none', fontWeight: 500,
              }}
            >
              <Plus size={12} aria-hidden="true" />
              Add File
            </Link>
          ) : undefined
        }
        noPadding
      >
        {files.length === 0 ? (
          <div style={{ padding: '16px' }}>
            <EmptyState compact icon={<FolderOpen size={16} />} title="No files attached to this project yet." />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {headers.map(h => (
                    <th key={h} style={{
                      padding: '8px 14px', textAlign: 'left', fontSize: '0.6875rem', fontWeight: 600,
                      color: 'var(--color-text-muted)', backgroundColor: 'var(--color-surface-subtle)',
                      letterSpacing: '0.02em', textTransform: 'uppercase', whiteSpace: 'nowrap',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {files.map((f, idx) => {
                  const link = f.manual_link || f.google_web_view_link
                  return (
                    <tr key={f.id} style={{ borderBottom: idx < files.length - 1 ? '1px solid var(--color-border)' : undefined }}>
                      <td style={{ padding: '8px 14px', maxWidth: '220px' }}>
                        <Link href={`/files/${f.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', fontSize: '0.8125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {f.file_name}
                          </span>
                          {f.extension && (
                            <span style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-surface-subtle)', padding: '0 4px', borderRadius: '3px', fontWeight: 600, textTransform: 'uppercase', flexShrink: 0 }}>
                              {f.extension}
                            </span>
                          )}
                        </Link>
                      </td>
                      <td style={{ padding: '8px 14px', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                        {categoryLabels[f.file_category] ?? f.file_category}
                      </td>
                      <td style={{ padding: '8px 14px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '3px',
                          fontSize: '0.6875rem', fontWeight: 500,
                          color: f.provider === 'google_drive' ? 'var(--color-primary)' : 'var(--color-neutral)',
                          backgroundColor: f.provider === 'google_drive' ? 'var(--color-primary-subtle)' : 'var(--color-neutral-subtle)',
                          padding: '2px 8px', borderRadius: '10px',
                        }}>
                          {f.provider === 'google_drive' ? <HardDrive size={10} /> : null}
                          {f.provider === 'google_drive' ? 'Drive' : 'Manual'}
                        </span>
                      </td>
                      <td style={{ padding: '8px 14px' }}>
                        {f.revision_number != null ? (
                          <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-primary)', backgroundColor: 'var(--color-surface-subtle)', padding: '1px 6px', borderRadius: '4px' }}>
                            R{f.revision_number}
                          </span>
                        ) : <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>—</span>}
                      </td>
                      <td style={{ padding: '8px 14px', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                        {f.uploader?.full_name ?? '—'}
                      </td>
                      <td style={{ padding: '8px 14px', fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                        {formatDate(f.created_at)}
                      </td>
                      <td style={{ padding: '8px 14px' }}>
                        {link ? (
                          <a href={link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>
                            <ExternalLinkIcon size={13} />
                          </a>
                        ) : <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  )
}

/* ─── Activity Tab ─────────────────────────────────────────────── */
const ACTION_LABELS: Record<string, string> = {
  created:        'Project created',
  status_updated: 'Status updated',
  converted:      'Converted from intake',
}

function ActivityTab({ logs }: { logs: ActivityLogEntry[] }) {
  if (logs.length === 0) {
    return (
      <SectionCard title="Activity">
        <EmptyState compact icon={<Activity size={16} />} title="No activity recorded for this project yet." />
      </SectionCard>
    )
  }

  return (
    <SectionCard title="Activity" noPadding>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {logs.map((log, idx) => (
          <div
            key={log.id}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '10px',
              padding: '10px 16px',
              borderBottom: idx < logs.length - 1 ? '1px solid var(--color-border)' : undefined,
            }}
          >
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)', fontWeight: 500, flex: 1, minWidth: 0 }}>
              {ACTION_LABELS[log.action_type] ?? log.action_type.replace(/_/g, ' ')}
              {log.note && (
                <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)' }}>
                  {' — '}{log.note}
                </span>
              )}
            </span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {log.actor?.full_name ?? 'System'}
            </span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', flexShrink: 0, minWidth: '80px', textAlign: 'right' }}>
              {formatDate(log.created_at)}
            </span>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

/* ─── Shared Detail Row ────────────────────────────────────────── */
function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '3px', fontWeight: 500 }}>
        {label}
      </p>
      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>{children}</div>
    </div>
  )
}
