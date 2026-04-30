-- Stage C: DOMESTIC vs PLATFORM projects + milestone termins

-- ─── 1a. Projects: contract & billing model ───────────────────

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS
  source_type text NOT NULL DEFAULT 'DOMESTIC';

ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_source_type_check;

ALTER TABLE public.projects ADD CONSTRAINT projects_source_type_check
  CHECK (source_type IN ('DOMESTIC', 'PLATFORM'));

COMMENT ON COLUMN public.projects.source_type IS
  'DOMESTIC = project Indonesia langsung (ada BAST & termin). '
  'PLATFORM = via Fiverr/Upwork (billing dihandle platform, tidak ada termin).';

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS
  contract_value numeric(15,2);

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS
  contract_currency text NOT NULL DEFAULT 'IDR';

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS
  has_retention boolean NOT NULL DEFAULT false;

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS
  retention_percentage numeric(5,2) DEFAULT 5.0;

COMMENT ON COLUMN public.projects.has_retention IS
  'Apakah project ini punya klausul retensi (Termin 5). Hanya untuk DOMESTIC.';
COMMENT ON COLUMN public.projects.retention_percentage IS
  'Persentase retensi, default 5%. Total Termin 1-4 = 100% - retention_percentage.';

-- ─── 1b. project_termins ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.project_termins (
  id                    uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            uuid          NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  termin_number         integer       NOT NULL CHECK (termin_number BETWEEN 1 AND 5),
  label                 text          NOT NULL,
  percentage            numeric(5,2)  NOT NULL CHECK (percentage > 0 AND percentage <= 100),
  amount                numeric(15,2),
  currency              text          NOT NULL DEFAULT 'IDR',
  trigger_condition     text,
  status                text          NOT NULL DEFAULT 'BELUM_DIMULAI'
    CHECK (status IN (
      'BELUM_DIMULAI',
      'SIAP_DIKLAIM',
      'MENUNGGU_VERIFIKASI',
      'INVOICE_DITERBITKAN',
      'MENUNGGU_TTD_CLIENT',
      'MENUNGGU_PEMBAYARAN',
      'LUNAS'
    )),
  invoice_id            uuid          REFERENCES public.client_invoices(id) ON DELETE SET NULL,
  claimed_by            uuid          REFERENCES public.profiles(id) ON DELETE SET NULL,
  claimed_at            timestamptz,
  verified_by           uuid          REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at           timestamptz,
  bast_signed_at        timestamptz,
  bast_signed_by        uuid          REFERENCES public.profiles(id) ON DELETE SET NULL,
  client_signed_bast_at timestamptz,
  paid_at               timestamptz,
  notes                 text,
  is_retention          boolean       NOT NULL DEFAULT false,
  retention_due_date    date,
  created_at            timestamptz   NOT NULL DEFAULT now(),
  updated_at            timestamptz   NOT NULL DEFAULT now(),
  UNIQUE (project_id, termin_number)
);

COMMENT ON TABLE public.project_termins IS
  'Milestone payment schedule untuk project DOMESTIC. Max 5 termins (4 normal + 1 retensi).';

DROP TRIGGER IF EXISTS set_project_termins_updated_at ON public.project_termins;
CREATE TRIGGER set_project_termins_updated_at
  BEFORE UPDATE ON public.project_termins
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_project_termins_project ON public.project_termins(project_id);

ALTER TABLE public.project_termins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "termins: management can read all" ON public.project_termins;
CREATE POLICY "termins: management can read all"
  ON public.project_termins FOR SELECT
  USING (public.is_management());

DROP POLICY IF EXISTS "termins: ops lead can read own project termins" ON public.project_termins;
CREATE POLICY "termins: ops lead can read own project termins"
  ON public.project_termins FOR SELECT
  USING (
    public.is_ops_lead() AND
    project_id IN (
      SELECT id FROM public.projects WHERE project_lead_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "termins: finance can read all" ON public.project_termins;
CREATE POLICY "termins: finance can read all"
  ON public.project_termins FOR SELECT
  USING (public.is_finance());

DROP POLICY IF EXISTS "termins: manajer can claim" ON public.project_termins;
CREATE POLICY "termins: manajer can claim"
  ON public.project_termins FOR UPDATE
  USING (
    public.is_manajer() AND
    project_id IN (
      SELECT id FROM public.projects WHERE project_lead_user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_manajer() AND
    project_id IN (
      SELECT id FROM public.projects WHERE project_lead_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "termins: direktur or TD can verify" ON public.project_termins;
CREATE POLICY "termins: direktur or TD can verify"
  ON public.project_termins FOR UPDATE
  USING (public.is_direktur() OR public.is_technical_director())
  WITH CHECK (public.is_direktur() OR public.is_technical_director());

DROP POLICY IF EXISTS "termins: finance can manage invoice and payment" ON public.project_termins;
CREATE POLICY "termins: finance can manage invoice and payment"
  ON public.project_termins FOR UPDATE
  USING (public.is_finance())
  WITH CHECK (public.is_finance());

DROP POLICY IF EXISTS "termins: ops lead can insert" ON public.project_termins;
CREATE POLICY "termins: ops lead can insert"
  ON public.project_termins FOR INSERT
  WITH CHECK (public.is_ops_lead() OR public.is_finance());

DROP POLICY IF EXISTS "termins: management can insert all" ON public.project_termins;
CREATE POLICY "termins: management can insert all"
  ON public.project_termins FOR INSERT
  WITH CHECK (public.is_management());

-- ─── 1c. Default termin generator ─────────────────────────────

CREATE OR REPLACE FUNCTION public.generate_default_termins(
  p_project_id       uuid,
  p_contract_value   numeric(15,2),
  p_currency         text,
  p_has_retention    boolean DEFAULT false,
  p_retention_pct    numeric(5,2) DEFAULT 5.0
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  main_total  numeric(5,2);
  pct_each    numeric(5,2);
BEGIN
  IF p_contract_value IS NULL OR p_contract_value <= 0 THEN
    RETURN;
  END IF;

  IF p_has_retention THEN
    main_total := 100 - p_retention_pct;
  ELSE
    main_total := 100;
  END IF;

  pct_each := ROUND(main_total / 4, 2);

  INSERT INTO public.project_termins
    (project_id, termin_number, label, percentage, amount, currency, trigger_condition, is_retention)
  VALUES (
    p_project_id, 1, 'DP (Termin 1)', pct_each,
    ROUND(p_contract_value * pct_each / 100, 2), p_currency,
    'Kontrak ditandatangani', false
  );

  INSERT INTO public.project_termins
    (project_id, termin_number, label, percentage, amount, currency, trigger_condition, is_retention)
  VALUES (
    p_project_id, 2, 'Termin 2', pct_each,
    ROUND(p_contract_value * pct_each / 100, 2), p_currency,
    'Deliverable Fase Konsep diapprove client', false
  );

  INSERT INTO public.project_termins
    (project_id, termin_number, label, percentage, amount, currency, trigger_condition, is_retention)
  VALUES (
    p_project_id, 3, 'Termin 3', pct_each,
    ROUND(p_contract_value * pct_each / 100, 2), p_currency,
    'Deliverable Fase DD diapprove client', false
  );

  INSERT INTO public.project_termins
    (project_id, termin_number, label, percentage, amount, currency, trigger_condition, is_retention)
  VALUES (
    p_project_id, 4, 'Termin 4',
    main_total - (pct_each * 3),
    ROUND(p_contract_value * (main_total - pct_each * 3) / 100, 2), p_currency,
    'Semua deliverable final diapprove', false
  );

  IF p_has_retention THEN
    INSERT INTO public.project_termins
      (project_id, termin_number, label, percentage, amount, currency, trigger_condition, is_retention)
    VALUES (
      p_project_id, 5, 'Retensi (Termin 5)', p_retention_pct,
      ROUND(p_contract_value * p_retention_pct / 100, 2), p_currency,
      'Habis masa garansi', true
    );
  END IF;
END;
$$;
