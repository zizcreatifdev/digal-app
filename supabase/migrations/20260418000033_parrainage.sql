-- Migration: parrainage
-- Adds referral system: referral codes, referrals table, quota requests table

-- 1. Add referral columns to users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referral_quota INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS referral_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.users(user_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referral_reward_claimed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS referral_reward_type TEXT,
  ADD COLUMN IF NOT EXISTS referral_reward_claimed_at TIMESTAMPTZ;

-- 2. Generate referral codes for existing users who don't have one
UPDATE public.users
SET referral_code = 'DIG' || UPPER(SUBSTRING(MD5(user_id::TEXT || RANDOM()::TEXT) FROM 1 FOR 6))
WHERE referral_code IS NULL;

-- 3. Create referrals table
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'rewarded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  validated_at TIMESTAMPTZ,
  UNIQUE(referred_id)
);

-- 4. RLS for referrals
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referrals_select_own" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "referrals_insert_own" ON public.referrals
  FOR INSERT WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "referrals_admin_all" ON public.referrals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE user_id = auth.uid() AND role IN ('owner', 'dm')
    )
  );

-- 5. Create referral_quota_requests table
CREATE TABLE IF NOT EXISTS public.referral_quota_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  requested_quota INTEGER NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.users(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- 6. RLS for referral_quota_requests
ALTER TABLE public.referral_quota_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quota_requests_select_own" ON public.referral_quota_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "quota_requests_insert_own" ON public.referral_quota_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "quota_requests_admin_all" ON public.referral_quota_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE user_id = auth.uid() AND role IN ('owner', 'dm')
    )
  );

-- 7. Site settings for referral system
INSERT INTO public.site_settings (key, value, description)
VALUES
  ('referral_enabled', 'true', 'Active ou désactive le système de parrainage'),
  ('referral_default_quota', '3', 'Nombre de parrainages autorisés par défaut'),
  ('referral_reward_type', 'month_free', 'Type de récompense pour le parrain (month_free, discount_10, etc.)'),
  ('referral_reward_threshold', '3', 'Nombre de parrainages validés pour déclencher la récompense')
ON CONFLICT (key) DO NOTHING;
