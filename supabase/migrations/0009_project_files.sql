-- =============================================================
-- Migration: 0009_project_files
-- Stage 04C — Files module (Drive-ready scaffolding)
-- Creates: project_files table, RLS, indexes
-- =============================================================

-- ─── Project Files ────────────────────────────────────────────
create table if not exists public.project_files (
  id                   uuid primary key default uuid_generate_v4(),

  project_id           uuid not null references public.projects(id) on delete cascade,
  task_id              uuid references public.tasks(id) on delete set null,
  deliverable_id       uuid references public.deliverables(id) on delete set null,

  file_name            text not null,

  file_category        text not null default 'working_file'
                         check (file_category in (
                           'reference','draft','working_file','review_copy',
                           'final','submission','supporting_document'
                         )),

  provider             text not null default 'manual'
                         check (provider in ('manual','google_drive')),

  -- Manual / external link (always available)
  manual_link          text,

  -- Google Drive-specific (nullable until Drive integration is live)
  external_file_id     text,
  google_drive_folder_id text,
  google_web_view_link text,

  mime_type            text,
  extension            text,

  revision_number      int,
  version_label        text,

  notes                text,

  uploaded_by_user_id  uuid not null references public.profiles(id),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

comment on table public.project_files is
  'File metadata records linked to projects, tasks, and deliverables. Supports manual links now and Google Drive integration later.';

-- ─── updated_at trigger ───────────────────────────────────────
create trigger project_files_updated_at
  before update on public.project_files
  for each row execute function public.set_updated_at();

-- ─── Indexes ──────────────────────────────────────────────────
create index if not exists project_files_project_id_idx     on public.project_files(project_id);
create index if not exists project_files_task_id_idx        on public.project_files(task_id);
create index if not exists project_files_deliverable_id_idx on public.project_files(deliverable_id);
create index if not exists project_files_provider_idx       on public.project_files(provider);

-- ─── Row Level Security ───────────────────────────────────────
alter table public.project_files enable row level security;

create policy "project_files: authenticated read"
  on public.project_files for select
  using (auth.uid() is not null);

create policy "project_files: authenticated insert"
  on public.project_files for insert
  with check (auth.uid() is not null);

create policy "project_files: authorized update"
  on public.project_files for update
  using (
    uploaded_by_user_id = auth.uid()
    or public.is_admin()
  );

create policy "project_files: authorized delete"
  on public.project_files for delete
  using (
    uploaded_by_user_id = auth.uid()
    or public.is_admin()
  );

-- =============================================================
