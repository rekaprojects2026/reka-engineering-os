-- =============================================================
-- Migration: 0035_manajer_team_availability_rpc
-- Manajer may list active teammates' availability-only fields via
-- SECURITY DEFINER RPC (avoids broad SELECT on profiles.rates/banking).
-- =============================================================

CREATE OR REPLACE FUNCTION public.list_team_availability_for_manajer()
RETURNS TABLE (
  id uuid,
  full_name text,
  photo_url text,
  availability_status text,
  skill_tags text[],
  functional_role text,
  discipline text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    p.id,
    p.full_name,
    p.photo_url,
    p.availability_status::text,
    COALESCE(p.skill_tags, ARRAY[]::text[]),
    p.functional_role,
    p.discipline
  FROM public.profiles p
  WHERE p.active_status = 'active'
    AND public.is_manajer();
$$;

COMMENT ON FUNCTION public.list_team_availability_for_manajer() IS
  'Returns active profiles availability roster columns for manajer sessions only; empty for other roles.';

REVOKE ALL ON FUNCTION public.list_team_availability_for_manajer() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_team_availability_for_manajer() TO authenticated;
