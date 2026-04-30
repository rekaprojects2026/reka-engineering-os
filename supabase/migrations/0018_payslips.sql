-- =============================================================
-- Migration: 0018_payslips
-- Employee payslips (slip gaji) per profile per period
-- =============================================================

CREATE TABLE IF NOT EXISTS public.payslips (
  id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  payslip_code        text          UNIQUE NOT NULL,
  profile_id          uuid          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  period_month        integer       NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year         integer       NOT NULL CHECK (period_year > 2020),
  base_amount         numeric(15,2) NOT NULL DEFAULT 0,
  currency            text          NOT NULL DEFAULT 'IDR',
  bonus_amount        numeric(15,2) NOT NULL DEFAULT 0,
  deduction_amount    numeric(15,2) NOT NULL DEFAULT 0,
  net_amount          numeric(15,2) GENERATED ALWAYS AS (base_amount + bonus_amount - deduction_amount) STORED,
  payment_account_id  uuid          REFERENCES public.payment_accounts(id) ON DELETE SET NULL,
  status              text          NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','sent','paid')),
  notes               text,
  generated_by        uuid          REFERENCES public.profiles(id) ON DELETE SET NULL,
  paid_at             timestamptz,
  created_at          timestamptz   NOT NULL DEFAULT now(),
  updated_at          timestamptz   NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.payslips IS
  'Employee payslip per calendar month; net_amount is derived from base + bonus - deduction.';

CREATE INDEX IF NOT EXISTS idx_payslips_profile
  ON public.payslips (profile_id, period_year, period_month);

CREATE TRIGGER set_payslips_updated_at
  BEFORE UPDATE ON public.payslips
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payslips: admin all"
  ON public.payslips
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "payslips: coordinator all"
  ON public.payslips
  USING (public.get_my_system_role() = 'coordinator')
  WITH CHECK (public.get_my_system_role() = 'coordinator');

CREATE POLICY "payslips: own read"
  ON public.payslips FOR SELECT
  USING (profile_id = auth.uid());

-- =============================================================
