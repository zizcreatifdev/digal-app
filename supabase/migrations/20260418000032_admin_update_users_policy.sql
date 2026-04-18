-- prompt-54 fix : politique RLS manquante pour UPDATE sur public.users par les admins
-- Sans cette policy, suspendAccount et deleteAccount retournent 0 rows sans erreur

CREATE POLICY "Admins can update any user"
ON public.users FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
);
