
CREATE POLICY "Admins can read waitlist"
  ON public.waitlist FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update waitlist"
  ON public.waitlist FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete waitlist"
  ON public.waitlist FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
