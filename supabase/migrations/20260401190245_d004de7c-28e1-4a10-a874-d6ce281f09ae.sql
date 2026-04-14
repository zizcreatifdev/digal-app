CREATE POLICY "Admins can delete users"
ON public.users
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));