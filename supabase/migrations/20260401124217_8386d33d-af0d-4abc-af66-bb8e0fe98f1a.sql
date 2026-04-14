
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  nom text NOT NULL,
  prix_mensuel integer NOT NULL DEFAULT 0,
  prix_semestriel integer DEFAULT NULL,
  promo_active boolean NOT NULL DEFAULT false,
  promo_label text DEFAULT NULL,
  promo_prix_mensuel integer DEFAULT NULL,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  ordre integer NOT NULL DEFAULT 0,
  actif boolean NOT NULL DEFAULT true,
  highlighted boolean NOT NULL DEFAULT false,
  badge text DEFAULT NULL,
  cta_text text NOT NULL DEFAULT 'Rejoindre la liste',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active plans" ON public.plans
  FOR SELECT TO anon, authenticated
  USING (actif = true);

CREATE POLICY "Admins can manage plans" ON public.plans
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed default plans
INSERT INTO public.plans (slug, nom, prix_mensuel, prix_semestriel, features, ordre, highlighted, badge, cta_text) VALUES
  ('freemium', 'Freemium', 0, NULL, '["2 clients actifs","Calendrier éditorial","Lien de validation (filigrane)"]', 0, false, NULL, 'Commencer gratuitement'),
  ('solo_standard', 'Solo Standard', 15000, 75000, '["Clients illimités","Calendrier éditorial","Lien validation sans filigrane","Facturation FCFA","Comptabilité intégrée","Rapports KPI PDF"]', 1, true, 'Le plus choisi', 'Rejoindre la liste'),
  ('agence_standard', 'Agence Standard', 35000, 175000, '["1 DM + 3 membres","Tout Solo Standard inclus","Workflow créateur","Journal d''équipe"]', 2, false, NULL, 'Rejoindre la liste'),
  ('agence_pro', 'Agence Pro', 55000, 275000, '["1 DM + 7 membres","Tout Agence Standard inclus","Support prioritaire","Upgrade sur demande"]', 3, false, NULL, 'Rejoindre la liste');
