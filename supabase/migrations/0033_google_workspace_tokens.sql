-- Single-tenant Google Drive OAuth tokens (management roles only).

CREATE TABLE IF NOT EXISTS public.google_workspace_tokens (
  id               text PRIMARY KEY DEFAULT 'default',
  refresh_token    text,
  access_token     text,
  expires_at       timestamptz,
  provider_email   text,
  updated_by       uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.google_workspace_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "google_workspace_tokens: management read"
  ON public.google_workspace_tokens FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.system_role IN ('direktur', 'technical_director', 'finance')
    )
  );

CREATE POLICY "google_workspace_tokens: management write"
  ON public.google_workspace_tokens FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.system_role IN ('direktur', 'technical_director', 'finance')
    )
  );

CREATE POLICY "google_workspace_tokens: management update"
  ON public.google_workspace_tokens FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.system_role IN ('direktur', 'technical_director', 'finance')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.system_role IN ('direktur', 'technical_director', 'finance')
    )
  );
