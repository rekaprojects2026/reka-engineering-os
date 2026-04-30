-- =============================================================
-- Migration: 0012_invites_and_profile_completion
-- Sprint 02 — Invite / Onboarding
-- Creates invites table and adds profile completion tracking.
-- =============================================================

-- ─── Add profile completion fields to profiles ───────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_completed_at  timestamptz,
  ADD COLUMN IF NOT EXISTS skill_tags            text[] NOT NULL DEFAULT '{}';

-- Backfill: profiles that already exist were admin-managed — mark as complete
UPDATE public.profiles
  SET profile_completed_at = created_at
  WHERE profile_completed_at IS NULL;

-- ─── Invites table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invites (
  id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  email        text         NOT NULL,
  token        uuid         NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  full_name    text,
  system_role  text         CHECK (system_role IN ('admin', 'coordinator', 'reviewer', 'member')),
  worker_type  text         CHECK (worker_type IN ('internal', 'freelancer', 'subcontractor')),
  invited_by   uuid         REFERENCES public.profiles(id) ON DELETE SET NULL,
  status       text         NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  invited_at   timestamptz  NOT NULL DEFAULT now(),
  accepted_at  timestamptz,
  expires_at   timestamptz  NOT NULL DEFAULT (now() + INTERVAL '7 days')
);

COMMENT ON TABLE public.invites IS
  'Admin-created invite records for the invite-only onboarding flow.';

-- ─── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS invites_token_idx  ON public.invites (token);
CREATE INDEX IF NOT EXISTS invites_status_idx ON public.invites (status);
CREATE INDEX IF NOT EXISTS invites_email_idx  ON public.invites (email);

-- ─── Row Level Security ───────────────────────────────────────
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- Admins manage all invites
CREATE POLICY "invites: admin all"
  ON public.invites
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Note: activation endpoint uses service-role client and bypasses RLS.

-- =============================================================
