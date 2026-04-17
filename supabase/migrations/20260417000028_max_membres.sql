-- Prompt 52: Membres configurables par plan
-- Add max_membres column to plans table
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS max_membres INTEGER DEFAULT NULL;

-- Set default values per plan
UPDATE public.plans SET max_membres = 1 WHERE slug = 'freemium';
UPDATE public.plans SET max_membres = 1 WHERE slug = 'solo';
UPDATE public.plans SET max_membres = 4 WHERE slug = 'agence_standard';
UPDATE public.plans SET max_membres = 8 WHERE slug = 'agence_pro';

-- Add nb_cm and nb_createurs columns to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS nb_cm INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nb_createurs INTEGER DEFAULT 0;
