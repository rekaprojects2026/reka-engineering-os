-- =============================================================
-- Migration: 0054_owner_role
-- Add highest-privilege "owner" system role for REKA OS.
-- =============================================================

-- 1) Extend role constraints
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_system_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_system_role_check CHECK (
    system_role IS NULL OR system_role IN (
      'owner',
      'direktur',
      'technical_director',
      'finance',
      'manajer',
      'bd',
      'senior',
      'member',
      'freelancer'
    )
  );

ALTER TABLE public.invites
  DROP CONSTRAINT IF EXISTS invites_system_role_check;

ALTER TABLE public.invites
  ADD CONSTRAINT invites_system_role_check CHECK (
    system_role IS NULL OR system_role IN (
      'owner',
      'direktur',
      'technical_director',
      'finance',
      'manajer',
      'bd',
      'senior',
      'member',
      'freelancer'
    )
  );

-- 2) Owner helper and role predicates
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND system_role = 'owner'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_owner() TO authenticated;

CREATE OR REPLACE FUNCTION public.is_direktur()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_owner() OR EXISTS (
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
  SELECT public.is_owner() OR EXISTS (
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
  SELECT public.is_owner() OR EXISTS (
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
  SELECT public.is_owner() OR EXISTS (
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
  SELECT public.is_owner() OR EXISTS (
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
  SELECT public.is_owner() OR EXISTS (
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
  SELECT public.is_owner() OR EXISTS (
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
  SELECT public.is_owner() OR EXISTS (
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

CREATE OR REPLACE FUNCTION public.is_admin_or_coordinator()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_management() OR public.is_ops_lead();
$$;

-- 3) Owner full-access policy across current public tables.
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "owner: full access" ON public.%I', t.tablename);
    EXECUTE format(
      'CREATE POLICY "owner: full access" ON public.%I FOR ALL USING (public.is_owner()) WITH CHECK (public.is_owner())',
      t.tablename
    );
  END LOOP;
END
$$;

-- 4) Keep EngDocs role sync aligned: owner behaves like direktur (super_admin)
UPDATE engdocs.library_profile_roles lpr
SET role = 'super_admin'::engdocs.doc_user_role
FROM public.profiles p
WHERE lpr.profile_id = p.id
  AND p.system_role IN ('owner', 'direktur');

CREATE OR REPLACE FUNCTION engdocs.sync_profile_library_role_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = engdocs, public
AS $$
BEGIN
  INSERT INTO engdocs.library_profile_roles (profile_id, role)
  VALUES (
    NEW.id,
    CASE
      WHEN NEW.system_role IN ('owner', 'direktur') THEN 'super_admin'::engdocs.doc_user_role
      WHEN NEW.system_role IS NOT NULL AND NEW.system_role IN ('technical_director', 'finance')
        THEN 'doc_admin'::engdocs.doc_user_role
      ELSE 'viewer'::engdocs.doc_user_role
    END
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION engdocs.refresh_profile_library_role_on_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = engdocs, public
AS $$
BEGIN
  IF OLD.system_role IS DISTINCT FROM NEW.system_role THEN
    UPDATE engdocs.library_profile_roles
    SET role = CASE
      WHEN NEW.system_role IN ('owner', 'direktur') THEN 'super_admin'::engdocs.doc_user_role
      WHEN NEW.system_role IS NOT NULL AND NEW.system_role IN ('technical_director', 'finance')
        THEN 'doc_admin'::engdocs.doc_user_role
      ELSE 'viewer'::engdocs.doc_user_role
    END
    WHERE profile_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;
