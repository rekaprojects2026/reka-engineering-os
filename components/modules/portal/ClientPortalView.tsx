import { formatDate } from '@/lib/utils/formatters'
import { ProgressBar } from '@/components/shared/ProgressBar'

export type ClientPortalProjectPayload = {
  id: string
  name: string
  status: string
  project_code: string
  progress_percent: number
  start_date: string
  target_due_date: string
  client_name: string
}

export type ClientPortalTaskRow = {
  id: string
  title: string
  status: string
  due_date: string | null
  priority: string
}

export type ClientPortalDeliverableRow = {
  id: string
  name: string
  type: string
  status: string
  client_date: string | null
}

interface ClientPortalViewProps {
  project: ClientPortalProjectPayload
  tasks: ClientPortalTaskRow[]
  deliverables: ClientPortalDeliverableRow[]
}

export function ClientPortalView({ project, tasks, deliverables }: ClientPortalViewProps) {
  const total = tasks.length
  const done = tasks.filter((t) => t.status === 'done').length
  const pct = total > 0 ? Math.round((done / total) * 100) : project.progress_percent ?? 0

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-8">
        <p className="mb-1 text-[0.75rem] font-semibold uppercase tracking-wider text-[var(--color-primary)]">
          Reka Engineering
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
        <p className="mt-2 text-[0.875rem] text-[var(--color-text-muted)]">
          {project.project_code}
          {project.client_name ? ` · ${project.client_name}` : ''}
        </p>
      </header>

      <main className="mx-auto max-w-4xl space-y-10 px-6 py-10">
        <section>
          <h2 className="mb-3 text-[1rem] font-semibold">Progress</h2>
          <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <div className="mb-2 flex justify-between text-[0.8125rem]">
              <span>Tasks completed</span>
              <span className="font-mono text-[var(--color-text-secondary)]">
                {done} / {total}
              </span>
            </div>
            <ProgressBar value={pct} height={8} tone="primary" />
            <p className="mt-2 text-[0.75rem] text-[var(--color-text-muted)]">{pct}% selesai</p>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-[1rem] font-semibold">Tasks</h2>
          <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
            <table className="w-full border-collapse text-[0.8125rem]">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] text-left text-[0.6875rem] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  <th className="px-4 py-2">Task</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Due</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-[var(--color-text-muted)]">
                      No tasks.
                    </td>
                  </tr>
                ) : (
                  tasks.map((t) => (
                    <tr key={t.id} className="border-b border-[var(--color-border)] last:border-0">
                      <td className="px-4 py-2 font-medium">{t.title}</td>
                      <td className="px-4 py-2 capitalize text-[var(--color-text-secondary)]">{t.status.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-2 text-[var(--color-text-muted)]">{t.due_date ? formatDate(t.due_date) : '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-[1rem] font-semibold">Deliverables</h2>
          <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
            <table className="w-full border-collapse text-[0.8125rem]">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] text-left text-[0.6875rem] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Client date</th>
                </tr>
              </thead>
              <tbody>
                {deliverables.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-[var(--color-text-muted)]">
                      No deliverables.
                    </td>
                  </tr>
                ) : (
                  deliverables.map((d) => (
                    <tr key={d.id} className="border-b border-[var(--color-border)] last:border-0">
                      <td className="px-4 py-2 font-medium">{d.name}</td>
                      <td className="px-4 py-2 text-[var(--color-text-secondary)]">{d.type.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-2 capitalize text-[var(--color-text-secondary)]">{d.status.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-2 text-[var(--color-text-muted)]">
                        {d.client_date ? formatDate(d.client_date) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--color-border)] px-6 py-6 text-center text-[0.75rem] text-[var(--color-text-muted)]">
        Powered by Reka Engineering OS · Last updated {new Date().toLocaleDateString()}
      </footer>
    </div>
  )
}
