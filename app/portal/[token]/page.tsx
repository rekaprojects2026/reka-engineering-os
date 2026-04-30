import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import {
  ClientPortalView,
  type ClientPortalDeliverableRow,
  type ClientPortalProjectPayload,
  type ClientPortalTaskRow,
} from '@/components/modules/portal/ClientPortalView'

interface PageProps {
  params: Promise<{ token: string }>
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function parsePortalPayload(raw: unknown): {
  project: ClientPortalProjectPayload
  tasks: ClientPortalTaskRow[]
  deliverables: ClientPortalDeliverableRow[]
} | null {
  if (!isRecord(raw)) return null
  const project = raw.project
  const tasks = raw.tasks
  const deliverables = raw.deliverables
  if (!isRecord(project)) return null
  if (!Array.isArray(tasks) || !Array.isArray(deliverables)) return null

  const p: ClientPortalProjectPayload = {
    id: String(project.id ?? ''),
    name: String(project.name ?? ''),
    status: String(project.status ?? ''),
    project_code: String(project.project_code ?? ''),
    progress_percent: Number(project.progress_percent ?? 0),
    start_date: String(project.start_date ?? ''),
    target_due_date: String(project.target_due_date ?? ''),
    client_name: String(project.client_name ?? ''),
  }

  const taskRows: ClientPortalTaskRow[] = tasks
    .filter(isRecord)
    .map((t) => ({
      id: String(t.id ?? ''),
      title: String(t.title ?? ''),
      status: String(t.status ?? ''),
      due_date: t.due_date != null ? String(t.due_date) : null,
      priority: String(t.priority ?? ''),
    }))

  const delRows: ClientPortalDeliverableRow[] = deliverables
    .filter(isRecord)
    .map((d) => ({
      id: String(d.id ?? ''),
      name: String(d.name ?? ''),
      type: String(d.type ?? ''),
      status: String(d.status ?? ''),
      client_date: d.client_date != null ? String(d.client_date) : null,
    }))

  return { project: p, tasks: taskRows, deliverables: delRows }
}

export default async function ClientPortalPage({ params }: PageProps) {
  const { token } = await params
  if (!token || token.length < 8) notFound()

  const supabase = await createServerClient()
  const { data: raw, error } = await supabase.rpc('client_portal_fetch', { p_token: token })

  let data: unknown = raw
  if (typeof raw === 'string') {
    try {
      data = JSON.parse(raw) as unknown
    } catch {
      data = null
    }
  }

  if (error || data == null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-background)] px-6 text-center">
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Link tidak tersedia</h1>
        <p className="mt-2 max-w-md text-[0.875rem] text-[var(--color-text-muted)]">
          Link ini tidak valid, sudah dinonaktifkan, atau sudah kadaluarsa. Hubungi tim Reka untuk mendapatkan tautan
          terbaru.
        </p>
      </div>
    )
  }

  const parsed = parsePortalPayload(data)
  if (!parsed) notFound()

  return <ClientPortalView project={parsed.project} tasks={parsed.tasks} deliverables={parsed.deliverables} />
}
