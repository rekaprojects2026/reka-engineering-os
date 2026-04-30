-- =============================================================
-- Migration: 0002_clients
-- Stage 02A — Clients module
-- =============================================================

-- ─── Clients ──────────────────────────────────────────────────
create table if not exists public.clients (
  id                     uuid primary key default uuid_generate_v4(),
  client_code            text not null unique,
  client_name            text not null,
  client_type            text not null default 'company'
                           check (client_type in ('company','individual','freelancer','government','other')),
  source_default         text not null default 'direct'
                           check (source_default in ('upwork','fiverr','direct','referral','other')),
  primary_contact_name   text,
  primary_contact_email  text,
  primary_contact_phone  text,
  company_name           text,
  notes                  text,
  status                 text not null default 'lead'
                           check (status in ('lead','active','inactive','archived')),
  created_by             uuid not null references public.profiles(id),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

comment on table public.clients is
  'Companies and individuals commissioning engineering work.';

-- Auto-generate client_code: CLT-YYYYMM-NNNN
create or replace function public.generate_client_code()
returns trigger language plpgsql as $$
declare
  prefix text;
  seq    int;
begin
  prefix := 'CLT-' || to_char(now(), 'YYYYMM') || '-';
  select coalesce(max(
    cast(split_part(client_code, '-', 3) as int)
  ), 0) + 1
  into seq
  from public.clients
  where client_code like prefix || '%';

  new.client_code := prefix || lpad(seq::text, 4, '0');
  return new;
end;
$$;

create trigger clients_set_code
  before insert on public.clients
  for each row
  when (new.client_code = '' or new.client_code is null)
  execute function public.generate_client_code();

-- updated_at trigger
create trigger clients_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

-- ─── Row Level Security ───────────────────────────────────────
alter table public.clients enable row level security;

-- All authenticated users can view clients
create policy "clients: authenticated read"
  on public.clients for select
  using (auth.uid() is not null);

-- Only users who created a client (or admins) can update
create policy "clients: creator or admin update"
  on public.clients for update
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Any authenticated user can insert
create policy "clients: authenticated insert"
  on public.clients for insert
  with check (auth.uid() is not null);

-- =============================================================
