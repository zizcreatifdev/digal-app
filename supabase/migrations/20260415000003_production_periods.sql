-- Migration: production_periods table
-- Stores multi-day production blocks on the editorial calendar
-- Types: shooting, montage, livraison, custom

CREATE TABLE IF NOT EXISTS public.production_periods (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id   uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN ('shooting', 'montage', 'livraison', 'custom')),
  titre       text NOT NULL,
  description text,
  date_debut  date NOT NULL,
  date_fin    date NOT NULL CHECK (date_fin >= date_debut),
  assigne_a   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.production_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own production_periods"
  ON public.production_periods FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
