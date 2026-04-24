-- Allow dm/owner to cancel (delete) activation tokens for their agency
CREATE POLICY "DM delete activation token" ON public.activation_tokens
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'dm')
    )
  );

-- Allow dm/owner to delete team members from their agency
CREATE POLICY "DM remove team member" ON public.users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.user_id = auth.uid()
        AND u.role IN ('owner', 'dm')
        AND u.agence_id = users.agence_id
    )
  );
