import Link from 'next/link'
import {
  Search,
  Users,
  ClipboardList,
  FolderKanban,
  CheckSquare,
  FileText,
} from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { ClientStatusBadge } from '@/components/modules/clients/ClientStatusBadge'
import { IntakeStatusBadge } from '@/components/modules/intakes/IntakeStatusBadge'
import { ProjectStatusBadge } from '@/components/modules/projects/ProjectStatusBadge'
import { TaskStatusBadge } from '@/components/modules/tasks/TaskStatusBadge'
import { DeliverableStatusBadge } from '@/components/modules/deliverables/DeliverableStatusBadge'
import { formatDate } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils/cn'

import { getSessionProfile } from '@/lib/auth/session'
import {
  globalSearch,
  type ClientResult,
  type IntakeResult,
  type ProjectResult,
  type TaskResult,
  type DeliverableResult,
} from '@/lib/search/queries'

export const metadata = { title: 'Search — ReKa Engineering OS' }

interface PageProps {
  searchParams: Promise<{ q?: string }>
}

const ROW_CLASS =
  'flex items-center gap-3 px-4 py-2.5 no-underline transition-colors hover:bg-[var(--color-surface-muted)]'

const searchInputClass =
  'h-9 w-full max-w-md rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-9 pr-3 text-[0.8125rem] text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-subtle)]'

function SearchField({ defaultQuery }: { defaultQuery: string }) {
  return (
    <form action="/search" method="get" className="relative max-w-md" role="search">
      <Search
        size={14}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
        aria-hidden="true"
      />
      <input
        type="search"
        name="q"
        defaultValue={defaultQuery}
        placeholder="Search clients, projects, tasks…"
        minLength={2}
        className={searchInputClass}
        aria-label="Search query"
      />
    </form>
  )
}

function CountBadge({ n }: { n: number }) {
  return <StatusBadge label={String(n)} variant="neutral" />
}

function Rows({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col divide-y divide-[var(--color-border)]">{children}</div>
}

function ClientsSection({ results }: { results: ClientResult[] }) {
  return (
    <SectionCard title="Clients" actions={<CountBadge n={results.length} />} noPadding>
      <Rows>
        {results.map((r) => (
          <Link key={r.id} href={`/clients/${r.id}`} className={ROW_CLASS}>
            <Users size={14} className="shrink-0 text-[var(--color-text-muted)]" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate text-[0.8125rem] font-medium text-[var(--color-text-primary)]">
              {r.client_name}
            </span>
            <span className="shrink-0 whitespace-nowrap font-mono text-[0.6875rem] text-[var(--color-text-muted)]">
              {r.client_code}
            </span>
            <ClientStatusBadge status={r.status} />
            <span className="min-w-[72px] shrink-0 text-right text-[0.6875rem] capitalize text-[var(--color-text-muted)]">
              {r.client_type.replace(/_/g, ' ')}
            </span>
          </Link>
        ))}
      </Rows>
    </SectionCard>
  )
}

function IntakesSection({ results }: { results: IntakeResult[] }) {
  return (
    <SectionCard title="Intakes" actions={<CountBadge n={results.length} />} noPadding>
      <Rows>
        {results.map((r) => {
          const clientLabel = r.clients?.client_name ?? r.temp_client_name ?? null
          return (
            <Link key={r.id} href={`/intakes/${r.id}`} className={ROW_CLASS}>
              <ClipboardList size={14} className="shrink-0 text-[var(--color-text-muted)]" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-[0.8125rem] font-medium text-[var(--color-text-primary)]">
                {r.title}
              </span>
              <span className="shrink-0 whitespace-nowrap font-mono text-[0.6875rem] text-[var(--color-text-muted)]">
                {r.intake_code}
              </span>
              <IntakeStatusBadge status={r.status} />
              {clientLabel && (
                <span className="max-w-[140px] shrink-0 truncate text-[0.6875rem] text-[var(--color-text-muted)]">
                  {clientLabel}
                </span>
              )}
              <span className="shrink-0 capitalize text-[0.6875rem] text-[var(--color-text-muted)]">{r.source}</span>
            </Link>
          )
        })}
      </Rows>
    </SectionCard>
  )
}

function ProjectsSection({ results }: { results: ProjectResult[] }) {
  const today = new Date().toISOString().split('T')[0]

  return (
    <SectionCard title="Projects" actions={<CountBadge n={results.length} />} noPadding>
      <Rows>
        {results.map((r) => {
          const isOverdue =
            r.target_due_date < today && !['completed', 'cancelled'].includes(r.status)
          return (
            <Link key={r.id} href={`/projects/${r.id}`} className={ROW_CLASS}>
              <FolderKanban size={14} className="shrink-0 text-[var(--color-text-muted)]" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-[0.8125rem] font-medium text-[var(--color-text-primary)]">
                {r.name}
              </span>
              <span className="shrink-0 whitespace-nowrap font-mono text-[0.6875rem] text-[var(--color-text-muted)]">
                {r.project_code}
              </span>
              <ProjectStatusBadge status={r.status} />
              <PriorityBadge priority={r.priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'} />
              {r.clients?.client_name && (
                <span className="max-w-[120px] shrink-0 truncate text-[0.6875rem] text-[var(--color-text-muted)]">
                  {r.clients.client_name}
                </span>
              )}
              <span
                className={cn(
                  'shrink-0 whitespace-nowrap text-[0.6875rem]',
                  isOverdue ? 'font-semibold text-[var(--color-warning)]' : 'text-[var(--color-text-muted)]',
                )}
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

function TasksSection({ results }: { results: TaskResult[] }) {
  const today = new Date().toISOString().split('T')[0]

  return (
    <SectionCard title="Tasks" actions={<CountBadge n={results.length} />} noPadding>
      <Rows>
        {results.map((r) => {
          const isOverdue = r.due_date && r.due_date < today && r.status !== 'done'
          return (
            <Link key={r.id} href={`/tasks/${r.id}`} className={ROW_CLASS}>
              <CheckSquare size={14} className="shrink-0 text-[var(--color-text-muted)]" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-[0.8125rem] font-medium text-[var(--color-text-primary)]">
                {r.title}
              </span>
              {r.projects && (
                <span className="shrink-0 whitespace-nowrap font-mono text-[0.6875rem] text-[var(--color-text-muted)]">
                  {r.projects.project_code}
                </span>
              )}
              <TaskStatusBadge status={r.status} />
              <PriorityBadge priority={r.priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'} />
              {r.due_date && (
                <span
                  className={cn(
                    'shrink-0 whitespace-nowrap text-[0.6875rem]',
                    isOverdue ? 'font-semibold text-[var(--color-warning)]' : 'text-[var(--color-text-muted)]',
                  )}
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

function DeliverablesSection({ results }: { results: DeliverableResult[] }) {
  return (
    <SectionCard title="Deliverables" actions={<CountBadge n={results.length} />} noPadding>
      <Rows>
        {results.map((r) => (
          <Link key={r.id} href={`/deliverables/${r.id}`} className={ROW_CLASS}>
            <FileText size={14} className="shrink-0 text-[var(--color-text-muted)]" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate text-[0.8125rem] font-medium text-[var(--color-text-primary)]">
              {r.name}
            </span>
            {r.projects && (
              <span className="shrink-0 whitespace-nowrap font-mono text-[0.6875rem] text-[var(--color-text-muted)]">
                {r.projects.project_code}
              </span>
            )}
            <DeliverableStatusBadge status={r.status} />
            <span className="shrink-0 capitalize text-[0.6875rem] text-[var(--color-text-muted)]">
              {r.type.replace(/_/g, ' ')}
            </span>
          </Link>
        ))}
      </Rows>
    </SectionCard>
  )
}

export default async function SearchPage({ searchParams }: PageProps) {
  const profile = await getSessionProfile()
  const { q } = await searchParams
  const query = q?.trim() ?? ''

  if (!query || query.length < 2) {
    return (
      <div>
        <PageHeader title="Search" subtitle="Find clients, intakes, projects, tasks, and deliverables." />
        <div className="mb-4">
          <SearchField defaultQuery={query} />
        </div>
        <SectionCard>
          <EmptyState
            compact
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

  const results = await globalSearch(profile, query)

  if (results.total === 0) {
    return (
      <div>
        <PageHeader title={`Search: "${query}"`} subtitle="No matching records found." />
        <div className="mb-4">
          <SearchField defaultQuery={query} />
        </div>
        <SectionCard>
          <EmptyState
            compact
            icon={<Search size={22} />}
            title={`No results for "${query}"`}
            description="Try a different search term, or check the spelling. Search covers client names, project codes, task titles, and deliverable names."
          />
        </SectionCard>
      </div>
    )
  }

  const plural = results.total === 1 ? 'result' : 'results'

  return (
    <div>
      <PageHeader
        title={`Search: "${query}"`}
        subtitle={`${results.total} ${plural} across ${[
          results.clients.length > 0 && 'clients',
          results.intakes.length > 0 && 'intakes',
          results.projects.length > 0 && 'projects',
          results.tasks.length > 0 && 'tasks',
          results.deliverables.length > 0 && 'deliverables',
        ]
          .filter(Boolean)
          .join(', ')}.`}
      />
      <div className="mb-4">
        <SearchField defaultQuery={query} />
      </div>

      <div className="flex flex-col gap-4">
        {results.clients.length > 0 && <ClientsSection results={results.clients} />}
        {results.intakes.length > 0 && <IntakesSection results={results.intakes} />}
        {results.projects.length > 0 && <ProjectsSection results={results.projects} />}
        {results.tasks.length > 0 && <TasksSection results={results.tasks} />}
        {results.deliverables.length > 0 && <DeliverablesSection results={results.deliverables} />}
      </div>
    </div>
  )
}
