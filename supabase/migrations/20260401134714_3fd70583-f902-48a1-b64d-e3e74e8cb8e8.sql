-- Allow anon to update preview_links status to 'termine'
CREATE POLICY "Anon can mark preview link as termine"
ON public.preview_links FOR UPDATE TO anon
USING (statut = 'actif' AND expires_at > now())
WITH CHECK (statut = 'termine');

-- Allow anon to insert notifications (for notifying CM)
CREATE POLICY "Anon can insert notification via preview"
ON public.notifications FOR INSERT TO anon
WITH CHECK (true);

-- Allow anon to read preview_links by slug
CREATE POLICY "Anon can read active preview links"
ON public.preview_links FOR SELECT TO anon
USING (true);