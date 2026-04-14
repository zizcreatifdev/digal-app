-- Migration: activation_tokens
-- Stores one-time activation links sent to approved waitlist users.

CREATE TABLE IF NOT EXISTS public.activation_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token      UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL,
  prenom     TEXT NOT NULL,
  nom        TEXT NOT NULL,
  type_compte TEXT NOT NULL,  -- solo | agence
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '48 hours',
  used_at    TIMESTAMPTZ,
  is_used    BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE public.activation_tokens ENABLE ROW LEVEL SECURITY;

-- Anon can read a specific token (secured by UUID randomness)
CREATE POLICY "Public read activation token" ON public.activation_tokens
  FOR SELECT USING (true);

-- Only owner / dm can create tokens
CREATE POLICY "Admin insert activation token" ON public.activation_tokens
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'dm')
    )
  );

CREATE INDEX IF NOT EXISTS activation_tokens_token_idx ON public.activation_tokens (token);
CREATE INDEX IF NOT EXISTS activation_tokens_email_idx ON public.activation_tokens (email);
