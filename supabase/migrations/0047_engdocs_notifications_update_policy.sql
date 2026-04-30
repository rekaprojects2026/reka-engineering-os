-- ============================================================
-- Migration: 0047_engdocs_notifications_update_policy
-- Phase 02 — Allow authenticated users to mark own EngDocs notifications read from OS
-- ============================================================

DROP POLICY IF EXISTS "engdocs_notifications_update_own" ON engdocs.notifications;

CREATE POLICY "engdocs_notifications_update_own"
  ON engdocs.notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
