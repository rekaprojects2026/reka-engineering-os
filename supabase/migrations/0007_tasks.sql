-- =============================================================
-- Migration: 0007_tasks
-- Stage 04A — Tasks module
-- Creates: tasks table, auto-code trigger, RLS, indexes
-- =============================================================

-- ─── Tasks ────────────────────────────────────────────────────
create table if not exists public.tasks (
  id                    uuid primary key default uuid_generate_v4(),

  project_id            uuid not null references public.projects(id) on delete cascade,
  parent_task_id        uuid references public.tasks(id) on delete set null,

  title                 text not null,
  description           text,

  category              text
                          check (category in (
                            'brief_review','reference_collection','modeling','drafting',
                            'calculation','checking','boq','report_writing',
                            'revision','coordination','submission_prep','admin'
                          )),

  phase                 text,

  assigned_to_user_id   uuid not null references public.profiles(id),
  reviewer_user_id      uuid references public.profiles(id),

  start_date            date,
  due_date              date,
  completed_date        date,

  estimated_hours       numeric(8,2),
  actual_hours          numeric(8,2),

  priority              text not null default 'medium'
                          check (priority in ('low','medium','high','urgent')),

  status                text not null default 'to_do'
                          check (status in (
                            'to_do','in_progress','review','revision','blocked','done'
                          )),

  progress_percent      int not null default 0
                          check (progress_percent >= 0 and progress_percent <= 100),

  blocked_reason        text,
  drive_link            text,
  notes                 text,

  created_by            uuid not null references public.profiles(id),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table public.tasks is
  'Executable work items belonging to projects.';

-- ─── updated_at trigger ───────────────────────────────────────
create trigger tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- ─── Indexes ──────────────────────────────────────────────────
create index if not exists tasks_project_id_idx          on public.tasks(project_id);
create index if not exists tasks_assigned_to_user_id_idx on public.tasks(assigned_to_user_id);
create index if not exists tasks_status_idx              on public.tasks(status);
create index if not exists tasks_due_date_idx            on public.tasks(due_date);
create index if not exists tasks_parent_task_id_idx      on public.tasks(parent_task_id);

-- ─── Row Level Security ───────────────────────────────────────
alter table public.tasks enable row level security;

-- All authenticated users can view tasks
create policy "tasks: authenticated read"
  on public.tasks for select
  using (auth.uid() is not null);

-- Any authenticated user can insert tasks
create policy "tasks: authenticated insert"
  on public.tasks for insert
  with check (auth.uid() is not null);

-- Creator, assignee, or admin can update
create policy "tasks: authorized update"
  on public.tasks for update
  using (
    created_by = auth.uid()
    or assigned_to_user_id = auth.uid()
    or public.is_admin()
  );

-- Creator or admin can delete
create policy "tasks: authorized delete"
  on public.tasks for delete
  using (
    created_by = auth.uid()
    or public.is_admin()
  );

-- =============================================================
