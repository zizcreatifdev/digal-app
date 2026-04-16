-- Add remise (discount) fields to documents table
-- Used for licence invoices with multi-month duration discounts

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS remise_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS montant_remise NUMERIC(15,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.documents.remise_pct IS 'Discount percentage applied to the invoice (display only, e.g. 12 for 12%)';
COMMENT ON COLUMN public.documents.montant_remise IS 'Discount amount in FCFA (montant_mensuel * duree - prix_facture)';
