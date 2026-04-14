-- Allow anonymous users to read posts that belong to a client with an active preview link
CREATE POLICY "Anon can read posts via active preview link"
ON public.posts FOR SELECT TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.preview_links
    WHERE preview_links.client_id = posts.client_id
      AND preview_links.statut = 'actif'
      AND preview_links.expires_at > now()
  )
);

-- Allow anonymous users to read client info when there's an active preview link
CREATE POLICY "Anon can read client via active preview link"
ON public.clients FOR SELECT TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.preview_links
    WHERE preview_links.client_id = clients.id
      AND preview_links.statut = 'actif'
      AND preview_links.expires_at > now()
  )
);

-- Allow anonymous users to update post status via preview actions
CREATE POLICY "Anon can update post status via active preview link"
ON public.posts FOR UPDATE TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.preview_links
    WHERE preview_links.client_id = posts.client_id
      AND preview_links.statut = 'actif'
      AND preview_links.expires_at > now()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.preview_links
    WHERE preview_links.client_id = posts.client_id
      AND preview_links.statut = 'actif'
      AND preview_links.expires_at > now()
  )
);