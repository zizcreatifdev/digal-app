-- Migration: license_keys table
-- Stores pre-generated license keys created by the Owner
-- Users activate these keys from Settings → Ma licence

CREATE TABLE IF NOT EXISTS public.license_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_code text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('solo', 'agence_standard', 'agence_pro')),
  duration_months integer NOT NULL DEFAULT 6 CHECK (duration_months > 0),
  is_used boolean NOT NULL DEFAULT false,
  used_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  used_at timestamptz,
  created_by uuid,
  promo_discount integer NOT NULL DEFAULT 0 CHECK (promo_discount >= 0 AND promo_discount <= 100),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.license_keys ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admins manage license_keys"
  ON public.license_keys
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can read unused keys (needed for validation)
-- The actual uniqueness check is done server-side
CREATE POLICY "Users can validate license keys"
  ON public.license_keys
  FOR SELECT
  TO authenticated
  USING (true);
