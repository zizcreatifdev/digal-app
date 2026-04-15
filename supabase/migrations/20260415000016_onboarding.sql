-- Migration: onboarding progress tracking columns
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_badges TEXT[] DEFAULT '{}';
