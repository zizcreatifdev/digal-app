-- Add licence metadata columns to owner_payments
ALTER TABLE public.owner_payments
  ADD COLUMN IF NOT EXISTS duree_mois integer,
  ADD COLUMN IF NOT EXISTS licence_key text,
  ADD COLUMN IF NOT EXISTS reference text,
  ADD COLUMN IF NOT EXISTS description text;
