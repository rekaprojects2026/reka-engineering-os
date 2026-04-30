-- ============================================================
-- Migration: 0040_project_expenses
-- Pengeluaran per project: cetak, survey, transport, dll.
-- Masuk ke project cost dan mempengaruhi margin.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.project_expenses (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),

  project_id       uuid          NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id          uuid          REFERENCES public.tasks(id) ON DELETE SET NULL,

  category         text          NOT NULL
    CHECK (category IN (
      'printing', 'survey', 'transport', 'accommodation',
      'materials', 'software', 'meals', 'other'
    )),

  description      text          NOT NULL,
  amount           numeric(15,2) NOT NULL CHECK (amount > 0),
  currency_code    text          NOT NULL DEFAULT 'IDR',

  expense_date     date          NOT NULL DEFAULT (current_date),
  receipt_url      text,

  submitted_by     uuid          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status           text          NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),

  approved_by      uuid          REFERENCES public.profiles(id) ON DELETE SET NULL,
  rejection_note   text,

  created_at       timestamptz   NOT NULL DEFAULT now(),
  updated_at       timestamptz   NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.project_expenses IS
  'Project-level operational expenses. Approved expenses feed into project cost and margin reports.';

CREATE INDEX IF NOT EXISTS expenses_project_idx      ON public.project_expenses (project_id);
CREATE INDEX IF NOT EXISTS expenses_submitted_by_idx ON public.project_expenses (submitted_by);
CREATE INDEX IF NOT EXISTS expenses_status_idx       ON public.project_expenses (status);
CREATE INDEX IF NOT EXISTS expenses_date_idx        ON public.project_expenses (expense_date DESC);

CREATE TRIGGER project_expenses_updated_at
  BEFORE UPDATE ON public.project_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.project_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expenses: submitter read own"
  ON public.project_expenses FOR SELECT
  USING (submitted_by = auth.uid());

CREATE POLICY "expenses: submitter insert"
  ON public.project_expenses FOR INSERT
  WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "expenses: submitter update pending"
  ON public.project_expenses FOR UPDATE
  USING (submitted_by = auth.uid() AND status = 'pending')
  WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "expenses: submitter delete pending"
  ON public.project_expenses FOR DELETE
  USING (submitted_by = auth.uid() AND status = 'pending');

CREATE POLICY "expenses: management read all"
  ON public.project_expenses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.system_role IN ('direktur', 'technical_director', 'finance')
    )
  );

CREATE POLICY "expenses: management update all"
  ON public.project_expenses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.system_role IN ('direktur', 'technical_director', 'finance')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.system_role IN ('direktur', 'technical_director', 'finance')
    )
  );
