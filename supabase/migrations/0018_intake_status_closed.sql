-- =============================================================
-- Migration: 0018_intake_status_closed
-- Add "closed" to intake status (lead selesai / siap ditutup)
-- =============================================================

ALTER TABLE public.intakes DROP CONSTRAINT IF EXISTS intakes_status_check;

ALTER TABLE public.intakes
  ADD CONSTRAINT intakes_status_check
  CHECK (
    status IN (
      'new',
      'awaiting_info',
      'qualified',
      'rejected',
      'closed',
      'converted'
    )
  );

-- Insert "closed" after rejected, before converted in default ordering
UPDATE public.setting_options
  SET sort_order = 6
  WHERE domain = 'lead_status' AND value = 'converted';

INSERT INTO public.setting_options (domain, value, label, sort_order) VALUES
  ('lead_status', 'closed', 'Closed', 5)
ON CONFLICT (domain, value) DO NOTHING;
