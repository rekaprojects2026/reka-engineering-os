-- Per-assignment discipline on project team (null = all disciplines on the project).

alter table public.project_team_assignments
  add column if not exists discipline text;

comment on column public.project_team_assignments.discipline is
  'Discipline this member covers on the project (mechanical, civil, etc.). NULL = all / unspecified.';
