-- Nettoyage de l'ancien schéma et recréation propre
DROP TABLE IF EXISTS public.testimonials CASCADE;
DROP TABLE IF EXISTS public.testimonials_config CASCADE;

CREATE TABLE public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  fonction TEXT NOT NULL,
  texte TEXT NOT NULL,
  photo_url TEXT,
  est_actif BOOLEAN DEFAULT true,
  ordre INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active testimonials"
ON public.testimonials FOR SELECT
USING (est_actif = true);

CREATE POLICY "Owner can manage testimonials"
ON public.testimonials FOR ALL
USING (true);

-- Témoignages de départ
INSERT INTO public.testimonials (nom, fonction, texte, ordre) VALUES
('Ayssata Deme',
 'Community Manager Freelance',
 'Digal a complètement transformé ma façon de travailler. Fini les allers-retours sur WhatsApp — mes clients valident directement sur la plateforme.',
 1),
('Moussa Diallo',
 'Digital Manager, Agence Créative',
 'Avec Digal, mon équipe est parfaitement coordonnée. Le calendrier éditorial brandé impressionne systématiquement nos clients.',
 2),
('Fatou Sow',
 'CM Solo, Dakar',
 'La facturation en FCFA avec Wave et Orange Money, c''est exactement ce dont j''avais besoin. Tout est pensé pour notre marché.',
 3);
