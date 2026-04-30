-- =============================================================
-- Migration: 0021_project_approval_workflow
-- Stage B — PENDING_APPROVAL / REJECTED + approval columns + RLS
-- Status values are lowercase to match existing projects.status.
-- =============================================================

-- ─── 1a. Extend status CHECK ───────────────────────────────────

ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;

ALTER TABLE public.projects ADD CONSTRAINT projects_status_check CHECK (
  status IN (
    'pending_approval',
    'rejected',
    'new',
    'ready_to_start',
    'ongoing',
    'internal_review',
    'waiting_client',
    'in_revision',
    'on_hold',
    'completed',
    'cancelled'
  )
);

-- ─── 1b. Approval columns ────────────────────────────────────

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS approval_requested_at timestamptz;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS approval_reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS approval_reviewed_at timestamptz;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS rejection_note text;

COMMENT ON COLUMN public.projects.rejection_note IS
  'Director rejection reason when status is rejected.';
COMMENT ON COLUMN public.projects.approval_requested_at IS
  'First submission for approval (or resubmit after rejection).';

-- ─── 1c. RLS — replace legacy creator/admin update policy ────

DROP POLICY IF EXISTS "projects: creator or admin update" ON public.projects;

-- Direktur: full update (including pending_approval approve/reject paths)
CREATE POLICY "projects: direktur can update all"
  ON public.projects FOR UPDATE
  USING (public.is_direktur())
  WITH CHECK (public.is_direktur());

-- Ops lead: update when not frozen; TD any non-pending project; manajer own lead or assignment
CREATE POLICY "projects: ops lead can update non pending"
  ON public.projects FOR UPDATE
  USING (
    public.is_ops_lead()
    AND status IS DISTINCT FROM 'pending_approval'
    AND (
      public.is_technical_director()
      OR project_lead_user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.project_team_assignments pta
        WHERE pta.project_id = projects.id AND pta.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    public.is_ops_lead()
    AND (
      public.is_technical_director()
      OR project_lead_user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.project_team_assignments pta
        WHERE pta.project_id = projects.id AND pta.user_id = auth.uid()
      )
    )
  );

-- =============================================================
