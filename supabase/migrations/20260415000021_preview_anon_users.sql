-- Migration: allow anonymous users to read basic CM profile info
-- when there is an active preview link issued by that user.
-- Without this policy, the preview header shows generic fallback text
-- instead of the CM/agence name and logo.

CREATE POLICY "Anon can read cm info via active preview link"
ON public.users
FOR SELECT TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.preview_links
    WHERE preview_links.user_id = users.user_id
      AND preview_links.statut = 'actif'
      AND preview_links.expires_at > now()
  )
);
