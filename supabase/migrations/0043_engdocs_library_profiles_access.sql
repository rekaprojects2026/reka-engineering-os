-- =============================================================
-- Migration: 0043_engdocs_library_profiles_access
-- Lets Document-app library admins (super_admin / doc_admin)
-- list and update public.profiles for the EngDocs admin UI.
-- Uses permissive RLS OR with existing self-service policies.
-- =============================================================

CREATE POLICY engdocs_library_mgmt_profiles_select
  ON public.profiles FOR SELECT TO authenticated
  USING (engdocs.library_is_management());

CREATE POLICY engdocs_library_mgmt_profiles_update
  ON public.profiles FOR UPDATE TO authenticated
  USING (engdocs.library_is_management())
  WITH CHECK (engdocs.library_is_management());
