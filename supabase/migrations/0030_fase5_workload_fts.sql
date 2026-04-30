-- =============================================================
-- Migration: 0030_fase5_workload_fts
-- Fase 5 — workload thresholds in setting_options + FTS helpers
-- =============================================================

-- ─── Workload band thresholds (value = numeric upper bound; sort_order = band order) ──
INSERT INTO public.setting_options (domain, value, label, sort_order) VALUES
  ('workload_thresholds', '3',  'Open tasks below this count → Low workload', 1),
  ('workload_thresholds', '8',  'Open tasks below this count → Normal', 2),
  ('workload_thresholds', '13', 'Open tasks below this count → High', 3)
ON CONFLICT (domain, value) DO NOTHING;

-- ─── FTS: generated tsvector columns (Supabase textSearch targets) ────────────

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS title_tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('simple', coalesce(title, ''))) STORED;

CREATE INDEX IF NOT EXISTS tasks_title_tsv_idx
  ON public.tasks USING GIN (title_tsv);

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS search_tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(project_code, ''))) STORED;

CREATE INDEX IF NOT EXISTS projects_search_tsv_idx
  ON public.projects USING GIN (search_tsv);
