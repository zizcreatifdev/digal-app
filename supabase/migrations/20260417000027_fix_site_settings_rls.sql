-- Fix RLS on site_settings: the created_by column is NULL for system-inserted rows,
-- making the previous policies (USING auth.uid() = created_by) always false.
-- Replace with admin-only policies that don't rely on created_by.

DROP POLICY IF EXISTS "Authenticated users can insert settings" ON public.site_settings;
DROP POLICY IF EXISTS "Creators can update their settings"      ON public.site_settings;

-- Admins can insert, update and delete any setting
CREATE POLICY "Admin can manage site_settings"
  ON public.site_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
