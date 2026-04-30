-- =============================================================
-- Migration: 0036_discipline_array_drive_mode
-- Multi-discipline projects + Drive mode + Construction Admin flag
-- =============================================================

-- ─── disciplines (array); keep legacy discipline column ─────
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS disciplines text[] NOT NULL DEFAULT '{}';

UPDATE public.projects
SET disciplines = ARRAY[discipline]
WHERE discipline IS NOT NULL
  AND btrim(discipline) <> ''
  AND disciplines = '{}';

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS drive_mode text DEFAULT 'auto';

ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_drive_mode_check;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_drive_mode_check
  CHECK (drive_mode IS NULL OR drive_mode IN ('auto', 'manual', 'none'));

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS drive_construction_admin_created boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.projects.disciplines IS
  'Project disciplines (multi-select). Legacy discipline column is deprecated.';

COMMENT ON COLUMN public.projects.drive_mode IS
  'Google Drive: auto = create hierarchy; manual = use provided link; none = skip.';

COMMENT ON COLUMN public.projects.drive_construction_admin_created IS
  'True after 06-Construction-Admin folders were added under each discipline folder.';

-- ─── Drive root folder name (stored with file naming config) ─
INSERT INTO public.file_naming_config (config_key, config_value, label, description)
VALUES (
  'drive_root_folder_name',
  'Projects',
  'Google Drive root folder',
  'Parent folder name under My Drive for all auto-created project hierarchies.'
)
ON CONFLICT (config_key) DO NOTHING;
