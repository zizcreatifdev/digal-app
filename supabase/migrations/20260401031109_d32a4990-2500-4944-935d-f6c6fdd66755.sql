
CREATE TABLE public.security_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text,
  action text NOT NULL,
  ip_address text,
  user_agent text,
  success boolean NOT NULL DEFAULT false,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read all security logs"
  ON public.security_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can insert security logs"
  ON public.security_logs FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE INDEX idx_security_logs_created ON public.security_logs(created_at DESC);
CREATE INDEX idx_security_logs_email ON public.security_logs(email);

-- Storage bucket for user uploads (profile photos, logos, stamps, signatures)
INSERT INTO storage.buckets (id, name, public) VALUES ('user-uploads', 'user-uploads', true);

CREATE POLICY "Authenticated users can upload to user-uploads"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'user-uploads');

CREATE POLICY "Users can update own uploads"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'user-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public can read user-uploads"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'user-uploads');

-- Add avatar_url and stamp/signature fields to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS agence_nom text;
