-- ============================================================
-- Webhook endpoints + delivery logs
-- ============================================================

create table if not exists public.webhook_endpoints (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) >= 1),
  url         text not null check (url like 'https://%'),
  secret      text not null check (char_length(secret) >= 1),
  events      text[] not null,
  is_active   boolean not null default true,
  created_by  uuid references public.profiles(id),
  created_at  timestamptz not null default now()
);

create table if not exists public.webhook_delivery_logs (
  id              uuid primary key default gen_random_uuid(),
  webhook_id      uuid not null references public.webhook_endpoints(id) on delete cascade,
  event_type      text not null,
  payload         jsonb not null,
  response_status integer,
  response_body   text,
  error           text,
  delivered_at    timestamptz not null default now(),
  duration_ms     integer
);

create index if not exists webhook_delivery_logs_webhook_id_idx on public.webhook_delivery_logs(webhook_id);
create index if not exists webhook_delivery_logs_delivered_at_idx on public.webhook_delivery_logs(delivered_at desc);

alter table public.webhook_endpoints enable row level security;
alter table public.webhook_delivery_logs enable row level security;

create policy "webhook_endpoints_all"
  on public.webhook_endpoints for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and system_role = 'direktur'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and system_role = 'direktur'
    )
  );

create policy "webhook_delivery_logs_select"
  on public.webhook_delivery_logs for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and system_role = 'direktur'
    )
  );
