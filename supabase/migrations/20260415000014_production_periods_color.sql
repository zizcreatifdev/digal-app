-- Migration: add color field to production_periods for custom type
-- Allows free color choice when type = 'custom'

ALTER TABLE public.production_periods
  ADD COLUMN IF NOT EXISTS color text;

COMMENT ON COLUMN public.production_periods.color IS 'Hex color for custom period type (e.g. #8B5CF6)';
