-- =============================================================
-- Migration: 0042_engdocs_library_phase1
-- Extends engdocs enums + archive/legal/inbox/FTS (Phase 1)
-- Depends on: 0041_engdocs_library_schema
-- =============================================================

-- =============================================================
-- 002-equivalent: extend enums + seed categories
-- =============================================================

ALTER TYPE engdocs.library_type ADD VALUE IF NOT EXISTS 'project_archive';
ALTER TYPE engdocs.library_type ADD VALUE IF NOT EXISTS 'company_legal';

ALTER TYPE engdocs.document_type ADD VALUE IF NOT EXISTS 'akta';
ALTER TYPE engdocs.document_type ADD VALUE IF NOT EXISTS 'izin';
ALTER TYPE engdocs.document_type ADD VALUE IF NOT EXISTS 'sertifikat';
ALTER TYPE engdocs.document_type ADD VALUE IF NOT EXISTS 'kontrak_template';
ALTER TYPE engdocs.document_type ADD VALUE IF NOT EXISTS 'pajak';
ALTER TYPE engdocs.document_type ADD VALUE IF NOT EXISTS 'case_study';
ALTER TYPE engdocs.document_type ADD VALUE IF NOT EXISTS 'as_built';

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'engdocs'
      AND t.typname = 'confidentiality_level'
      AND e.enumlabel = 'external_reference_only'
  ) THEN
    ALTER TYPE engdocs.confidentiality_level ADD VALUE 'external_reference_only';
  END IF;
END $$;

INSERT INTO engdocs.categories (name, slug, description) VALUES
  ('Project Archive',   'project-archive',   'Archive dari project yang sudah closed'),
  ('Company Legal',     'company-legal',     'Dokumen legal perusahaan'),
  ('Akta & Pendirian',  'akta-pendirian',    'Akta notaris, SK Menkumham'),
  ('Izin Usaha',        'izin-usaha',        'NIB, SIUP, SBU, SIUJK'),
  ('Sertifikat Profesi','sertifikat-profesi','SKA, SKT, sertifikat engineer'),
  ('Kontrak Template',  'kontrak-template',  'Template kontrak klien & vendor'),
  ('Pajak & BPJS',      'pajak-bpjs',        'NPWP, SPT, BPJS records')
ON CONFLICT (slug) DO NOTHING;

-- =============================================================
-- 003: project archive metadata
-- =============================================================

CREATE TABLE engdocs.project_archive_metadata (
  document_id            UUID        PRIMARY KEY REFERENCES engdocs.documents(id) ON DELETE CASCADE,
  source_project_id      UUID        NOT NULL,
  source_project_code    TEXT        NOT NULL,
  source_client_id       UUID,
  source_client_code     TEXT,
  client_display_name    TEXT        NOT NULL,
  project_name           TEXT        NOT NULL,
  project_year           INTEGER     NOT NULL CHECK (project_year BETWEEN 2000 AND 2100),
  project_disciplines    TEXT[]      NOT NULL DEFAULT '{}',
  project_value_idr      BIGINT,
  project_duration_days  INTEGER,
  is_shareable           BOOLEAN     NOT NULL DEFAULT false,
  anonymize_client       BOOLEAN     NOT NULL DEFAULT false,
  curated_summary        TEXT,
  key_lessons            TEXT[]      DEFAULT '{}',
  reusable_artifacts     TEXT[]      DEFAULT '{}',
  source_drive_link      TEXT,
  archived_from_status   TEXT        NOT NULL,
  archived_by            UUID        REFERENCES public.profiles(id),
  archived_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_engdocs_archive_source_proj ON engdocs.project_archive_metadata(source_project_id);
CREATE INDEX idx_engdocs_archive_year         ON engdocs.project_archive_metadata(project_year DESC);
CREATE INDEX idx_engdocs_archive_disciplines  ON engdocs.project_archive_metadata USING GIN(project_disciplines);
CREATE INDEX idx_engdocs_archive_shareable    ON engdocs.project_archive_metadata(is_shareable) WHERE is_shareable = true;

ALTER TABLE engdocs.project_archive_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY engdocs_archive_read
  ON engdocs.project_archive_metadata FOR SELECT TO authenticated
  USING (
    is_shareable = true
    OR engdocs.library_get_my_role() IN (
      'super_admin'::engdocs.doc_user_role,
      'doc_admin'::engdocs.doc_user_role
    )
  );

CREATE POLICY engdocs_archive_write
  ON engdocs.project_archive_metadata FOR ALL TO authenticated
  USING (
    engdocs.library_get_my_role() IN (
      'super_admin'::engdocs.doc_user_role,
      'doc_admin'::engdocs.doc_user_role
    )
  )
  WITH CHECK (
    engdocs.library_get_my_role() IN (
      'super_admin'::engdocs.doc_user_role,
      'doc_admin'::engdocs.doc_user_role
    )
  );

-- =============================================================
-- 004: legal document metadata
-- =============================================================

CREATE TABLE engdocs.legal_document_metadata (
  document_id            UUID        PRIMARY KEY REFERENCES engdocs.documents(id) ON DELETE CASCADE,
  document_number        TEXT        NOT NULL,
  legal_category         TEXT        NOT NULL,
  legal_subcategory      TEXT,
  issued_by              TEXT        NOT NULL,
  issued_date            DATE        NOT NULL,
  registered_address     TEXT,
  has_expiry             BOOLEAN     NOT NULL DEFAULT false,
  expiry_date            DATE,
  reminder_days_before   INTEGER     DEFAULT 60,
  renewal_status         TEXT        CHECK (renewal_status IN ('not_required','pending','in_progress','renewed')),
  holder_type            TEXT        CHECK (holder_type IN ('company','individual')),
  holder_name            TEXT,
  holder_user_id         UUID        REFERENCES public.profiles(id),
  parent_document_id     UUID        REFERENCES engdocs.documents(id) ON DELETE SET NULL,
  scope_summary          TEXT,
  conditions             TEXT,
  CONSTRAINT engdocs_legal_expiry_chk CHECK (
    has_expiry = false OR (has_expiry = true AND expiry_date IS NOT NULL)
  )
);

CREATE INDEX idx_engdocs_legal_expiry_date ON engdocs.legal_document_metadata(expiry_date) WHERE has_expiry = true;
CREATE INDEX idx_engdocs_legal_category     ON engdocs.legal_document_metadata(legal_category);
CREATE INDEX idx_engdocs_legal_parent         ON engdocs.legal_document_metadata(parent_document_id);

ALTER TABLE engdocs.legal_document_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY engdocs_legal_access
  ON engdocs.legal_document_metadata FOR ALL TO authenticated
  USING (
    engdocs.library_get_my_role() IN (
      'super_admin'::engdocs.doc_user_role,
      'doc_admin'::engdocs.doc_user_role
    )
  )
  WITH CHECK (
    engdocs.library_get_my_role() IN (
      'super_admin'::engdocs.doc_user_role,
      'doc_admin'::engdocs.doc_user_role
    )
  );

-- =============================================================
-- 005: archive inbox
-- =============================================================

CREATE TABLE engdocs.archive_inbox (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  source_project_id    UUID        NOT NULL UNIQUE,
  source_project_code  TEXT        NOT NULL,
  source_payload       JSONB       NOT NULL,
  source_files         JSONB       NOT NULL,
  status               TEXT        NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','in_review','published','rejected')),
  assigned_to          UUID        REFERENCES public.profiles(id),
  curated_documents    UUID[]      DEFAULT '{}',
  rejection_reason     TEXT,
  received_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  curated_at           TIMESTAMPTZ
);

CREATE INDEX idx_engdocs_inbox_status   ON engdocs.archive_inbox(status);
CREATE INDEX idx_engdocs_inbox_received ON engdocs.archive_inbox(received_at DESC);
CREATE INDEX idx_engdocs_inbox_assigned ON engdocs.archive_inbox(assigned_to) WHERE status IN ('pending','in_review');

ALTER TABLE engdocs.archive_inbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY engdocs_inbox_access
  ON engdocs.archive_inbox FOR ALL TO authenticated
  USING (
    engdocs.library_get_my_role() IN (
      'super_admin'::engdocs.doc_user_role,
      'doc_admin'::engdocs.doc_user_role
    )
  )
  WITH CHECK (
    engdocs.library_get_my_role() IN (
      'super_admin'::engdocs.doc_user_role,
      'doc_admin'::engdocs.doc_user_role
    )
  );

-- =============================================================
-- 006: full-text search + RPC
-- =============================================================

CREATE TABLE engdocs.document_full_text (
  document_id   UUID        PRIMARY KEY REFERENCES engdocs.documents(id) ON DELETE CASCADE,
  page_count    INTEGER,
  text_content  TSVECTOR,
  abstract      TEXT,
  toc           JSONB       DEFAULT '[]',
  indexed_at    TIMESTAMPTZ,
  requires_ocr  BOOLEAN     NOT NULL DEFAULT false
);

CREATE INDEX idx_engdocs_doc_fts_content ON engdocs.document_full_text USING GIN(text_content);

ALTER TABLE engdocs.document_full_text ENABLE ROW LEVEL SECURITY;

CREATE POLICY engdocs_fts_read
  ON engdocs.document_full_text FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY engdocs_fts_write
  ON engdocs.document_full_text FOR ALL TO authenticated
  USING (engdocs.library_is_editor_plus())
  WITH CHECK (engdocs.library_is_editor_plus());

CREATE OR REPLACE FUNCTION engdocs.search_documents(search_query text, result_limit int DEFAULT 20)
RETURNS TABLE (
  document_id   uuid,
  title         text,
  library_type  text,
  highlight     text,
  rank          real
)
LANGUAGE sql
STABLE
SET search_path = engdocs, public
AS $$
  SELECT
    d.id,
    d.title,
    d.library_type::text,
    ts_headline(
      'simple',
      ft.abstract,
      plainto_tsquery('simple', search_query),
      'MaxWords=30, MinWords=15, ShortWord=3, StartSel=<mark>, StopSel=</mark>'
    ),
    ts_rank(ft.text_content, plainto_tsquery('simple', search_query))::real
  FROM engdocs.documents d
  JOIN engdocs.document_full_text ft ON ft.document_id = d.id
  WHERE
    ft.text_content @@ plainto_tsquery('simple', search_query)
    AND d.status = 'published'::engdocs.document_status
  ORDER BY 5 DESC
  LIMIT result_limit;
$$;

GRANT EXECUTE ON FUNCTION engdocs.search_documents(text, int) TO authenticated;
GRANT EXECUTE ON FUNCTION engdocs.search_documents(text, int) TO service_role;
