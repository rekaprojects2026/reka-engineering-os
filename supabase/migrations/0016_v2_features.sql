-- =============================================================
-- Migration: 0016_v2_features
-- V2 Features: Multi-currency, Finance, Outreach, Enhanced Ops
-- =============================================================

-- ─── 1. FX RATES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fx_rates (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency  text        NOT NULL,
  to_currency    text        NOT NULL,
  rate           numeric(20,6) NOT NULL CHECK (rate > 0),
  effective_date date        NOT NULL DEFAULT CURRENT_DATE,
  notes          text,
  set_by         uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (from_currency, to_currency, effective_date)
);

COMMENT ON TABLE public.fx_rates IS
  'Manual FX rate entries set by admin. Latest entry per currency pair is used for conversions.';

CREATE INDEX IF NOT EXISTS idx_fx_rates_pair_date
  ON public.fx_rates (from_currency, to_currency, effective_date DESC);

ALTER TABLE public.fx_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fx_rates: authenticated read"
  ON public.fx_rates FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "fx_rates: admin all"
  ON public.fx_rates
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Seed initial USD/IDR rate
INSERT INTO public.fx_rates (from_currency, to_currency, rate, effective_date, notes)
VALUES ('USD', 'IDR', 16400, CURRENT_DATE, 'Initial seed rate')
ON CONFLICT DO NOTHING;

-- ─── 2. PAYMENT ACCOUNTS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payment_accounts (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text        NOT NULL,
  account_type        text        NOT NULL CHECK (account_type IN ('wise','paypal','bank','ewallet','other')),
  currency            text        NOT NULL DEFAULT 'IDR',
  account_identifier  text,
  description         text,
  is_active           boolean     NOT NULL DEFAULT true,
  sort_order          integer     NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.payment_accounts IS
  'Company payment channels (Wise USD, PayPal, BCA Haris, etc.) for routing client invoices.';

CREATE TRIGGER set_payment_accounts_updated_at
  BEFORE UPDATE ON public.payment_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.payment_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_accounts: authenticated read"
  ON public.payment_accounts FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "payment_accounts: admin all"
  ON public.payment_accounts
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Seed default accounts
INSERT INTO public.payment_accounts (name, account_type, currency, account_identifier, sort_order) VALUES
  ('Wise USD',   'wise',   'USD', 'wise@reka.engineering', 1),
  ('PayPal',     'paypal', 'USD', 'paypal@reka.engineering', 2),
  ('BCA Haris',  'bank',   'IDR', 'BCA — Haris (isi no rek)', 3)
ON CONFLICT DO NOTHING;

-- ─── 3. CLIENT INVOICES ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.client_invoices (
  id                    uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_code          text          UNIQUE NOT NULL,
  project_id            uuid          REFERENCES public.projects(id) ON DELETE SET NULL,
  client_id             uuid          REFERENCES public.clients(id) ON DELETE SET NULL,
  issue_date            date          NOT NULL DEFAULT CURRENT_DATE,
  due_date              date,
  currency              text          NOT NULL DEFAULT 'USD',
  gross_amount          numeric(15,2) NOT NULL DEFAULT 0,
  platform_type         text          CHECK (platform_type IN ('fiverr','upwork','direct','referral','other')),
  platform_fee_pct      numeric(5,2)  NOT NULL DEFAULT 0 CHECK (platform_fee_pct >= 0 AND platform_fee_pct <= 100),
  platform_fee_amount   numeric(15,2) NOT NULL DEFAULT 0,
  gateway_fee_pct       numeric(5,2)  NOT NULL DEFAULT 0 CHECK (gateway_fee_pct >= 0 AND gateway_fee_pct <= 100),
  gateway_fee_amount    numeric(15,2) NOT NULL DEFAULT 0,
  net_amount            numeric(15,2) NOT NULL DEFAULT 0,
  fx_rate_snapshot      numeric(20,6),
  destination_account_id uuid         REFERENCES public.payment_accounts(id) ON DELETE SET NULL,
  status                text          NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','sent','partial','paid','overdue','void')),
  notes                 text,
  created_by            uuid          REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at            timestamptz   NOT NULL DEFAULT now(),
  updated_at            timestamptz   NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.client_invoices IS
  'Client invoices tracking gross amount, platform fee, gateway fee, and net received.';

CREATE INDEX IF NOT EXISTS idx_client_invoices_project
  ON public.client_invoices (project_id);
CREATE INDEX IF NOT EXISTS idx_client_invoices_client
  ON public.client_invoices (client_id);
CREATE INDEX IF NOT EXISTS idx_client_invoices_status
  ON public.client_invoices (status);

CREATE TRIGGER set_client_invoices_updated_at
  BEFORE UPDATE ON public.client_invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-generate invoice_code
CREATE OR REPLACE FUNCTION public.generate_invoice_code()
RETURNS TRIGGER AS $$
DECLARE
  _month  text := to_char(now(), 'YYYYMM');
  _seq    integer;
BEGIN
  SELECT COALESCE(MAX(
    CAST(substring(invoice_code FROM 'INV-[0-9]+-([0-9]+)') AS integer)
  ), 0) + 1
  INTO _seq
  FROM public.client_invoices
  WHERE invoice_code LIKE 'INV-' || _month || '-%';

  NEW.invoice_code := 'INV-' || _month || '-' || lpad(_seq::text, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_invoice_code
  BEFORE INSERT ON public.client_invoices
  FOR EACH ROW
  WHEN (NEW.invoice_code IS NULL OR NEW.invoice_code = '')
  EXECUTE FUNCTION public.generate_invoice_code();

ALTER TABLE public.client_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_invoices: admin all"
  ON public.client_invoices
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "client_invoices: coordinator read"
  ON public.client_invoices FOR SELECT
  USING (public.get_my_system_role() IN ('admin','coordinator'));

-- ─── 4. INVOICE LINE ITEMS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invoice_line_items (
  id           uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id   uuid          NOT NULL REFERENCES public.client_invoices(id) ON DELETE CASCADE,
  description  text          NOT NULL,
  task_id      uuid          REFERENCES public.tasks(id) ON DELETE SET NULL,
  deliverable_id uuid        REFERENCES public.deliverables(id) ON DELETE SET NULL,
  qty          numeric(10,2) NOT NULL DEFAULT 1,
  unit_price   numeric(15,2) NOT NULL DEFAULT 0,
  subtotal     numeric(15,2) NOT NULL DEFAULT 0,
  sort_order   integer       NOT NULL DEFAULT 0,
  created_at   timestamptz   NOT NULL DEFAULT now()
);

ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoice_line_items: admin all"
  ON public.invoice_line_items
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "invoice_line_items: coordinator read"
  ON public.invoice_line_items FOR SELECT
  USING (public.get_my_system_role() IN ('admin','coordinator'));

-- ─── 5. INCOMING PAYMENTS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.incoming_payments (
  id                 uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id         uuid          NOT NULL REFERENCES public.client_invoices(id) ON DELETE CASCADE,
  payment_date       date          NOT NULL DEFAULT CURRENT_DATE,
  amount_received    numeric(15,2) NOT NULL DEFAULT 0,
  currency           text          NOT NULL DEFAULT 'USD',
  fx_rate_snapshot   numeric(20,6),
  account_id         uuid          REFERENCES public.payment_accounts(id) ON DELETE SET NULL,
  payment_reference  text,
  proof_link         text,
  notes              text,
  recorded_by        uuid          REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at         timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_incoming_payments_invoice
  ON public.incoming_payments (invoice_id);

ALTER TABLE public.incoming_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "incoming_payments: admin all"
  ON public.incoming_payments
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "incoming_payments: coordinator read"
  ON public.incoming_payments FOR SELECT
  USING (public.get_my_system_role() IN ('admin','coordinator'));

-- ─── 6. OUTREACH COMPANIES ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.outreach_companies (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name         text        NOT NULL,
  contact_person       text,
  contact_channel      text        CHECK (contact_channel IN ('upwork','linkedin','email','direct','instagram','whatsapp','other')),
  contact_value        text,
  status               text        NOT NULL DEFAULT 'to_contact'
    CHECK (status IN ('to_contact','contacted','replied','in_discussion','converted','declined')),
  last_contact_date    date,
  next_followup_date   date,
  converted_intake_id  uuid        REFERENCES public.intakes(id) ON DELETE SET NULL,
  notes                text,
  created_by           uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.outreach_companies IS
  'Prospecting pipeline — companies to reach out to for new business before they become leads.';

CREATE TRIGGER set_outreach_companies_updated_at
  BEFORE UPDATE ON public.outreach_companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.outreach_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "outreach_companies: admin coordinator all"
  ON public.outreach_companies
  USING (public.get_my_system_role() IN ('admin','coordinator'))
  WITH CHECK (public.get_my_system_role() IN ('admin','coordinator'));

-- ─── 7. DEADLINE CHANGES (AUDIT TRAIL) ───────────────────────
CREATE TABLE IF NOT EXISTS public.deadline_changes (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type  text        NOT NULL CHECK (entity_type IN ('project','task')),
  entity_id    uuid        NOT NULL,
  old_due_date date,
  new_due_date date        NOT NULL,
  reason       text,
  changed_by   uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  changed_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deadline_changes_entity
  ON public.deadline_changes (entity_type, entity_id, changed_at DESC);

ALTER TABLE public.deadline_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deadline_changes: authenticated read"
  ON public.deadline_changes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "deadline_changes: admin coordinator insert"
  ON public.deadline_changes FOR INSERT
  WITH CHECK (public.get_my_system_role() IN ('admin','coordinator'));

-- ─── 8. ALTER EXISTING TABLES ────────────────────────────────

-- profiles: add photo
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS photo_url text;

-- intakes: contact info, budget currency, complexity score
ALTER TABLE public.intakes ADD COLUMN IF NOT EXISTS contact_channel text
  CHECK (contact_channel IN ('whatsapp','email','instagram','linkedin','telegram','phone','other'));
ALTER TABLE public.intakes ADD COLUMN IF NOT EXISTS contact_value text;
ALTER TABLE public.intakes ADD COLUMN IF NOT EXISTS budget_currency text NOT NULL DEFAULT 'IDR'
  CHECK (budget_currency IN ('IDR','USD'));
ALTER TABLE public.intakes ADD COLUMN IF NOT EXISTS complexity_score integer
  CHECK (complexity_score BETWEEN 1 AND 10);

-- projects: source platform, problem flag
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS source_platform text
  CHECK (source_platform IN ('fiverr','upwork','direct','referral','other'));
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS is_problematic boolean NOT NULL DEFAULT false;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS problem_note text;

-- tasks: problem flag
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS is_problematic boolean NOT NULL DEFAULT false;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS problem_note text;

-- project_files: approved flag
ALTER TABLE public.project_files ADD COLUMN IF NOT EXISTS is_approved_version boolean NOT NULL DEFAULT false;
ALTER TABLE public.project_files ADD COLUMN IF NOT EXISTS approved_at timestamptz;
ALTER TABLE public.project_files ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ─── 9. AUTO-PROGRESS TRIGGER ────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_project_progress()
RETURNS TRIGGER AS $$
DECLARE
  _total   integer;
  _done    integer;
  _pct     integer;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE status != 'cancelled'),
    COUNT(*) FILTER (WHERE status = 'done')
  INTO _total, _done
  FROM public.tasks
  WHERE project_id = COALESCE(NEW.project_id, OLD.project_id);

  IF _total = 0 THEN
    _pct := 0;
  ELSE
    _pct := ROUND((_done::numeric / _total::numeric) * 100);
  END IF;

  UPDATE public.projects
  SET progress_percent = _pct, updated_at = now()
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS task_progress_trigger ON public.tasks;
CREATE TRIGGER task_progress_trigger
  AFTER INSERT OR UPDATE OF status OR DELETE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_project_progress();

-- ─── 10. NEW SETTING OPTION DOMAINS ──────────────────────────
INSERT INTO public.setting_options (domain, value, label, sort_order) VALUES
  ('contact_channel', 'whatsapp',  'WhatsApp',  1),
  ('contact_channel', 'email',     'Email',     2),
  ('contact_channel', 'linkedin',  'LinkedIn',  3),
  ('contact_channel', 'instagram', 'Instagram', 4),
  ('contact_channel', 'telegram',  'Telegram',  5),
  ('contact_channel', 'phone',     'Phone',     6),
  ('contact_channel', 'other',     'Other',     7)
ON CONFLICT (domain, value) DO NOTHING;

INSERT INTO public.setting_options (domain, value, label, sort_order) VALUES
  ('outreach_channel', 'upwork',    'Upwork',    1),
  ('outreach_channel', 'linkedin',  'LinkedIn',  2),
  ('outreach_channel', 'email',     'Email',     3),
  ('outreach_channel', 'direct',    'Direct',    4),
  ('outreach_channel', 'instagram', 'Instagram', 5),
  ('outreach_channel', 'whatsapp',  'WhatsApp',  6),
  ('outreach_channel', 'other',     'Other',     7)
ON CONFLICT (domain, value) DO NOTHING;

INSERT INTO public.setting_options (domain, value, label, sort_order) VALUES
  ('source_platform', 'fiverr',   'Fiverr',   1),
  ('source_platform', 'upwork',   'Upwork',   2),
  ('source_platform', 'direct',   'Direct',   3),
  ('source_platform', 'referral', 'Referral', 4),
  ('source_platform', 'other',    'Other',    5)
ON CONFLICT (domain, value) DO NOTHING;

INSERT INTO public.setting_options (domain, value, label, sort_order) VALUES
  ('lead_status',    'new',          'New',          1),
  ('lead_status',    'awaiting_info','Awaiting Info', 2),
  ('lead_status',    'qualified',    'Qualified',    3),
  ('lead_status',    'rejected',     'Rejected',     4),
  ('lead_status',    'converted',    'Converted',    5)
ON CONFLICT (domain, value) DO NOTHING;

INSERT INTO public.setting_options (domain, value, label, sort_order) VALUES
  ('invoice_status', 'draft',    'Draft',    1),
  ('invoice_status', 'sent',     'Sent',     2),
  ('invoice_status', 'partial',  'Partial',  3),
  ('invoice_status', 'paid',     'Paid',     4),
  ('invoice_status', 'overdue',  'Overdue',  5),
  ('invoice_status', 'void',     'Void',     6)
ON CONFLICT (domain, value) DO NOTHING;

INSERT INTO public.setting_options (domain, value, label, sort_order) VALUES
  ('outreach_status', 'to_contact',    'To Contact',    1),
  ('outreach_status', 'contacted',     'Contacted',     2),
  ('outreach_status', 'replied',       'Replied',       3),
  ('outreach_status', 'in_discussion', 'In Discussion', 4),
  ('outreach_status', 'converted',     'Converted',     5),
  ('outreach_status', 'declined',      'Declined',      6)
ON CONFLICT (domain, value) DO NOTHING;

-- =============================================================
