// Global search — runs five parallel ilike queries across core entities.
// Called from the /search server component.

import { createServerClient } from '@/lib/supabase/server'

// ── Result types ──────────────────────────────────────────────────────────────

export type ClientResult = {
  id:          string
  client_code: string
  client_name: string
  client_type: string
  status:      string
}

export type IntakeResult = {
  id:               string
  intake_code:      string
  title:            string
  status:           string
  source:           string
  temp_client_name: string | null
  clients:          { client_name: string } | null
}

export type ProjectResult = {
  id:              string
  project_code:    string
  name:            string
  status:          string
  priority:        string
  target_due_date: string
  clients:         { client_name: string } | null
}

export type TaskResult = {
  id:       string
  title:    string
  status:   string
  priority: string
  due_date: string | null
  projects: { id: string; project_code: string; name: string } | null
}

export type DeliverableResult = {
  id:       string
  name:     string
  status:   string
  type:     string
  projects: { id: string; project_code: string; name: string } | null
}

export type SearchResults = {
  query:        string
  total:        number
  clients:      ClientResult[]
  intakes:      IntakeResult[]
  projects:     ProjectResult[]
  tasks:        TaskResult[]
  deliverables: DeliverableResult[]
}

// ── Query ─────────────────────────────────────────────────────────────────────

const RESULTS_PER_ENTITY = 6

export async function globalSearch(rawQuery: string): Promise<SearchResults> {
  const q = rawQuery.trim()

  const empty: SearchResults = {
    query: q,
    total: 0,
    clients: [], intakes: [], projects: [], tasks: [], deliverables: [],
  }

  // Require at least 2 characters to avoid returning everything
  if (!q || q.length < 2) return empty

  const supabase = await createServerClient()

  const [clients, intakes, projects, tasks, deliverables] = await Promise.all([
    // Clients — name, code, or contact name
    supabase
      .from('clients')
      .select('id, client_code, client_name, client_type, status')
      .or(`client_name.ilike.%${q}%,client_code.ilike.%${q}%,primary_contact_name.ilike.%${q}%`)
      .order('client_name', { ascending: true })
      .limit(RESULTS_PER_ENTITY),

    // Intakes — title, code, or temp client name
    supabase
      .from('intakes')
      .select('id, intake_code, title, status, source, temp_client_name, clients(client_name)')
      .or(`title.ilike.%${q}%,intake_code.ilike.%${q}%,temp_client_name.ilike.%${q}%`)
      .order('created_at', { ascending: false })
      .limit(RESULTS_PER_ENTITY),

    // Projects — name or code
    supabase
      .from('projects')
      .select('id, project_code, name, status, priority, target_due_date, clients(client_name)')
      .or(`name.ilike.%${q}%,project_code.ilike.%${q}%`)
      .order('created_at', { ascending: false })
      .limit(RESULTS_PER_ENTITY),

    // Tasks — title only (description search would need full-text index)
    supabase
      .from('tasks')
      .select('id, title, status, priority, due_date, projects(id, project_code, name)')
      .ilike('title', `%${q}%`)
      .order('created_at', { ascending: false })
      .limit(RESULTS_PER_ENTITY),

    // Deliverables — name only
    supabase
      .from('deliverables')
      .select('id, name, status, type, projects(id, project_code, name)')
      .ilike('name', `%${q}%`)
      .order('created_at', { ascending: false })
      .limit(RESULTS_PER_ENTITY),
  ])

  const results: SearchResults = {
    query:        q,
    clients:      (clients.data      ?? []) as ClientResult[],
    intakes:      (intakes.data      ?? []) as IntakeResult[],
    projects:     (projects.data     ?? []) as ProjectResult[],
    tasks:        (tasks.data        ?? []) as TaskResult[],
    deliverables: (deliverables.data ?? []) as DeliverableResult[],
    total:        0,
  }

  results.total =
    results.clients.length +
    results.intakes.length +
    results.projects.length +
    results.tasks.length +
    results.deliverables.length

  return results
}
