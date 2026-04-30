-- =============================================================
-- Migration: 0020_role_system_overhaul
-- Stage A — 4-role → 8-role system (profiles + invites + RLS)
-- =============================================================

-- ─── 1a. profiles.system_role: replace constraint + migrate ────

ALTER TABLE public.profiles RENAME COLUMN system_role TO system_role_old;

ALTER TABLE public.profiles ADD COLUMN system_role text;

UPDATE public.profiles SET system_role = CASE system_role_old
  WHEN 'admin'       THEN 'direktur'
  WHEN 'coordinator' THEN 'manajer'
  WHEN 'reviewer'    THEN 'senior'
  WHEN 'member'      THEN 'member'
  ELSE NULL
END;

ALTER TABLE public.profiles DROP COLUMN system_role_old;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_system_role_check CHECK (
  system_role IS NULL OR system_role IN (
    'direktur','technical_director','finance','manajer','bd','senior','member','freelancer'
  )
);

COMMENT ON COLUMN public.profiles.system_role IS
  'Global app access tier. Former admin rows were migrated to direktur; re-assign to direktur, technical_director, or finance as needed.';

-- ─── 1b. invites.system_role ───────────────────────────────────

ALTER TABLE public.invites RENAME COLUMN system_role TO system_role_old;

ALTER TABLE public.invites ADD COLUMN system_role text;

UPDATE public.invites SET system_role = CASE system_role_old
  WHEN 'admin'       THEN 'direktur'
  WHEN 'coordinator' THEN 'manajer'
  WHEN 'reviewer'    THEN 'senior'
  WHEN 'member'      THEN 'member'
  ELSE NULL
END;

ALTER TABLE public.invites DROP COLUMN system_role_old;

ALTER TABLE public.invites ADD CONSTRAINT invites_system_role_check CHECK (
  system_role IS NULL OR system_role IN (
    'direktur','technical_director','finance','manajer','bd','senior','member','freelancer'
  )
);

-- ─── 1c. Role helper functions ─────────────────────────────────

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
  'Returns system_role for the current user (8-role model).';

CREATE OR REPLACE FUNCTION public.get_system_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT public.get_my_system_role();
$$;

CREATE OR REPLACE FUNCTION public.is_direktur()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND system_role = 'direktur'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_technical_director()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND system_role = 'technical_director'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_finance()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND system_role = 'finance'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_manajer()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND system_role = 'manajer'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_bd()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND system_role = 'bd'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_senior()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND system_role = 'senior'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_freelancer()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND system_role = 'freelancer'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_management()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND system_role IN ('direktur','technical_director','finance')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_ops_lead()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND system_role IN ('technical_director','manajer')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_management();
$$;

COMMENT ON FUNCTION public.is_admin() IS
  'Deprecated: prefer is_direktur(), is_technical_director(), or is_finance(). '
  'Backward compat — true for direktur, technical_director, finance.';

CREATE OR REPLACE FUNCTION public.is_admin_or_coordinator()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_management() OR public.is_ops_lead();
$$;

COMMENT ON FUNCTION public.is_admin_or_coordinator() IS
  'Backward compat: management (direktur/TD/finance) or ops lead (TD/manajer).';

-- ─── 1d. RLS — invites (TD only for invite workflow) ───────────

DROP POLICY IF EXISTS "invites: admin all" ON public.invites;

CREATE POLICY "invites: technical_director all"
  ON public.invites
  USING (public.is_technical_director())
  WITH CHECK (public.is_technical_director());

-- ─── 1d. Finance tables — direktur + finance (not TD) ─────────

DROP POLICY IF EXISTS "client_invoices: admin all" ON public.client_invoices;
CREATE POLICY "client_invoices: direktur finance all"
  ON public.client_invoices
  USING (public.is_direktur() OR public.is_finance())
  WITH CHECK (public.is_direktur() OR public.is_finance());

DROP POLICY IF EXISTS "client_invoices: coordinator read" ON public.client_invoices;
CREATE POLICY "client_invoices: direktur finance read"
  ON public.client_invoices FOR SELECT
  USING (public.is_direktur() OR public.is_finance());

DROP POLICY IF EXISTS "invoice_line_items: admin all" ON public.invoice_line_items;
CREATE POLICY "invoice_line_items: direktur finance all"
  ON public.invoice_line_items
  USING (public.is_direktur() OR public.is_finance())
  WITH CHECK (public.is_direktur() OR public.is_finance());

DROP POLICY IF EXISTS "invoice_line_items: coordinator read" ON public.invoice_line_items;
CREATE POLICY "invoice_line_items: direktur finance read"
  ON public.invoice_line_items FOR SELECT
  USING (public.is_direktur() OR public.is_finance());

DROP POLICY IF EXISTS "incoming_payments: admin all" ON public.incoming_payments;
CREATE POLICY "incoming_payments: direktur finance all"
  ON public.incoming_payments
  USING (public.is_direktur() OR public.is_finance())
  WITH CHECK (public.is_direktur() OR public.is_finance());

DROP POLICY IF EXISTS "incoming_payments: coordinator read" ON public.incoming_payments;
CREATE POLICY "incoming_payments: direktur finance read"
  ON public.incoming_payments FOR SELECT
  USING (public.is_direktur() OR public.is_finance());

DROP POLICY IF EXISTS "fx_rates: admin all" ON public.fx_rates;
CREATE POLICY "fx_rates: finance mutate"
  ON public.fx_rates
  USING (public.is_finance())
  WITH CHECK (public.is_finance());

DROP POLICY IF EXISTS "payment_accounts: admin all" ON public.payment_accounts;
CREATE POLICY "payment_accounts: finance mutate"
  ON public.payment_accounts
  USING (public.is_finance())
  WITH CHECK (public.is_finance());

DROP POLICY IF EXISTS "payslips: admin all" ON public.payslips;
CREATE POLICY "payslips: direktur finance all"
  ON public.payslips
  USING (public.is_direktur() OR public.is_finance())
  WITH CHECK (public.is_direktur() OR public.is_finance());

DROP POLICY IF EXISTS "payslips: coordinator all" ON public.payslips;

DROP POLICY IF EXISTS "payment_records: admin all" ON public.payment_records;
CREATE POLICY "payment_records: finance all"
  ON public.payment_records
  USING (public.is_finance())
  WITH CHECK (public.is_finance());

CREATE POLICY "payment_records: direktur read"
  ON public.payment_records FOR SELECT
  USING (public.is_direktur());

-- ─── 1d. Outreach — BD write, direktur/TD/BD read ───────────────

DROP POLICY IF EXISTS "outreach_companies: admin coordinator all" ON public.outreach_companies;

CREATE POLICY "outreach_companies: read"
  ON public.outreach_companies FOR SELECT
  USING (
    public.get_my_system_role() IN ('direktur','technical_director','bd')
  );

CREATE POLICY "outreach_companies: bd insert"
  ON public.outreach_companies FOR INSERT
  WITH CHECK (public.get_my_system_role() = 'bd');

CREATE POLICY "outreach_companies: bd update"
  ON public.outreach_companies FOR UPDATE
  USING (public.get_my_system_role() = 'bd')
  WITH CHECK (public.get_my_system_role() = 'bd');

CREATE POLICY "outreach_companies: bd delete"
  ON public.outreach_companies FOR DELETE
  USING (public.get_my_system_role() = 'bd');

-- ─── 1d. Deadline changes — ops lead + management ───────────────

DROP POLICY IF EXISTS "deadline_changes: admin coordinator insert" ON public.deadline_changes;
CREATE POLICY "deadline_changes: ops insert"
  ON public.deadline_changes FOR INSERT
  WITH CHECK (public.is_management() OR public.is_ops_lead());

-- ─── 1d. setting_options — TD only ─────────────────────────────

DROP POLICY IF EXISTS "setting_options: admin insert" ON public.setting_options;
DROP POLICY IF EXISTS "setting_options: admin update" ON public.setting_options;
DROP POLICY IF EXISTS "setting_options: admin delete" ON public.setting_options;

CREATE POLICY "setting_options: td insert"
  ON public.setting_options FOR INSERT
  WITH CHECK (public.is_technical_director());

CREATE POLICY "setting_options: td update"
  ON public.setting_options FOR UPDATE
  USING (public.is_technical_director())
  WITH CHECK (public.is_technical_director());

CREATE POLICY "setting_options: td delete"
  ON public.setting_options FOR DELETE
  USING (public.is_technical_director());

-- =============================================================
