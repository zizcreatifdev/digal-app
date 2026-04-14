-- Drop overly permissive policy
DROP POLICY IF EXISTS "Anon can insert notification via preview" ON public.notifications;

-- More restrictive: anon can only insert notifications for users who own an active preview link
CREATE POLICY "Anon can insert notification via preview"
ON public.notifications FOR INSERT TO anon
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.preview_links
    WHERE preview_links.user_id = notifications.user_id
      AND preview_links.statut IN ('actif', 'termine')
  )
  AND type = 'preview_review'
);