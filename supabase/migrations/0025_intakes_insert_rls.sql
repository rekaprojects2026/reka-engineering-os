-- =============================================================
-- Migration: 0025_intakes_insert_rls
-- Ensure intakes INSERT is allowed for CRM pipeline roles (BD /
-- Manajer / TD) with created_by = caller, aligned with app
-- mutation-policy and convert-from-outreach flow.
-- =============================================================

DROP POLICY IF EXISTS "intakes: authenticated insert" ON public.intakes;

CREATE POLICY "intakes: pipeline roles insert"
  ON public.intakes FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by = auth.uid()
    AND public.get_my_system_role() IN ('bd', 'manajer', 'technical_director')
  );
