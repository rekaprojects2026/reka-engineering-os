-- =============================================================
-- Migration: 0014_role_access_helpers
-- Sprint 04A — Role-Based Access Control Foundation
-- Adds SQL helper functions for system_role-aware access.
-- No new tables. All changes are additive.
-- =============================================================

-- ─── get_my_system_role() ─────────────────────────────────────
-- Returns the system_role of the currently authenticated user.
-- Returns NULL if no profile row exists for the session user.
-- Used for RLS policies and server-side role checks.
CREATE OR REPLACE FUNCTION public.get_my_system_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT system_role
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_my_system_role() IS
  'Returns the system_role of the current authenticated user. NULL if not found.';

-- ─── is_admin_or_coordinator() ────────────────────────────────
-- Convenience predicate for policies allowing both admin and coordinator access.
CREATE OR REPLACE FUNCTION public.is_admin_or_coordinator()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND system_role IN ('admin', 'coordinator')
  );
$$;

COMMENT ON FUNCTION public.is_admin_or_coordinator() IS
  'Returns true if the current user has system_role admin or coordinator.';

-- ─── Update compensation_records RLS ──────────────────────────
-- Add coordinator read access (coordinators need to see comp records
-- for projects they are assigned to — full enforcement in Sprint 04B queries,
-- but read-level RLS can be opened here safely).
-- Note: admin full-access policy already exists from Sprint 03.

DROP POLICY IF EXISTS "compensation_records: coordinator read" ON public.compensation_records;
CREATE POLICY "compensation_records: coordinator read"
  ON public.compensation_records FOR SELECT
  USING (public.is_admin_or_coordinator());

-- ─── Note on project assignment roles ────────────────────────
-- project_team_assignments.team_role (lead/reviewer/executor/support)
-- is intentionally separate from profiles.system_role.
-- system_role = global app access tier.
-- team_role   = role within a specific project context.
-- These must never be merged or conflated.
-- =============================================================
