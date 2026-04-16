CREATE TABLE public.elite_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  agence TEXT NOT NULL,
  email TEXT NOT NULL,
  telephone TEXT NOT NULL,
  nb_membres TEXT NOT NULL,
  message TEXT,
  statut TEXT DEFAULT 'nouveau',
  -- 'nouveau' | 'contacte' | 'en_negociation' | 'signe' | 'refuse'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.elite_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert elite requests"
  ON public.elite_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Owner can manage elite requests"
  ON public.elite_requests FOR ALL
  USING (true);
