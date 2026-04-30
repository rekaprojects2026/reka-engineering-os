-- =============================================================
-- Migration: 0044_engdocs_direktur_super_admin
-- OS `profiles.system_role = 'direktur'` → EngDocs `super_admin`
-- (Repairs DBs that ran 0041 before direktur was mapped to super_admin.)
-- =============================================================

UPDATE engdocs.library_profile_roles lpr
SET role = 'super_admin'::engdocs.doc_user_role
FROM public.profiles p
WHERE lpr.profile_id = p.id
  AND p.system_role = 'direktur';

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
      WHEN NEW.system_role = 'direktur' THEN 'super_admin'::engdocs.doc_user_role
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
      WHEN NEW.system_role = 'direktur' THEN 'super_admin'::engdocs.doc_user_role
      WHEN NEW.system_role IS NOT NULL AND NEW.system_role IN ('technical_director', 'finance')
        THEN 'doc_admin'::engdocs.doc_user_role
      ELSE 'viewer'::engdocs.doc_user_role
    END
    WHERE profile_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;
