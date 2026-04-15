-- Migration: admin_account_actions
-- 1. Allow documents to be created without a client_id (for facture_licence type)
-- 2. Add statut column to users for account suspension

ALTER TABLE public.documents ALTER COLUMN client_id DROP NOT NULL;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS statut TEXT DEFAULT 'actif';

-- Update existing rows to have 'actif' status
UPDATE public.users SET statut = 'actif' WHERE statut IS NULL;
