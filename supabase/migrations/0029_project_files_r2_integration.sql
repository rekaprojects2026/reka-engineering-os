-- =============================================================
-- Migration: 0029_project_files_r2_integration
-- Cloudflare R2 (S3-compatible): metadata columns + provider 'r2'
-- =============================================================

ALTER TABLE public.project_files
  ADD COLUMN IF NOT EXISTS file_size_bytes bigint,
  ADD COLUMN IF NOT EXISTS r2_key text,
  ADD COLUMN IF NOT EXISTS r2_url text;

COMMENT ON COLUMN public.project_files.r2_key IS 'Private R2 object key (S3-compatible).';
COMMENT ON COLUMN public.project_files.r2_url IS 'Optional public URL when R2_PUBLIC_URL / custom domain is configured.';
COMMENT ON COLUMN public.project_files.file_size_bytes IS 'Uploaded object size in bytes.';

ALTER TABLE public.project_files DROP CONSTRAINT IF EXISTS project_files_provider_check;
ALTER TABLE public.project_files ADD CONSTRAINT project_files_provider_check
  CHECK (provider IN ('manual', 'google_drive', 'r2'));
