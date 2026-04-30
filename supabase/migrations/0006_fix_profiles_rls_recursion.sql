-- =============================================================
-- Migration: 0006_fix_profiles_rls_recursion
-- Fix: Replace recursive admin-read policy on profiles
-- The original policy queried profiles within a profiles policy,
-- causing infinite recursion. Uses a SECURITY DEFINER function
-- to bypass RLS when checking admin status.
-- =============================================================

-- ─── Helper function to check admin status (bypasses RLS) ─────
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ─── Drop the recursive policy ───────────────────────────────
drop policy if exists "profiles: admin read all" on public.profiles;

-- ─── Recreate with non-recursive check ───────────────────────
create policy "profiles: admin read all"
  on public.profiles for select
  using (public.is_admin());

-- =============================================================
