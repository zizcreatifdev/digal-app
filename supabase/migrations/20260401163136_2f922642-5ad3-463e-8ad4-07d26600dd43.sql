
-- Contract templates (owner-editable)
CREATE TABLE public.contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL DEFAULT 'Contrat standard',
  plan_slug TEXT NOT NULL,
  clauses JSONB NOT NULL DEFAULT '[]'::jsonb,
  owner_signature_url TEXT,
  owner_cachet_url TEXT,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage contract templates" ON public.contract_templates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can read active templates" ON public.contract_templates
  FOR SELECT TO authenticated
  USING (actif = true);

-- Signed contracts
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.contract_templates(id),
  plan_slug TEXT NOT NULL,
  plan_nom TEXT NOT NULL,
  prix_mensuel INTEGER NOT NULL DEFAULT 0,
  duree_mois INTEGER NOT NULL DEFAULT 6,
  clauses JSONB NOT NULL DEFAULT '[]'::jsonb,
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  email TEXT NOT NULL,
  signature_url TEXT,
  owner_signature_url TEXT,
  owner_cachet_url TEXT,
  pdf_url TEXT,
  signed_at TIMESTAMPTZ,
  statut TEXT NOT NULL DEFAULT 'en_attente',
  type_contrat TEXT NOT NULL DEFAULT 'souscription',
  ancien_plan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own contracts" ON public.contracts
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contracts" ON public.contracts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contracts" ON public.contracts
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all contracts" ON public.contracts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Receipt templates
CREATE TABLE public.receipt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  layout JSONB NOT NULL DEFAULT '{}'::jsonb,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.receipt_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage receipt templates" ON public.receipt_templates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can read receipt templates" ON public.receipt_templates
  FOR SELECT TO authenticated
  USING (actif = true);

-- Storage bucket for contract signatures and PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('contracts', 'contracts', false);

CREATE POLICY "Users can upload own signatures" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'contracts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read own contract files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'contracts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins can read all contract files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'contracts' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can upload contract files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'contracts' AND public.has_role(auth.uid(), 'admin'));

-- Insert default contract templates for each plan
INSERT INTO public.contract_templates (nom, plan_slug, clauses) VALUES
('Contrat Solo Standard', 'solo_standard', '[
  {"titre": "Objet du contrat", "contenu": "Le present contrat definit les conditions d''utilisation de la licence Digal Solo Standard entre le prestataire et Digal."},
  {"titre": "Duree et renouvellement", "contenu": "Le contrat est conclu pour une duree de 6 mois, renouvelable par tacite reconduction sauf denonciation par l''une des parties avec un preavis de 30 jours."},
  {"titre": "Tarification", "contenu": "Le montant de la licence est defini selon le plan choisi et payable mensuellement ou semestriellement."},
  {"titre": "Conditions d''utilisation", "contenu": "L''utilisateur s''engage a utiliser la plateforme conformement aux conditions generales d''utilisation et a ne pas partager ses identifiants d''acces."},
  {"titre": "Resiliation", "contenu": "Chaque partie peut resilier le contrat avec un preavis de 30 jours. En cas de resiliation anticipee, aucun remboursement ne sera effectue pour la periode en cours."},
  {"titre": "Protection des donnees", "contenu": "Digal s''engage a proteger les donnees personnelles conformement a la reglementation en vigueur. Les donnees du client restent sa propriete exclusive."},
  {"titre": "Responsabilite", "contenu": "Digal ne saurait etre tenu responsable des dommages indirects lies a l''utilisation de la plateforme."},
  {"titre": "Droit applicable", "contenu": "Le present contrat est regi par le droit senegalais. En cas de litige, les tribunaux de Dakar seront competents."}
]'::jsonb),
('Contrat Agence Standard', 'agence_standard', '[
  {"titre": "Objet du contrat", "contenu": "Le present contrat definit les conditions d''utilisation de la licence Digal Agence Standard entre l''agence et Digal."},
  {"titre": "Duree et renouvellement", "contenu": "Le contrat est conclu pour une duree de 6 mois, renouvelable par tacite reconduction sauf denonciation par l''une des parties avec un preavis de 30 jours."},
  {"titre": "Tarification", "contenu": "Le montant de la licence est defini selon le plan choisi et payable mensuellement ou semestriellement. Le plan inclut la gestion multi-membres."},
  {"titre": "Gestion d''equipe", "contenu": "L''agence est responsable de la gestion des acces de ses membres (CM, createurs). Les comptes membres sont lies au compte agence."},
  {"titre": "Conditions d''utilisation", "contenu": "L''agence s''engage a utiliser la plateforme conformement aux conditions generales et a garantir le respect de ces conditions par ses membres."},
  {"titre": "Resiliation", "contenu": "Chaque partie peut resilier le contrat avec un preavis de 30 jours. La resiliation entraine la desactivation de tous les comptes membres."},
  {"titre": "Protection des donnees", "contenu": "Digal s''engage a proteger les donnees personnelles. Les donnees clients de l''agence restent la propriete exclusive de l''agence."},
  {"titre": "Droit applicable", "contenu": "Le present contrat est regi par le droit senegalais. En cas de litige, les tribunaux de Dakar seront competents."}
]'::jsonb),
('Contrat Agence Pro', 'agence_pro', '[
  {"titre": "Objet du contrat", "contenu": "Le present contrat definit les conditions d''utilisation de la licence Digal Agence Pro entre l''agence et Digal."},
  {"titre": "Duree et renouvellement", "contenu": "Le contrat est conclu pour une duree de 6 mois, renouvelable par tacite reconduction sauf denonciation par l''une des parties avec un preavis de 30 jours."},
  {"titre": "Tarification", "contenu": "Le montant de la licence est defini selon le plan Pro et payable mensuellement ou semestriellement. Inclut toutes les fonctionnalites premium."},
  {"titre": "Gestion d''equipe", "contenu": "L''agence Pro beneficie d''un nombre illimite de membres et de clients. L''agence est responsable de la gestion de ses acces."},
  {"titre": "Support prioritaire", "contenu": "L''agence Pro beneficie d''un support prioritaire et d''un accompagnement personnalise pour la mise en place de la plateforme."},
  {"titre": "Resiliation", "contenu": "Chaque partie peut resilier le contrat avec un preavis de 30 jours. La resiliation entraine la desactivation de tous les comptes membres."},
  {"titre": "Protection des donnees", "contenu": "Digal s''engage a proteger les donnees personnelles conformement a la reglementation. Les donnees restent la propriete de l''agence."},
  {"titre": "Droit applicable", "contenu": "Le present contrat est regi par le droit senegalais. En cas de litige, les tribunaux de Dakar seront competents."}
]'::jsonb);

-- Insert default receipt templates
INSERT INTO public.receipt_templates (nom, slug, layout) VALUES
('Classique', 'classique', '{"style": "classic", "showLogo": true, "showFeatures": true, "accentColor": "#C4522A", "headerPosition": "left"}'::jsonb),
('Moderne', 'moderne', '{"style": "modern", "showLogo": true, "showFeatures": true, "accentColor": "#C4522A", "headerPosition": "center"}'::jsonb),
('Minimal', 'minimal', '{"style": "minimal", "showLogo": true, "showFeatures": false, "accentColor": "#1A1A1A", "headerPosition": "left"}'::jsonb),
('Premium', 'premium', '{"style": "premium", "showLogo": true, "showFeatures": true, "accentColor": "#C4522A", "headerPosition": "right", "showWatermark": true}'::jsonb);
