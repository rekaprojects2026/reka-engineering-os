-- =============================================================
-- Migration: 0013_compensation_and_payments
-- Sprint 03 — Compensation and Payment Tracking (IDR)
-- Creates compensation_records and payment_records tables.
-- =============================================================

-- ─── compensation_records ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.compensation_records (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id        uuid          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id       uuid          NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id          uuid          REFERENCES public.tasks(id) ON DELETE SET NULL,
  deliverable_id   uuid          REFERENCES public.deliverables(id) ON DELETE SET NULL,
  rate_type        text          NOT NULL
    CHECK (rate_type IN ('hourly','daily','per_task','per_deliverable','per_project')),
  qty              numeric(10,2) NOT NULL DEFAULT 1,
  rate_amount      numeric(15,2) NOT NULL DEFAULT 0,
  subtotal_amount  numeric(15,2) NOT NULL DEFAULT 0,
  currency_code    text          NOT NULL DEFAULT 'IDR',
  status           text          NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','confirmed','paid','cancelled')),
  period_label     text,
  work_date        date,
  notes            text,
  created_by       uuid          REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at       timestamptz   NOT NULL DEFAULT now(),
  updated_at       timestamptz   NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.compensation_records IS
  'Work-based compensation items — tracks what is owed to a member for specific work.';

CREATE INDEX IF NOT EXISTS comp_records_member_idx
  ON public.compensation_records (member_id);
CREATE INDEX IF NOT EXISTS comp_records_project_idx
  ON public.compensation_records (project_id);
CREATE INDEX IF NOT EXISTS comp_records_status_idx
  ON public.compensation_records (status);

CREATE TRIGGER set_compensation_records_updated_at
  BEFORE UPDATE ON public.compensation_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.compensation_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "compensation_records: admin all"
  ON public.compensation_records
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "compensation_records: member read own"
  ON public.compensation_records FOR SELECT
  USING (member_id = auth.uid());

-- ─── payment_records ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payment_records (
  id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id         uuid          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  period_label      text,
  total_due         numeric(15,2) NOT NULL DEFAULT 0,
  total_paid        numeric(15,2) NOT NULL DEFAULT 0,
  balance           numeric(15,2) NOT NULL DEFAULT 0,
  currency_code     text          NOT NULL DEFAULT 'IDR',
  payment_status    text          NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid','partial','paid')),
  payment_date      date,
  payment_method    text,
  payment_reference text,
  proof_link        text,
  notes             text,
  created_by        uuid          REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at        timestamptz   NOT NULL DEFAULT now(),
  updated_at        timestamptz   NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.payment_records IS
  'Payment tracking entries — tracks amounts due, paid, and balance per member per period.';

CREATE INDEX IF NOT EXISTS pay_records_member_idx
  ON public.payment_records (member_id);
CREATE INDEX IF NOT EXISTS pay_records_status_idx
  ON public.payment_records (payment_status);

CREATE TRIGGER set_payment_records_updated_at
  BEFORE UPDATE ON public.payment_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_records: admin all"
  ON public.payment_records
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "payment_records: member read own"
  ON public.payment_records FOR SELECT
  USING (member_id = auth.uid());

-- =============================================================
