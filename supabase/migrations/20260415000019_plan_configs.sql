-- Migration: plan_configs
-- Durées et prix de licence flexibles, configurables depuis Admin

CREATE TABLE public.plan_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_type TEXT NOT NULL,
  -- 'solo' | 'agence_standard' | 'agence_pro'
  duree_mois INTEGER NOT NULL,
  prix_fcfa INTEGER NOT NULL,
  est_actif BOOLEAN DEFAULT true,
  est_populaire BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Données par défaut
INSERT INTO public.plan_configs (plan_type, duree_mois, prix_fcfa, est_actif) VALUES
('solo', 1, 15000, true),
('solo', 3, 40000, true),
('solo', 6, 75000, true),
('solo', 12, 140000, true),
('agence_standard', 1, 35000, true),
('agence_standard', 3, 95000, true),
('agence_standard', 6, 175000, true),
('agence_standard', 12, 330000, true),
('agence_pro', 1, 55000, true),
('agence_pro', 3, 150000, true),
('agence_pro', 6, 275000, true),
('agence_pro', 12, 520000, true);

-- Marquer 6 mois comme "Le plus choisi" par défaut
UPDATE public.plan_configs SET est_populaire = true WHERE duree_mois = 6;

-- RLS
ALTER TABLE public.plan_configs ENABLE ROW LEVEL SECURITY;

-- Lecture publique (landing page sans auth)
CREATE POLICY "plan_configs_select_public" ON public.plan_configs
  FOR SELECT USING (true);

-- Écriture admin uniquement
CREATE POLICY "plan_configs_all_admin" ON public.plan_configs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
