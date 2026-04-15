import type { CSSProperties } from 'react'
import Link from 'next/link'
import {
  Search,
  Users,
  ClipboardList,
  FolderKanban,
  CheckSquare,
  FileText,
} from 'lucide-react'

import { PageHeader }  from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { EmptyState }  from '@/components/shared/EmptyState'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { ClientStatusBadge }      from '@/components/modules/clients/ClientStatusBadge'
import { IntakeStatusBadge }      from '@/components/modules/intakes/IntakeStatusBadge'
import { ProjectStatusBadge }     from '@/components/modules/projects/ProjectStatusBadge'
import { TaskStatusBadge }        from '@/components/modules/tasks/TaskStatusBadge'
import { DeliverableStatusBadge } from '@/components/modules/deliverables/DeliverableStatusBadge'
import { formatDate } from '@/lib/utils/formatters'

import {
  globalSearch,
  type ClientResult,
  type IntakeResult,
  type ProjectResult,
  type TaskResult,
  type DeliverableResult,
} from '@/lib/search/queries'

export const metadata = { title: 'Search — Engineering Agency OS' }

interface PageProps {
  searchParams: Promise<{ q?: string }>
}

// ── Shared row style ──────────────────────────────────────────────────────────

// Applied as className so hover works (Tailwind)
const ROW_CLASS = 'flex items-center gap-3 px-4 py-2.5 no-underline hover:bg-[#F8FAFC] transition-colors'

const PRIMARY_TEXT: CSSProperties = {
  fontWeight: 500,
  fontSize:   '0.8125rem',
  color:      'var(--color-text-primary)',
  flex:       1,
  minWidth:   0,
  overflow:   'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const META_TEXT: CSSProperties = {
  fontSize:    '0.6875rem',
  color:       'var(--color-text-muted)',
  whiteSpace:  'nowrap',
  flexShrink:  0,
}

const CODE_TEXT: CSSProperties = {
  fontSize:    '0.6875rem',
  color:       'var(--color-text-muted)',
  fontFamily:  'monospace',
  whiteSpace:  'nowrap',
  flexShrink:  0,
}

const ICON_STYLE: CSSProperties = {
  color:     'var(--color-text-muted)',
  flexShrink: 0,
}

// ── Section header badge ──────────────────────────────────────────────────────

function CountBadge({ n }: { n: number }) {
  return (
    <span
      style={{
        fontSize:        '0.6875rem',
        fontWeight:      600,
        color:           'var(--color-text-muted)',
        backgroundColor: 'var(--color-surface-subtle)',
        border:          '1px solid var(--color-border)',
        borderRadius:    '9999px',
        padding:         '1px 7px',
      }}
    >
      {n}
    </span>
  )
}

// ── Divider between rows ──────────────────────────────────────────────────────

function Rows({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col divide-y divide-[#E2E8F0]">
      {children}
    </div>
  )
}

// ── Clients section ───────────────────────────────────────────────────────────

function ClientsSection({ results }: { results: ClientResult[] }) {
  return (
    <SectionCard title="Clients" actions={<CountBadge n={results.length} />} noPadding>
      <Rows>
        {results.map((r) => (
          <Link key={r.id} href={`/clients/${r.id}`} className={ROW_CLASS}>
            <Users size={14} style={ICON_STYLE} aria-hidden="true" />
            <span style={PRIMARY_TEXT}>{r.client_name}</span>
            <span style={CODE_TEXT}>{r.client_code}</span>
            <ClientStatusBadge status={r.status} />
            <span style={{ ...META_TEXT, minWidth: '72px', textAlign: 'right', textTransform: 'capitalize' }}>
              {r.client_type.replace(/_/g, ' ')}
            </span>
          </Link>
        ))}
      </Rows>
    </SectionCard>
  )
}

// ── Intakes section ───────────────────────────────────────────────────────────

function IntakesSection({ results }: { results: IntakeResult[] }) {
  return (
    <SectionCard title="Intakes" actions={<CountBadge n={results.length} />} noPadding>
      <Rows>
        {results.map((r) => {
          const clientLabel = r.clients?.client_name ?? r.temp_client_name ?? null
          return (
            <Link key={r.id} href={`/intakes/${r.id}`} className={ROW_CLASS}>
              <ClipboardList size={14} style={ICON_STYLE} aria-hidden="true" />
              <span style={PRIMARY_TEXT}>{r.title}</span>
              <span style={CODE_TEXT}>{r.intake_code}</span>
              <IntakeStatusBadge status={r.status} />
              {clientLabel && (
                <span style={{ ...META_TEXT, maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {clientLabel}
                </span>
              )}
              <span style={{ ...META_TEXT, textTransform: 'capitalize' }}>
                {r.source}
              </span>
            </Link>
          )
        })}
      </Rows>
    </SectionCard>
  )
}

// ── Projects section ──────────────────────────────────────────────────────────

function ProjectsSection({ results }: { results: ProjectResult[] }) {
  const today = new Date().toISOString().split('T')[0]

  return (
    <SectionCard title="Projects" actions={<CountBadge n={results.length} />} noPadding>
      <Rows>
        {results.map((r) => {
          const isOverdue = r.target_due_date < today &&
            !['completed', 'cancelled'].includes(r.status)
          return (
            <Link key={r.id} href={`/projects/${r.id}`} className={ROW_CLASS}>
              <FolderKanban size={14} style={ICON_STYLE} aria-hidden="true" />
              <span style={PRIMARY_TEXT}>{r.name}</span>
              <span style={CODE_TEXT}>{r.project_code}</span>
              <ProjectStatusBadge status={r.status} />
              <PriorityBadge priority={r.priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'} />
              {r.clients?.client_name && (
                <span style={{ ...META_TEXT, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {r.clients.client_name}
                </span>
              )}
              <span
                style={{
                  ...META_TEXT,
                  color: isOverdue ? '#DC2626' : 'var(--color-text-muted)',
                  fontWeight: isOverdue ? 600 : 400,
                }}
              >
                {formatDate(r.target_due_date)}
              </span>
            </Link>
          )
        })}
      </Rows>
    </SectionCard>
  )
}

// ── Tasks section ─────────────────────────────────────────────────────────────

function TasksSection({ results }: { results: TaskResult[] }) {
  const today = new Date().toISOString().split('T')[0]

  return (
    <SectionCard title="Tasks" actions={<CountBadge n={results.length} />} noPadding>
      <Rows>
        {results.map((r) => {
          const isOverdue = r.due_date && r.due_date < today && r.status !== 'done'
          return (
            <Link key={r.id} href={`/tasks/${r.id}`} className={ROW_CLASS}>
              <CheckSquare size={14} style={ICON_STYLE} aria-hidden="true" />
              <span style={PRIMARY_TEXT}>{r.title}</span>
              {r.projects && (
                <span style={CODE_TEXT}>{r.projects.project_code}</span>
              )}
              <TaskStatusBadge status={r.status} />
              <PriorityBadge priority={r.priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'} />
              {r.due_date && (
                <span
                  style={{
                    ...META_TEXT,
                    color:      isOverdue ? '#DC2626' : 'var(--color-text-muted)',
                    fontWeight: isOverdue ? 600 : 400,
                  }}
                >
                  {formatDate(r.due_date)}
                </span>
              )}
            </Link>
          )
        })}
      </Rows>
    </SectionCard>
  )
}

// ── Deliverables section ──────────────────────────────────────────────────────

function DeliverablesSection({ results }: { results: DeliverableResult[] }) {
  return (
    <SectionCard title="Deliverables" actions={<CountBadge n={results.length} />} noPadding>
      <Rows>
        {results.map((r) => (
          <Link key={r.id} href={`/deliverables/${r.id}`} className={ROW_CLASS}>
            <FileText size={14} style={ICON_STYLE} aria-hidden="true" />
            <span style={PRIMARY_TEXT}>{r.name}</span>
            {r.projects && (
              <span style={CODE_TEXT}>{r.projects.project_code}</span>
            )}
            <DeliverableStatusBadge status={r.status} />
            <span style={{ ...META_TEXT, textTransform: 'capitalize' }}>
              {r.type.replace(/_/g, ' ')}
            </span>
          </Link>
        ))}
      </Rows>
    </SectionCard>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function SearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams
  const query  = q?.trim() ?? ''

  // ── Prompt state: no query or too short ──────────────────────────────────
  if (!query || query.length < 2) {
    return (
      <div>
        <PageHeader
          title="Search"
          subtitle="Find clients, intakes, projects, tasks, and deliverables."
        />
        <SectionCard>
          <EmptyState
            icon={<Search size={22} />}
            title="Type to search"
            description={
              query.length === 1
                ? 'Enter at least 2 characters to start searching.'
                : 'Use the search bar above, or press / from any page to focus it quickly.'
            }
          />
        </SectionCard>
      </div>
    )
  }

  // ── Run search ────────────────────────────────────────────────────────────
  const results = await globalSearch(query)

  // ── No results ────────────────────────────────────────────────────────────
  if (results.total === 0) {
    return (
      <div>
        <PageHeader
          title={`Search: "${query}"`}
          subtitle="No matching records found."
        />
        <SectionCard>
          <EmptyState
            icon={<Search size={22} />}
            title={`No results for "${query}"`}
            description="Try a different search term, or check the spelling. Search covers client names, project codes, task titles, and deliverable names."
          />
        </SectionCard>
      </div>
    )
  }

  // ── Results ───────────────────────────────────────────────────────────────
  const plural = results.total === 1 ? 'result' : 'results'

  return (
    <div>
      <PageHeader
        title={`Search: "${query}"`}
        subtitle={`${results.total} ${plural} across ${[
          results.clients.length      > 0 && 'clients',
          results.intakes.length      > 0 && 'intakes',
          results.projects.length     > 0 && 'projects',
          results.tasks.length        > 0 && 'tasks',
          results.deliverables.length > 0 && 'deliverables',
        ].filter(Boolean).join(', ')}.`}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {results.clients.length      > 0 && <ClientsSection      results={results.clients}      />}
        {results.intakes.length      > 0 && <IntakesSection      results={results.intakes}      />}
        {results.projects.length     > 0 && <ProjectsSection     results={results.projects}     />}
        {results.tasks.length        > 0 && <TasksSection        results={results.tasks}        />}
        {results.deliverables.length > 0 && <DeliverablesSection results={results.deliverables} />}
      </div>
    </div>
  )
}
