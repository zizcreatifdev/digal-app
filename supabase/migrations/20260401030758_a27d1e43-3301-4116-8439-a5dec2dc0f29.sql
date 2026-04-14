
CREATE TABLE public.changelog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL,
  titre text NOT NULL,
  description text NOT NULL,
  type_version text NOT NULL DEFAULT 'patch',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.changelog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read changelog"
  ON public.changelog FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage changelog"
  ON public.changelog FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_changelog_created ON public.changelog(created_at DESC);
