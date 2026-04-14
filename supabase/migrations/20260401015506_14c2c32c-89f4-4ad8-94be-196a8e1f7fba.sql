
-- Drop overly permissive policies
DROP POLICY "Authenticated users can insert settings" ON public.site_settings;
DROP POLICY "Authenticated users can update settings" ON public.site_settings;

-- Add created_by column for ownership tracking
ALTER TABLE public.site_settings ADD COLUMN created_by UUID REFERENCES auth.users(id);

-- Tighter insert policy
CREATE POLICY "Authenticated users can insert settings"
  ON public.site_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Tighter update policy
CREATE POLICY "Creators can update their settings"
  ON public.site_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);
