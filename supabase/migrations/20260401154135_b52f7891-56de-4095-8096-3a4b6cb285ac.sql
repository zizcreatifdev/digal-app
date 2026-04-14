-- Add secondary color column
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS couleur_secondaire text DEFAULT '#1A1A1A';

-- Fix the preview link policy: should only apply to anon role, not authenticated users
DROP POLICY IF EXISTS "Anon can read client via active preview link" ON public.clients;

CREATE POLICY "Anon can read client via active preview link"
ON public.clients
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM preview_links
    WHERE preview_links.client_id = clients.id
    AND preview_links.statut = 'actif'
    AND preview_links.expires_at > now()
  )
);