-- Add tampon (stamp) and signature URL columns to users table
-- Used in PDF generation for devis/factures

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS tampon_url TEXT,
  ADD COLUMN IF NOT EXISTS signature_url TEXT;
