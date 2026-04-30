-- ============================================================
-- API keys for public REST API + request audit log
-- ============================================================

create table if not exists public.api_keys (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(name) >= 1),
  key_hash     text not null unique,
  key_prefix   text not null,
  created_by   uuid references public.profiles(id),
  last_used_at timestamptz,
  expires_at   timestamptz,
  is_active    boolean not null default true,
  scopes       text[] not null default '{}',
  created_at   timestamptz not null default now()
);

create index if not exists api_keys_key_hash_idx on public.api_keys(key_hash);
create index if not exists api_keys_created_by_idx on public.api_keys(created_by);

alter table public.api_keys enable row level security;

create policy "api_keys_select"
  on public.api_keys for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and system_role = 'direktur'
    )
  );

create policy "api_keys_insert"
  on public.api_keys for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and system_role = 'direktur'
    )
  );

create policy "api_keys_update"
  on public.api_keys for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and system_role = 'direktur'
    )
  );

create policy "api_keys_delete"
  on public.api_keys for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and system_role = 'direktur'
    )
  );

create table if not exists public.api_request_logs (
  id          uuid primary key default gen_random_uuid(),
  api_key_id  uuid references public.api_keys(id) on delete set null,
  method      text,
  path        text,
  status_code integer,
  ip_address  text,
  created_at  timestamptz not null default now()
);

create index if not exists api_request_logs_api_key_id_idx on public.api_request_logs(api_key_id);
create index if not exists api_request_logs_created_at_idx on public.api_request_logs(created_at desc);

alter table public.api_request_logs enable row level security;
