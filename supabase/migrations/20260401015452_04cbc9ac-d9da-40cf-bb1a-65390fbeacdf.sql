
-- Create site_settings table for configurable values
CREATE TABLE public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (public landing page needs countdown)
CREATE POLICY "Settings are publicly readable"
  ON public.site_settings FOR SELECT
  USING (true);

-- Only authenticated users can insert/update (admin)
CREATE POLICY "Authenticated users can insert settings"
  ON public.site_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update settings"
  ON public.site_settings FOR UPDATE
  TO authenticated
  USING (true);

-- Insert default launch date (30 days from now)
INSERT INTO public.site_settings (key, value)
VALUES ('launch_date', (now() + interval '30 days')::text);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
