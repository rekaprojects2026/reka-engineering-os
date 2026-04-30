-- Optional Google account email for Drive folder sharing (may differ from login email).

alter table public.profiles
  add column if not exists google_email text;

comment on column public.profiles.google_email is
  'Google account email for Drive sharing when different from login email.';
