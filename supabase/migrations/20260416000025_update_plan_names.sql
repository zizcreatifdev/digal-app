-- Mise à jour des noms de plans dans la table plans
-- Anciens noms → Nouveaux noms (prompt-46)

UPDATE public.plans SET nom = 'Découverte' WHERE slug = 'freemium';
UPDATE public.plans SET nom = 'CM Pro'     WHERE slug = 'solo';
UPDATE public.plans SET nom = 'Studio'     WHERE slug = 'agence_standard';
UPDATE public.plans SET nom = 'Elite'      WHERE slug = 'agence_pro';
