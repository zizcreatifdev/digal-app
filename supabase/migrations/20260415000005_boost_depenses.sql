-- Add boost/publicité fields to depenses
-- client_id: client affecté au boost
-- reseau: réseau publicitaire (facebook_ads, instagram_ads, etc.)
-- inclure_facture: true quand la dépense a déjà été incluse dans une facture

ALTER TABLE public.depenses
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reseau TEXT,
  ADD COLUMN IF NOT EXISTS inclure_facture BOOLEAN NOT NULL DEFAULT FALSE;
