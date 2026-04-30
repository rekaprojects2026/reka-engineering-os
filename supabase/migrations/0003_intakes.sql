-- =============================================================
-- Migration: 0003_intakes
-- Stage 02B — Intakes module
-- =============================================================

-- ─── Intakes ──────────────────────────────────────────────────
create table if not exists public.intakes (
  id                    uuid primary key default uuid_generate_v4(),
  intake_code           text not null unique,

  -- Client link: nullable — intake can exist before a client record is created
  client_id             uuid references public.clients(id) on delete set null,
  temp_client_name      text,           -- used when no client record exists yet

  source                text not null default 'direct'
                          check (source in ('upwork','fiverr','direct','referral','other')),
  external_reference_url text,

  title                 text not null,
  short_brief           text,

  discipline            text not null default 'mechanical'
                          check (discipline in ('mechanical','civil','structural','electrical','other')),
  project_type          text not null default 'design'
                          check (project_type in ('design','analysis','drawing','consultation','inspection','other')),

  proposed_deadline     date,
  budget_estimate       numeric(12,2),
  estimated_complexity  text
                          check (estimated_complexity in ('low','medium','high','unknown')),

  qualification_notes   text,

  status                text not null default 'new'
                          check (status in ('new','awaiting_info','qualified','rejected','converted')),

  received_date         date not null default current_date,

  created_by            uuid not null references public.profiles(id),

  -- Populated when intake is converted to a project (Stage 03)
  converted_project_id  uuid,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table public.intakes is
  'Incoming project opportunities before they are converted into projects.';

-- ─── Constraint: must have either client_id OR temp_client_name ──
alter table public.intakes
  add constraint intakes_client_identity_required
    check (client_id is not null or (temp_client_name is not null and temp_client_name <> ''));

-- ─── Auto-generate intake_code: INT-YYYYMM-NNNN ───────────────
create or replace function public.generate_intake_code()
returns trigger language plpgsql as $$
declare
  prefix text;
  seq    int;
begin
  prefix := 'INT-' || to_char(now(), 'YYYYMM') || '-';
  select coalesce(max(
    cast(split_part(intake_code, '-', 3) as int)
  ), 0) + 1
  into seq
  from public.intakes
  where intake_code like prefix || '%';

  new.intake_code := prefix || lpad(seq::text, 4, '0');
  return new;
end;
$$;

create trigger intakes_set_code
  before insert on public.intakes
  for each row
  when (new.intake_code = '' or new.intake_code is null)
  execute function public.generate_intake_code();

-- ─── updated_at trigger ───────────────────────────────────────
create trigger intakes_updated_at
  before update on public.intakes
  for each row execute function public.set_updated_at();

-- ─── Indexes ──────────────────────────────────────────────────
create index if not exists intakes_client_id_idx      on public.intakes(client_id);
create index if not exists intakes_status_idx         on public.intakes(status);
create index if not exists intakes_received_date_idx  on public.intakes(received_date desc);

-- ─── Row Level Security ───────────────────────────────────────
alter table public.intakes enable row level security;

-- All authenticated users can view intakes
create policy "intakes: authenticated read"
  on public.intakes for select
  using (auth.uid() is not null);

-- Any authenticated user can insert intakes
create policy "intakes: authenticated insert"
  on public.intakes for insert
  with check (auth.uid() is not null);

-- Creator or admin can update
create policy "intakes: creator or admin update"
  on public.intakes for update
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- =============================================================
