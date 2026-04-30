// Global search — role-scoped ilike queries across core entities.
// Called from the /search server component.

import { createServerClient } from '@/lib/supabase/server'
import {
  canAccessClients,
  canAccessIntakes,
  effectiveRole,
  isFreelancer,
  isMember,
  isSenior,
} from '@/lib/auth/permissions'
import type { SessionProfile } from '@/lib/auth/session'
import { getViewableProjectIdsForUser } from '@/lib/projects/queries'

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

export async function globalSearch(profile: SessionProfile, rawQuery: string): Promise<SearchResults> {
  const q = rawQuery.trim()

  const empty: SearchResults = {
    query: q,
    total: 0,
    clients: [], intakes: [], projects: [], tasks: [], deliverables: [],
  }

  // Require at least 2 characters to avoid returning everything
  if (!q || q.length < 2) return empty

  const supabase = await createServerClient()
  const r = effectiveRole(profile.system_role)
  const includeClients = canAccessClients(profile.system_role)
  const includeIntakes = canAccessIntakes(profile.system_role)
  const viewableProjectIds = await getViewableProjectIdsForUser(profile.id, profile.system_role)

  const clientsPromise = includeClients
    ? supabase
        .from('clients')
        .select('id, client_code, client_name, client_type, status')
        .or(`client_name.ilike.%${q}%,client_code.ilike.%${q}%,primary_contact_name.ilike.%${q}%`)
        .order('client_name', { ascending: true })
        .limit(RESULTS_PER_ENTITY)
    : Promise.resolve({ data: [] as ClientResult[] })

  const intakesPromise = includeIntakes
    ? supabase
        .from('intakes')
        .select('id, intake_code, title, status, source, temp_client_name, clients(client_name)')
        .or(`title.ilike.%${q}%,intake_code.ilike.%${q}%,temp_client_name.ilike.%${q}%`)
        .order('created_at', { ascending: false })
        .limit(RESULTS_PER_ENTITY)
    : Promise.resolve({ data: [] as IntakeResult[] })

  let projectsQuery = supabase
    .from('projects')
    .select('id, project_code, name, status, priority, target_due_date, clients(client_name)')
    .order('created_at', { ascending: false })
    .limit(RESULTS_PER_ENTITY)

  if (q.length >= 3) {
    projectsQuery = projectsQuery.textSearch('search_tsv', q, { type: 'websearch', config: 'simple' })
  } else {
    projectsQuery = projectsQuery.or(`name.ilike.${q}%,project_code.ilike.${q}%`)
  }

  if (isSenior(r)) {
    projectsQuery = projectsQuery.eq('reviewer_user_id', profile.id)
  } else if (viewableProjectIds !== null) {
    if (viewableProjectIds.length === 0) {
      projectsQuery = supabase
        .from('projects')
        .select('id, project_code, name, status, priority, target_due_date, clients(client_name)')
        .limit(0)
    } else {
      projectsQuery = projectsQuery.in('id', viewableProjectIds)
    }
  }

  let tasksQuery = supabase
    .from('tasks')
    .select('id, title, status, priority, due_date, projects(id, project_code, name)')
    .order('created_at', { ascending: false })
    .limit(RESULTS_PER_ENTITY)

  if (q.length >= 3) {
    tasksQuery = tasksQuery.textSearch('title_tsv', q, { type: 'websearch', config: 'simple' })
  } else {
    tasksQuery = tasksQuery.ilike('title', `${q}%`)
  }

  if (isMember(r) || isFreelancer(r)) {
    tasksQuery = tasksQuery.eq('assigned_to_user_id', profile.id)
  } else if (isSenior(r)) {
    tasksQuery = tasksQuery.eq('reviewer_user_id', profile.id)
  } else if (viewableProjectIds !== null) {
    if (viewableProjectIds.length === 0) {
      tasksQuery = supabase
        .from('tasks')
        .select('id, title, status, priority, due_date, projects(id, project_code, name)')
        .limit(0)
    } else {
      tasksQuery = tasksQuery.in('project_id', viewableProjectIds)
    }
  }

  let deliverablesQuery = supabase
    .from('deliverables')
    .select('id, name, status, type, projects(id, project_code, name)')
    .ilike('name', `%${q}%`)
    .order('created_at', { ascending: false })
    .limit(RESULTS_PER_ENTITY)

  if (isMember(r) || isFreelancer(r)) {
    deliverablesQuery = deliverablesQuery.eq('prepared_by_user_id', profile.id)
  } else if (isSenior(r)) {
    deliverablesQuery = deliverablesQuery.eq('reviewed_by_user_id', profile.id)
  } else if (viewableProjectIds !== null) {
    if (viewableProjectIds.length === 0) {
      deliverablesQuery = supabase
        .from('deliverables')
        .select('id, name, status, type, projects(id, project_code, name)')
        .limit(0)
    } else {
      deliverablesQuery = deliverablesQuery.in('project_id', viewableProjectIds)
    }
  }

  const [clients, intakes, projects, tasks, deliverables] = await Promise.all([
    clientsPromise,
    intakesPromise,
    projectsQuery,
    tasksQuery,
    deliverablesQuery,
  ])

  const results: SearchResults = {
    query:        q,
    clients:      (clients.data      ?? []) as unknown as ClientResult[],
    intakes:      (intakes.data      ?? []) as unknown as IntakeResult[],
    projects:     (projects.data     ?? []) as unknown as ProjectResult[],
    tasks:        (tasks.data        ?? []) as unknown as TaskResult[],
    deliverables: (deliverables.data ?? []) as unknown as DeliverableResult[],
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
