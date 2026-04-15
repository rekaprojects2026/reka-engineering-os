-- =============================================================
-- Migration: 0008_deliverables
-- Stage 04B — Deliverables module
-- Creates: deliverables table, RLS, indexes
-- =============================================================

-- ─── Deliverables ─────────────────────────────────────────────
create table if not exists public.deliverables (
  id                          uuid primary key default uuid_generate_v4(),

  project_id                  uuid not null references public.projects(id) on delete cascade,
  linked_task_id              uuid references public.tasks(id) on delete set null,

  name                        text not null,

  type                        text not null
                                check (type in (
                                  'drawing','3d_model','report','boq','calculation_sheet',
                                  'presentation','specification','revision_package','submission_package'
                                )),

  revision_number             int not null default 0,
  version_label               text,
  description                 text,

  status                      text not null default 'draft'
                                check (status in (
                                  'draft','internal_review','ready_to_submit','sent_to_client',
                                  'revision_requested','approved','final_issued'
                                )),

  prepared_by_user_id         uuid not null references public.profiles(id),
  reviewed_by_user_id         uuid references public.profiles(id),

  submitted_to_client_date    date,
  approved_date               date,

  client_feedback_summary     text,
  file_link                   text,

  created_by                  uuid not null references public.profiles(id),
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

comment on table public.deliverables is
  'Project outputs tracked through review, revision, and final issuance.';

-- ─── updated_at trigger ───────────────────────────────────────
create trigger deliverables_updated_at
  before update on public.deliverables
  for each row execute function public.set_updated_at();

-- ─── Indexes ──────────────────────────────────────────────────
create index if not exists deliverables_project_id_idx          on public.deliverables(project_id);
create index if not exists deliverables_prepared_by_user_id_idx on public.deliverables(prepared_by_user_id);
create index if not exists deliverables_status_idx              on public.deliverables(status);
create index if not exists deliverables_linked_task_id_idx      on public.deliverables(linked_task_id);

-- ─── Row Level Security ───────────────────────────────────────
alter table public.deliverables enable row level security;

create policy "deliverables: authenticated read"
  on public.deliverables for select
  using (auth.uid() is not null);

create policy "deliverables: authenticated insert"
  on public.deliverables for insert
  with check (auth.uid() is not null);

create policy "deliverables: authorized update"
  on public.deliverables for update
  using (
    created_by = auth.uid()
    or prepared_by_user_id = auth.uid()
    or public.is_admin()
  );

create policy "deliverables: authorized delete"
  on public.deliverables for delete
  using (
    created_by = auth.uid()
    or public.is_admin()
  );

-- =============================================================
