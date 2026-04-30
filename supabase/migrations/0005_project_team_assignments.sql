-- =============================================================
-- Migration: 0005_project_team_assignments
-- Stage 03B — Project team assignment
-- Creates: project_team_assignments table, RLS, indexes
-- =============================================================

-- ─── Project Team Assignments ─────────────────────────────────
create table if not exists public.project_team_assignments (
  id           uuid primary key default uuid_generate_v4(),
  project_id   uuid not null references public.projects(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,

  team_role    text not null default 'engineer'
                 check (team_role in ('lead','engineer','drafter','checker','support')),

  assigned_at  timestamptz not null default now(),

  -- Prevent duplicate user on same project
  unique (project_id, user_id)
);

comment on table public.project_team_assignments is
  'Membership of users on projects with their team role.';

-- ─── Indexes ──────────────────────────────────────────────────
create index if not exists pta_project_id_idx on public.project_team_assignments(project_id);
create index if not exists pta_user_id_idx    on public.project_team_assignments(user_id);

-- ─── Row Level Security ───────────────────────────────────────
alter table public.project_team_assignments enable row level security;

-- All authenticated users can view team assignments
create policy "pta: authenticated read"
  on public.project_team_assignments for select
  using (auth.uid() is not null);

-- Any authenticated user can insert team assignments
create policy "pta: authenticated insert"
  on public.project_team_assignments for insert
  with check (auth.uid() is not null);

-- Any authenticated user can delete team assignments
create policy "pta: authenticated delete"
  on public.project_team_assignments for delete
  using (auth.uid() is not null);

-- =============================================================
