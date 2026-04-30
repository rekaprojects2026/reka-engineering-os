-- =============================================================
-- Migration: 0015_setting_options
-- Sprint 05A — Settings / Admin Master Data Foundation
-- Creates a single flexible master-data table for configurable
-- business options (disciplines, functional roles, etc.).
-- Seeded with current hardcoded values from lib/constants/options.ts.
-- =============================================================

-- ─── Table ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.setting_options (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  domain      text        NOT NULL,
  value       text        NOT NULL,
  label       text        NOT NULL,
  sort_order  integer     NOT NULL DEFAULT 0,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (domain, value)
);

COMMENT ON TABLE public.setting_options IS
  'Configurable master-data options grouped by domain. Replaces hardcoded dropdown arrays progressively.';

-- ─── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_setting_options_domain
  ON public.setting_options (domain, sort_order);

-- ─── Row Level Security ──────────────────────────────────────
ALTER TABLE public.setting_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "setting_options: authenticated read"
  ON public.setting_options FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "setting_options: admin insert"
  ON public.setting_options FOR INSERT
  WITH CHECK (public.get_my_system_role() = 'admin');

CREATE POLICY "setting_options: admin update"
  ON public.setting_options FOR UPDATE
  USING (public.get_my_system_role() = 'admin');

CREATE POLICY "setting_options: admin delete"
  ON public.setting_options FOR DELETE
  USING (public.get_my_system_role() = 'admin');

-- ─── Seed: functional_role ───────────────────────────────────
INSERT INTO public.setting_options (domain, value, label, sort_order) VALUES
  ('functional_role', 'civil_engineer',      'Civil Engineer',      1),
  ('functional_role', 'structural_engineer', 'Structural Engineer', 2),
  ('functional_role', 'mechanical_engineer', 'Mechanical Engineer', 3),
  ('functional_role', 'electrical_engineer', 'Electrical Engineer', 4),
  ('functional_role', 'drafter',             'Drafter',             5),
  ('functional_role', 'bim_modeler',         'BIM Modeler',         6),
  ('functional_role', 'cad_freelancer',      'CAD Freelancer',      7),
  ('functional_role', 'checker',             'Checker',             8),
  ('functional_role', 'estimator',           'Estimator',           9),
  ('functional_role', 'project_manager',     'Project Manager',     10),
  ('functional_role', 'admin_ops',           'Admin Ops',           11),
  ('functional_role', 'other',               'Other',               12)
ON CONFLICT (domain, value) DO NOTHING;

-- ─── Seed: discipline ────────────────────────────────────────
INSERT INTO public.setting_options (domain, value, label, sort_order) VALUES
  ('discipline', 'mechanical',  'Mechanical',  1),
  ('discipline', 'civil',       'Civil',       2),
  ('discipline', 'structural',  'Structural',  3),
  ('discipline', 'electrical',  'Electrical',  4),
  ('discipline', 'other',       'Other',       5)
ON CONFLICT (domain, value) DO NOTHING;

-- ─── Seed: worker_type ───────────────────────────────────────
INSERT INTO public.setting_options (domain, value, label, sort_order) VALUES
  ('worker_type', 'internal',      'Internal',      1),
  ('worker_type', 'freelancer',    'Freelancer',    2),
  ('worker_type', 'subcontractor', 'Subcontractor', 3)
ON CONFLICT (domain, value) DO NOTHING;

-- ─── Seed: project_type ──────────────────────────────────────
INSERT INTO public.setting_options (domain, value, label, sort_order) VALUES
  ('project_type', 'design',       'Design',       1),
  ('project_type', 'analysis',     'Analysis',     2),
  ('project_type', 'drawing',      'Drawing',      3),
  ('project_type', 'consultation', 'Consultation', 4),
  ('project_type', 'inspection',   'Inspection',   5),
  ('project_type', 'other',        'Other',        6)
ON CONFLICT (domain, value) DO NOTHING;

-- ─── Seed: task_category ─────────────────────────────────────
INSERT INTO public.setting_options (domain, value, label, sort_order) VALUES
  ('task_category', 'brief_review',         'Brief Review',         1),
  ('task_category', 'reference_collection', 'Reference Collection', 2),
  ('task_category', 'modeling',             'Modeling',             3),
  ('task_category', 'drafting',             'Drafting',             4),
  ('task_category', 'calculation',          'Calculation',          5),
  ('task_category', 'checking',             'Checking',             6),
  ('task_category', 'boq',                  'BOQ',                  7),
  ('task_category', 'report_writing',       'Report Writing',       8),
  ('task_category', 'revision',             'Revision',             9),
  ('task_category', 'coordination',         'Coordination',         10),
  ('task_category', 'submission_prep',      'Submission Prep',      11),
  ('task_category', 'admin',                'Admin',                12)
ON CONFLICT (domain, value) DO NOTHING;

-- ─── Seed: deliverable_type ──────────────────────────────────
INSERT INTO public.setting_options (domain, value, label, sort_order) VALUES
  ('deliverable_type', 'drawing',            'Drawing',            1),
  ('deliverable_type', '3d_model',           '3D Model',           2),
  ('deliverable_type', 'report',             'Report',             3),
  ('deliverable_type', 'boq',                'BOQ',                4),
  ('deliverable_type', 'calculation_sheet',  'Calculation Sheet',  5),
  ('deliverable_type', 'presentation',       'Presentation',       6),
  ('deliverable_type', 'specification',      'Specification',      7),
  ('deliverable_type', 'revision_package',   'Revision Package',   8),
  ('deliverable_type', 'submission_package', 'Submission Package', 9)
ON CONFLICT (domain, value) DO NOTHING;

-- ─── Seed: file_category ─────────────────────────────────────
INSERT INTO public.setting_options (domain, value, label, sort_order) VALUES
  ('file_category', 'reference',            'Reference',            1),
  ('file_category', 'draft',                'Draft',                2),
  ('file_category', 'working_file',         'Working File',         3),
  ('file_category', 'review_copy',          'Review Copy',          4),
  ('file_category', 'final',                'Final',                5),
  ('file_category', 'submission',           'Submission',           6),
  ('file_category', 'supporting_document',  'Supporting Document',  7)
ON CONFLICT (domain, value) DO NOTHING;

-- ─── Seed: payment_method ────────────────────────────────────
INSERT INTO public.setting_options (domain, value, label, sort_order) VALUES
  ('payment_method', 'bank_transfer', 'Bank Transfer', 1),
  ('payment_method', 'ewallet',       'E-Wallet',      2),
  ('payment_method', 'cash',          'Cash',          3),
  ('payment_method', 'other',         'Other',         4)
ON CONFLICT (domain, value) DO NOTHING;

-- =============================================================
