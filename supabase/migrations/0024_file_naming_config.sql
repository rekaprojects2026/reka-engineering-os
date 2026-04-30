-- =============================================================
-- Migration: 0024_file_naming_config
-- Stage F — Configurable file naming + project code from prefix
-- =============================================================

-- ─── file_naming_config ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.file_naming_config (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key      text        UNIQUE NOT NULL,
  config_value    text        NOT NULL,
  label           text        NOT NULL,
  description     text,
  updated_by      uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.file_naming_config IS
  'Konfigurasi file naming system yang configurable per organisasi.';

ALTER TABLE public.file_naming_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "file_naming_config: authenticated read"
  ON public.file_naming_config FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "file_naming_config: td or direktur update"
  ON public.file_naming_config FOR UPDATE
  TO authenticated
  USING (public.is_technical_director() OR public.is_direktur())
  WITH CHECK (public.is_technical_director() OR public.is_direktur());

INSERT INTO public.file_naming_config (config_key, config_value, label, description) VALUES
  ('project_prefix',    'RKA',                        'Prefix Kode Project',       'Prefix sebelum tahun dan nomor urut. Contoh: RKA → RKA2401'),
  ('separator',         '-',                          'Separator',                 'Karakter pemisah antar bagian. Bisa - atau _'),
  ('revision_format',   'R0_RA_RB',                   'Format Revisi',             'R0_RA_RB = R0/RA/RB; Rev0_RevA_RevB = Rev0/RevA/RevB; NUM = 00/01/02'),
  ('discipline_codes',  'MCH:Mechanical,CVL:Civil',   'Kode Disiplin',             'Format: KODE:NamaLengkap, pisahkan dengan koma. Contoh: MCH:Mechanical,CVL:Civil,ARC:Architecture'),
  ('doc_type_codes',    'DR:Drawing,CA:Calculation,RP:Report,SP:Specification,RN:Rendering,BQ:Bill of Quantity,3D:3D Model', 'Kode Tipe Dokumen', 'Format: KODE:NamaLengkap, pisahkan dengan koma')
ON CONFLICT (config_key) DO NOTHING;

-- ─── project_files naming columns ─────────────────────────────
ALTER TABLE public.project_files ADD COLUMN IF NOT EXISTS
  file_code text;

ALTER TABLE public.project_files ADD COLUMN IF NOT EXISTS
  revision_code text NOT NULL DEFAULT 'R0';

ALTER TABLE public.project_files ADD COLUMN IF NOT EXISTS
  discipline_code text;

ALTER TABLE public.project_files ADD COLUMN IF NOT EXISTS
  doc_type_code text;

COMMENT ON COLUMN public.project_files.file_code IS
  'Generated file code berdasarkan file naming config. Contoh: RKA2401-MCH-DR-001-R0';

-- ─── Project code generation (prefix + YY + seq from config) ──
CREATE OR REPLACE FUNCTION public.generate_project_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  prefix     text;
  year_part  text := to_char(now(), 'YY');
  seq        int;
BEGIN
  SELECT COALESCE(
    NULLIF(btrim((SELECT fc.config_value FROM public.file_naming_config fc WHERE fc.config_key = 'project_prefix' LIMIT 1)), ''),
    'RKA'
  ) INTO prefix;

  SELECT COALESCE(MAX(substring(p.project_code FROM char_length(prefix) + 3 FOR 2)::int), 0) + 1
  INTO seq
  FROM public.projects p
  WHERE char_length(p.project_code) = char_length(prefix) + 4
    AND substring(p.project_code FROM 1 FOR char_length(prefix)) = prefix
    AND substring(p.project_code FROM char_length(prefix) + 1 FOR 2) = year_part
    AND substring(p.project_code FROM char_length(prefix) + 3 FOR 2) ~ '^[0-9]{2}$';

  NEW.project_code := prefix || year_part || lpad(seq::text, 2, '0');
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.generate_project_code() IS
  'Assigns project_code as {prefix}{YY}{NN} using file_naming_config.project_prefix when code is empty.';
