-- Allow admins to manage all posts (insert, update, delete)
CREATE POLICY "Admins can manage all posts"
ON public.posts
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to manage all clients (insert, update, delete)
CREATE POLICY "Admins can manage all clients"
ON public.clients
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));