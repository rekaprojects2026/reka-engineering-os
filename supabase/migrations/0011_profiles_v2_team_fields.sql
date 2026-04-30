-- =============================================================
-- Migration: 0011_profiles_v2_team_fields
-- Sprint 01 — Team / Freelancer module
-- Extends profiles with V2 team and freelancer fields.
-- All changes are additive — no existing columns modified.
-- =============================================================

-- ─── Extend profiles with V2 team/freelancer fields ──────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone                text,
  ADD COLUMN IF NOT EXISTS system_role          text
    CHECK (system_role IN ('admin', 'coordinator', 'reviewer', 'member')),
  ADD COLUMN IF NOT EXISTS functional_role      text,
  ADD COLUMN IF NOT EXISTS worker_type          text
    CHECK (worker_type IN ('internal', 'freelancer', 'subcontractor')),
  ADD COLUMN IF NOT EXISTS active_status        text NOT NULL DEFAULT 'active'
    CHECK (active_status IN ('active', 'inactive', 'archived')),
  ADD COLUMN IF NOT EXISTS availability_status  text NOT NULL DEFAULT 'available'
    CHECK (availability_status IN ('available', 'partially_available', 'unavailable', 'on_leave')),
  ADD COLUMN IF NOT EXISTS joined_date          date,
  ADD COLUMN IF NOT EXISTS expected_rate        numeric(15,2),
  ADD COLUMN IF NOT EXISTS approved_rate        numeric(15,2),
  ADD COLUMN IF NOT EXISTS rate_type            text
    CHECK (rate_type IN ('hourly', 'daily', 'per_task', 'per_deliverable', 'per_project', 'monthly_fixed')),
  ADD COLUMN IF NOT EXISTS currency_code        text NOT NULL DEFAULT 'IDR',
  ADD COLUMN IF NOT EXISTS city                 text,
  ADD COLUMN IF NOT EXISTS portfolio_link       text,
  ADD COLUMN IF NOT EXISTS notes_internal       text,
  -- Payment fields — stored now, used in Sprint 03
  ADD COLUMN IF NOT EXISTS bank_name            text,
  ADD COLUMN IF NOT EXISTS bank_account_name    text,
  ADD COLUMN IF NOT EXISTS bank_account_number  text,
  ADD COLUMN IF NOT EXISTS ewallet_type         text,
  ADD COLUMN IF NOT EXISTS ewallet_number       text;

-- ─── Backfill active_status for existing rows ─────────────────
-- is_active=true  → active_status='active'
-- is_active=false → active_status='inactive'
UPDATE public.profiles
  SET active_status = CASE WHEN is_active THEN 'active' ELSE 'inactive' END
  WHERE active_status = 'active'; -- default was just set; align with existing boolean

-- ─── RLS: allow admin to update any profile ───────────────────
-- Without this, session-based server actions can only update own profile.
DROP POLICY IF EXISTS "profiles: admin update all" ON public.profiles;

CREATE POLICY "profiles: admin update all"
  ON public.profiles FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─── RLS: allow admin to insert profiles ─────────────────────
-- Needed when admin creates a member record directly.
DROP POLICY IF EXISTS "profiles: admin insert" ON public.profiles;

CREATE POLICY "profiles: admin insert"
  ON public.profiles FOR INSERT
  WITH CHECK (public.is_admin());

-- =============================================================
