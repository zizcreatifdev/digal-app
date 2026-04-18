-- prompt-54 : Messages d'activation personnalisés par plan

CREATE TABLE public.activation_messages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_slug   TEXT        UNIQUE NOT NULL,
  -- 'freemium' | 'solo_standard' | 'agence_standard' | 'agence_pro'
  message     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.activation_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage activation messages"
  ON public.activation_messages FOR ALL
  USING (true);

-- Messages par défaut
INSERT INTO public.activation_messages (plan_slug, message) VALUES

('freemium', 'Bonjour [Prénom] 👋

Votre accès Digal est prêt !

Vous rejoignez la communauté en version Découverte. Testez la plateforme gratuitement et sans engagement.

Lien d''activation (valable 48h) :
[Lien]

Cliquez sur le lien pour créer votre mot de passe et accéder à votre espace Digal.

À très vite,
L''équipe Digal 🚀'),

('solo_standard', 'Bonjour [Prénom] 👋

Bienvenue dans la communauté Digal !

Votre licence CM Pro ([Durée] mois) est activée. Gérez vos clients comme un vrai professionnel.

Lien d''activation (valable 48h) :
[Lien]

Cliquez sur le lien pour créer votre mot de passe et accéder à votre espace Digal.

À très vite,
L''équipe Digal 🚀'),

('agence_standard', 'Bonjour [Prénom] 👋

Votre agence rejoint Digal !

Licence Studio ([Durée] mois) — jusqu''à 4 membres. Invitez votre équipe dès votre première connexion.

Lien d''activation (valable 48h) :
[Lien]

Cliquez sur le lien pour créer votre mot de passe et accéder à votre espace Digal.

À très vite,
L''équipe Digal 🚀'),

('agence_pro', 'Bonjour [Prénom] 👋

Bienvenue dans l''élite Digal !

Votre accès Elite ([Durée] mois) est prêt. Notre équipe vous accompagne dans votre onboarding.

Lien d''activation (valable 48h) :
[Lien]

Cliquez sur le lien pour créer votre mot de passe et accéder à votre espace Digal.

À très vite,
L''équipe Digal 🚀');
