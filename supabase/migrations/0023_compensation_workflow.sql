-- Stage D: propose-confirm compensation workflow + MONTHLY_FIXED direct

-- ─── Extend rate_type for monthly fixed ───────────────────────

ALTER TABLE public.compensation_records DROP CONSTRAINT IF EXISTS compensation_records_rate_type_check;
ALTER TABLE public.compensation_records ADD CONSTRAINT compensation_records_rate_type_check
  CHECK (rate_type IN (
    'hourly', 'daily', 'per_task', 'per_deliverable', 'per_project', 'monthly_fixed'
  ));

-- ─── Workflow columns ─────────────────────────────────────────

ALTER TABLE public.compensation_records ADD COLUMN IF NOT EXISTS
  proposed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.compensation_records ADD COLUMN IF NOT EXISTS
  proposed_at timestamptz;

ALTER TABLE public.compensation_records ADD COLUMN IF NOT EXISTS
  return_note text;

ALTER TABLE public.compensation_records ADD COLUMN IF NOT EXISTS
  finance_note text;

ALTER TABLE public.compensation_records ADD COLUMN IF NOT EXISTS
  confirmed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.compensation_records ADD COLUMN IF NOT EXISTS
  confirmed_at timestamptz;

ALTER TABLE public.compensation_records ADD COLUMN IF NOT EXISTS
  is_monthly_fixed_direct boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.compensation_records.is_monthly_fixed_direct IS
  'True when Finance set MONTHLY_FIXED on profile path or direct insert — skips propose-confirm.';

UPDATE public.compensation_records
SET proposed_by = created_by
WHERE proposed_by IS NULL AND created_by IS NOT NULL;

-- ─── Replace RLS policies ───────────────────────────────────────

DROP POLICY IF EXISTS "compensation_records: admin all" ON public.compensation_records;
DROP POLICY IF EXISTS "compensation_records: member read own" ON public.compensation_records;
DROP POLICY IF EXISTS "compensation_records: coordinator read" ON public.compensation_records;

CREATE POLICY "compensation_records: direktur read all"
  ON public.compensation_records FOR SELECT
  USING (public.is_direktur());

CREATE POLICY "compensation_records: td read all"
  ON public.compensation_records FOR SELECT
  USING (public.is_technical_director());

CREATE POLICY "compensation_records: td insert propose"
  ON public.compensation_records FOR INSERT
  WITH CHECK (public.is_technical_director() AND proposed_by = auth.uid());

CREATE POLICY "compensation_records: td update own draft"
  ON public.compensation_records FOR UPDATE
  USING (
    public.is_technical_director() AND
    status = 'draft' AND
    proposed_by = auth.uid()
  )
  WITH CHECK (
    public.is_technical_director() AND
    status = 'draft' AND
    proposed_by = auth.uid()
  );

CREATE POLICY "compensation_records: td delete own draft"
  ON public.compensation_records FOR DELETE
  USING (
    public.is_technical_director() AND
    status = 'draft' AND
    proposed_by = auth.uid()
  );

CREATE POLICY "compensation_records: manajer read own"
  ON public.compensation_records FOR SELECT
  USING (
    public.is_manajer() AND
    proposed_by = auth.uid()
  );

CREATE POLICY "compensation_records: manajer insert propose"
  ON public.compensation_records FOR INSERT
  WITH CHECK (public.is_manajer() AND proposed_by = auth.uid());

CREATE POLICY "compensation_records: manajer update own draft"
  ON public.compensation_records FOR UPDATE
  USING (
    public.is_manajer() AND
    status = 'draft' AND
    proposed_by = auth.uid()
  )
  WITH CHECK (
    public.is_manajer() AND
    status = 'draft' AND
    proposed_by = auth.uid()
  );

CREATE POLICY "compensation_records: manajer delete own draft"
  ON public.compensation_records FOR DELETE
  USING (
    public.is_manajer() AND
    status = 'draft' AND
    proposed_by = auth.uid()
  );

CREATE POLICY "compensation_records: finance read all"
  ON public.compensation_records FOR SELECT
  USING (public.is_finance());

CREATE POLICY "compensation_records: finance insert"
  ON public.compensation_records FOR INSERT
  WITH CHECK (public.is_finance());

CREATE POLICY "compensation_records: finance update all"
  ON public.compensation_records FOR UPDATE
  USING (public.is_finance())
  WITH CHECK (public.is_finance());

CREATE POLICY "compensation_records: finance delete all"
  ON public.compensation_records FOR DELETE
  USING (public.is_finance());
