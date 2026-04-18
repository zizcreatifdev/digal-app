-- Migration: referral extra columns
-- Adds missing columns needed for full referral business logic

-- 1. Extra columns on users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS referral_months_earned INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_months_used INTEGER NOT NULL DEFAULT 0;

-- 2. auto_approve_at on referral_quota_requests
ALTER TABLE public.referral_quota_requests
  ADD COLUMN IF NOT EXISTS auto_approve_at TIMESTAMPTZ;

-- Default: 1 hour after creation for any existing pending requests
UPDATE public.referral_quota_requests
SET auto_approve_at = created_at + INTERVAL '1 hour'
WHERE auto_approve_at IS NULL AND status = 'pending';

-- 3. Extra columns on referrals for qualification tracking
ALTER TABLE public.referrals
  ADD COLUMN IF NOT EXISTS plan_referee TEXT,
  ADD COLUMN IF NOT EXISTS qualified_at TIMESTAMPTZ;

-- 4. Extend status check to include 'qualified'
ALTER TABLE public.referrals DROP CONSTRAINT IF EXISTS referrals_status_check;
ALTER TABLE public.referrals
  ADD CONSTRAINT referrals_status_check
  CHECK (status IN ('pending', 'qualified', 'validated', 'rewarded'));

-- 5. Referral tiers site_setting
INSERT INTO public.site_settings (key, value, description)
VALUES (
  'referral_tiers',
  '{"3": 1, "5": 2, "10": 3}',
  'Paliers parrainage : {nb_filleuls_payes: mois_offerts}'
)
ON CONFLICT (key) DO NOTHING;
