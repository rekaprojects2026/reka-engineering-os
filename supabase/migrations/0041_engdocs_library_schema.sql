-- =============================================================
-- Migration: 0041_engdocs_library_schema
-- Engineering Document library — integrated with REKA OS
-- Schema `engdocs` avoids collisions with public.activity_logs,
-- public.profiles (single source of truth for users), etc.
--
-- AFTER APPLY: Supabase Dashboard → Settings → API → add schema
-- `engdocs` to "Exposed schemas" (beside public) so PostgREST
-- can query these tables from the Document app.
-- =============================================================

CREATE SCHEMA IF NOT EXISTS engdocs;

COMMENT ON SCHEMA engdocs IS
  'REKA Engineering Document library (PDF metadata, FTS, archive inbox). FK to public.profiles.';

GRANT USAGE ON SCHEMA engdocs TO postgres, anon, authenticated, service_role;

-- Default grants for objects created in this migration
ALTER DEFAULT PRIVILEGES IN SCHEMA engdocs
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA engdocs
  GRANT ALL ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA engdocs
  GRANT USAGE ON SEQUENCES TO postgres, service_role;

-- =============================================================
-- ENUMS (library-specific; live under engdocs)
-- =============================================================

CREATE TYPE engdocs.doc_user_role AS ENUM (
  'super_admin', 'doc_admin', 'editor', 'viewer', 'restricted_viewer'
);

CREATE TYPE engdocs.library_type AS ENUM (
  'reference', 'internal_controlled', 'external_sample', 'calc_tool'
);

CREATE TYPE engdocs.document_type AS ENUM (
  'standard', 'book', 'manual', 'handbook', 'sop', 'guideline',
  'template', 'form', 'report_sample', 'spreadsheet_calc',
  'spreadsheet_template', 'drawing_reference', 'spec'
);

CREATE TYPE engdocs.discipline AS ENUM (
  'civil', 'structural', 'mechanical', 'piping', 'electrical',
  'instrumentation', 'project_control', 'qaqc', 'hse', 'procurement', 'general'
);

CREATE TYPE engdocs.document_status AS ENUM (
  'draft', 'under_review', 'approved', 'published', 'obsolete', 'archived'
);

CREATE TYPE engdocs.confidentiality_level AS ENUM (
  'public_internal', 'restricted_internal', 'confidential', 'external_reference_only'
);

CREATE TYPE engdocs.usage_mode AS ENUM (
  'read_only', 'reference_only', 'template_copy', 'working_copy_required'
);

CREATE TYPE engdocs.processing_status AS ENUM (
  'uploaded', 'processing', 'indexed', 'failed', 'published'
);

CREATE TYPE engdocs.library_activity_action AS ENUM (
  'view', 'upload', 'edit', 'approve', 'obsolete',
  'download_attempt', 'login', 'logout'
);

-- =============================================================
-- Per-user document app role (maps to public.profiles)
-- =============================================================

CREATE TABLE engdocs.library_profile_roles (
  profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  role       engdocs.doc_user_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS library_profile_roles_role_idx
  ON engdocs.library_profile_roles(role);

CREATE TRIGGER library_profile_roles_updated_at
  BEFORE UPDATE ON engdocs.library_profile_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Backfill existing OS users (direktur = full library super_admin; TD/finance = doc_admin)
INSERT INTO engdocs.library_profile_roles (profile_id, role)
SELECT
  p.id,
  CASE
    WHEN p.system_role = 'direktur' THEN 'super_admin'::engdocs.doc_user_role
    WHEN p.system_role IS NOT NULL AND p.system_role IN ('technical_director', 'finance')
      THEN 'doc_admin'::engdocs.doc_user_role
    ELSE 'viewer'::engdocs.doc_user_role
  END
FROM public.profiles p
ON CONFLICT (profile_id) DO NOTHING;

-- New OS signups get a library role row
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

DROP TRIGGER IF EXISTS trg_profiles_engdocs_library_role ON public.profiles;
CREATE TRIGGER trg_profiles_engdocs_library_role
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION engdocs.sync_profile_library_role_on_insert();

-- Keep library role loosely aligned when OS system_role changes
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

DROP TRIGGER IF EXISTS trg_profiles_engdocs_library_role_update ON public.profiles;
CREATE TRIGGER trg_profiles_engdocs_library_role_update
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION engdocs.refresh_profile_library_role_on_profile_update();

-- =============================================================
-- RLS helpers (namespaced; do not clash with public.is_admin)
-- =============================================================

CREATE OR REPLACE FUNCTION engdocs.library_get_my_role()
RETURNS engdocs.doc_user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = engdocs, public
AS $$
  SELECT COALESCE(
    (SELECT r.role FROM engdocs.library_profile_roles r WHERE r.profile_id = auth.uid()),
    'viewer'::engdocs.doc_user_role
  );
$$;

CREATE OR REPLACE FUNCTION engdocs.library_is_management()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = engdocs, public
AS $$
  SELECT engdocs.library_get_my_role() IN (
    'super_admin'::engdocs.doc_user_role,
    'doc_admin'::engdocs.doc_user_role
  );
$$;

CREATE OR REPLACE FUNCTION engdocs.library_is_editor_plus()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = engdocs, public
AS $$
  SELECT engdocs.library_get_my_role() IN (
    'super_admin'::engdocs.doc_user_role,
    'doc_admin'::engdocs.doc_user_role,
    'editor'::engdocs.doc_user_role
  );
$$;

GRANT EXECUTE ON FUNCTION engdocs.library_get_my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION engdocs.library_is_management() TO authenticated;
GRANT EXECUTE ON FUNCTION engdocs.library_is_editor_plus() TO authenticated;

-- =============================================================
-- Core library tables
-- =============================================================

CREATE TABLE engdocs.categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id   UUID REFERENCES engdocs.categories(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE engdocs.documents (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                  TEXT,
  title                 TEXT NOT NULL,
  description           TEXT,
  library_type          engdocs.library_type NOT NULL,
  document_type         engdocs.document_type NOT NULL,
  discipline            engdocs.discipline NOT NULL DEFAULT 'general',
  category_id           UUID REFERENCES engdocs.categories(id) ON DELETE SET NULL,
  subcategory_id        UUID REFERENCES engdocs.categories(id) ON DELETE SET NULL,
  owner_id              UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  confidentiality_level engdocs.confidentiality_level NOT NULL DEFAULT 'public_internal',
  usage_mode            engdocs.usage_mode NOT NULL DEFAULT 'read_only',
  current_revision_id   UUID,
  status                engdocs.document_status NOT NULL DEFAULT 'draft',
  source_publisher      TEXT,
  tags                  TEXT[] NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE engdocs.document_revisions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id        UUID NOT NULL REFERENCES engdocs.documents(id) ON DELETE CASCADE,
  revision_label     TEXT NOT NULL DEFAULT 'Rev.00',
  edition_year       INTEGER,
  effective_date     DATE,
  storage_key        TEXT NOT NULL,
  file_name          TEXT NOT NULL,
  file_type          TEXT NOT NULL,
  file_size          BIGINT NOT NULL,
  checksum           TEXT,
  processing_status  engdocs.processing_status NOT NULL DEFAULT 'uploaded',
  is_active          BOOLEAN NOT NULL DEFAULT true,
  uploaded_by        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  uploaded_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes              TEXT
);

ALTER TABLE engdocs.documents
  ADD CONSTRAINT documents_current_revision_fk
  FOREIGN KEY (current_revision_id)
  REFERENCES engdocs.document_revisions(id)
  ON DELETE SET NULL;

CREATE TABLE engdocs.library_activity_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  document_id UUID REFERENCES engdocs.documents(id) ON DELETE SET NULL,
  revision_id UUID REFERENCES engdocs.document_revisions(id) ON DELETE SET NULL,
  action      engdocs.library_activity_action NOT NULL,
  metadata    JSONB,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE engdocs.document_access_rules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id   UUID NOT NULL REFERENCES engdocs.documents(id) ON DELETE CASCADE,
  role          engdocs.doc_user_role,
  user_id       UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  can_view      BOOLEAN NOT NULL DEFAULT false,
  can_download  BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT document_access_rules_role_or_user_chk
    CHECK (role IS NOT NULL OR user_id IS NOT NULL)
);

-- =============================================================
-- Indexes
-- =============================================================

CREATE INDEX idx_engdocs_documents_library_type ON engdocs.documents(library_type);
CREATE INDEX idx_engdocs_documents_discipline   ON engdocs.documents(discipline);
CREATE INDEX idx_engdocs_documents_status       ON engdocs.documents(status);
CREATE INDEX idx_engdocs_documents_tags         ON engdocs.documents USING GIN(tags);
CREATE INDEX idx_engdocs_documents_title        ON engdocs.documents USING GIN(to_tsvector('english', title));
CREATE INDEX idx_engdocs_documents_code         ON engdocs.documents(code) WHERE code IS NOT NULL;
CREATE INDEX idx_engdocs_revisions_document     ON engdocs.document_revisions(document_id);
CREATE INDEX idx_engdocs_revisions_active       ON engdocs.document_revisions(document_id) WHERE is_active = true;
CREATE INDEX idx_engdocs_activity_user          ON engdocs.library_activity_logs(user_id);
CREATE INDEX idx_engdocs_activity_document      ON engdocs.library_activity_logs(document_id);
CREATE INDEX idx_engdocs_activity_created         ON engdocs.library_activity_logs(created_at DESC);

CREATE TRIGGER trg_engdocs_documents_updated_at
  BEFORE UPDATE ON engdocs.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- =============================================================
-- RLS
-- =============================================================

ALTER TABLE engdocs.library_profile_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY library_profile_roles_select
  ON engdocs.library_profile_roles FOR SELECT TO authenticated
  USING (profile_id = auth.uid() OR engdocs.library_is_management());

CREATE POLICY library_profile_roles_update
  ON engdocs.library_profile_roles FOR UPDATE TO authenticated
  USING (engdocs.library_is_management())
  WITH CHECK (engdocs.library_is_management());

ALTER TABLE engdocs.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY engdocs_categories_read
  ON engdocs.categories FOR SELECT TO authenticated
  USING (true);

CREATE POLICY engdocs_categories_write
  ON engdocs.categories FOR ALL TO authenticated
  USING (engdocs.library_is_management())
  WITH CHECK (engdocs.library_is_management());

ALTER TABLE engdocs.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY engdocs_documents_select
  ON engdocs.documents FOR SELECT TO authenticated
  USING (
    engdocs.library_is_management()
    OR (
      status = 'published'
      AND confidentiality_level IN (
        'public_internal'::engdocs.confidentiality_level,
        'restricted_internal'::engdocs.confidentiality_level
      )
    )
    OR EXISTS (
      SELECT 1 FROM engdocs.document_access_rules dar
      WHERE dar.document_id = engdocs.documents.id
        AND (
          dar.user_id = auth.uid()
          OR dar.role = engdocs.library_get_my_role()
        )
        AND dar.can_view = true
    )
  );

CREATE POLICY engdocs_documents_write
  ON engdocs.documents FOR ALL TO authenticated
  USING (engdocs.library_is_management())
  WITH CHECK (engdocs.library_is_management());

ALTER TABLE engdocs.document_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY engdocs_revisions_select
  ON engdocs.document_revisions FOR SELECT TO authenticated
  USING (
    engdocs.library_is_management()
    OR EXISTS (
      SELECT 1 FROM engdocs.documents d
      WHERE d.id = document_id
        AND (
          (
            d.status = 'published'
            AND d.confidentiality_level IN (
              'public_internal'::engdocs.confidentiality_level,
              'restricted_internal'::engdocs.confidentiality_level
            )
          )
          OR engdocs.library_is_management()
        )
    )
  );

CREATE POLICY engdocs_revisions_write
  ON engdocs.document_revisions FOR ALL TO authenticated
  USING (engdocs.library_is_management())
  WITH CHECK (engdocs.library_is_management());

ALTER TABLE engdocs.library_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY engdocs_library_activity_select
  ON engdocs.library_activity_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR engdocs.library_is_management());

CREATE POLICY engdocs_library_activity_insert
  ON engdocs.library_activity_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

ALTER TABLE engdocs.document_access_rules ENABLE ROW LEVEL SECURITY;

-- SELECT: needed so documents_select EXISTS(...) can evaluate for viewers
CREATE POLICY engdocs_access_rules_select
  ON engdocs.document_access_rules FOR SELECT TO authenticated
  USING (
    engdocs.library_is_management()
    OR user_id = auth.uid()
    OR role = engdocs.library_get_my_role()
  );

CREATE POLICY engdocs_access_rules_insert
  ON engdocs.document_access_rules FOR INSERT TO authenticated
  WITH CHECK (engdocs.library_is_management());

CREATE POLICY engdocs_access_rules_update
  ON engdocs.document_access_rules FOR UPDATE TO authenticated
  USING (engdocs.library_is_management())
  WITH CHECK (engdocs.library_is_management());

CREATE POLICY engdocs_access_rules_delete
  ON engdocs.document_access_rules FOR DELETE TO authenticated
  USING (engdocs.library_is_management());

-- =============================================================
-- Seed categories (same as legacy EngDocs 001)
-- =============================================================

INSERT INTO engdocs.categories (name, slug, description) VALUES
  ('Standards & Codes', 'standards-codes', 'International and national engineering standards'),
  ('SNI', 'sni', 'Standar Nasional Indonesia'),
  ('ASME', 'asme', 'American Society of Mechanical Engineers'),
  ('ASTM', 'astm', 'American Society for Testing and Materials'),
  ('API', 'api', 'American Petroleum Institute'),
  ('ACI', 'aci', 'American Concrete Institute'),
  ('Books & Handbooks', 'books-handbooks', 'Engineering textbooks and reference handbooks'),
  ('SOPs', 'sops', 'Standard Operating Procedures'),
  ('Templates & Forms', 'templates-forms', 'Document templates and forms'),
  ('QA/QC Documents', 'qaqc-docs', 'Quality assurance and quality control documents'),
  ('Calculation Tools', 'calc-tools', 'Engineering calculation spreadsheets')
ON CONFLICT (slug) DO NOTHING;
