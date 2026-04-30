-- =============================================================
-- Migration: 0004_projects
-- Stage 03A — Projects module
-- Creates: projects table, auto-code trigger, RLS, indexes
-- =============================================================

-- ─── Projects ─────────────────────────────────────────────────
create table if not exists public.projects (
  id                       uuid primary key default uuid_generate_v4(),
  project_code             text not null unique,

  client_id                uuid not null references public.clients(id) on delete restrict,
  intake_id                uuid references public.intakes(id) on delete set null,

  name                     text not null,

  source                   text not null default 'direct'
                             check (source in ('upwork','fiverr','direct','referral','other')),
  external_reference_url   text,

  discipline               text not null default 'mechanical'
                             check (discipline in ('mechanical','civil','structural','electrical','other')),
  project_type             text not null default 'design'
                             check (project_type in ('design','analysis','drawing','consultation','inspection','other')),

  scope_summary            text,

  start_date               date not null default current_date,
  target_due_date          date not null,
  actual_completion_date   date,

  project_lead_user_id     uuid not null references public.profiles(id),
  reviewer_user_id         uuid references public.profiles(id),

  priority                 text not null default 'medium'
                             check (priority in ('low','medium','high','urgent')),

  status                   text not null default 'new'
                             check (status in (
                               'new','ready_to_start','ongoing','internal_review',
                               'waiting_client','in_revision','on_hold','completed','cancelled'
                             )),

  progress_percent         int not null default 0
                             check (progress_percent >= 0 and progress_percent <= 100),

  waiting_on               text not null default 'none'
                             check (waiting_on in ('none','internal','client','vendor')),

  google_drive_folder_id   text,
  google_drive_folder_link text,

  notes_internal           text,

  created_by               uuid not null references public.profiles(id),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

comment on table public.projects is
  'Active and historical engineering project work.';

-- ─── Auto-generate project_code: PRJ-YYYYMM-NNNN ─────────────
create or replace function public.generate_project_code()
returns trigger language plpgsql as $$
declare
  prefix text;
  seq    int;
begin
  prefix := 'PRJ-' || to_char(now(), 'YYYYMM') || '-';
  select coalesce(max(
    cast(split_part(project_code, '-', 3) as int)
  ), 0) + 1
  into seq
  from public.projects
  where project_code like prefix || '%';

  new.project_code := prefix || lpad(seq::text, 4, '0');
  return new;
end;
$$;

create trigger projects_set_code
  before insert on public.projects
  for each row
  when (new.project_code = '' or new.project_code is null)
  execute function public.generate_project_code();

-- ─── updated_at trigger ───────────────────────────────────────
create trigger projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- ─── Indexes ──────────────────────────────────────────────────
create index if not exists projects_client_id_idx         on public.projects(client_id);
create index if not exists projects_intake_id_idx         on public.projects(intake_id);
create index if not exists projects_status_idx            on public.projects(status);
create index if not exists projects_target_due_date_idx   on public.projects(target_due_date);
create index if not exists projects_lead_user_id_idx      on public.projects(project_lead_user_id);

-- ─── FK: intakes.converted_project_id → projects ──────────────
-- The column already exists from 0003_intakes; add the FK reference
alter table public.intakes
  add constraint intakes_converted_project_id_fk
    foreign key (converted_project_id) references public.projects(id)
    on delete set null;

-- ─── Row Level Security ───────────────────────────────────────
alter table public.projects enable row level security;

-- All authenticated users can view projects
create policy "projects: authenticated read"
  on public.projects for select
  using (auth.uid() is not null);

-- Any authenticated user can insert projects
create policy "projects: authenticated insert"
  on public.projects for insert
  with check (auth.uid() is not null);

-- Creator or admin can update
create policy "projects: creator or admin update"
  on public.projects for update
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- =============================================================
