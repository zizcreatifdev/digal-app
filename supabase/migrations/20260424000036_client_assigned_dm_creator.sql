ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS assigned_cm UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS assigned_dm UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS assigned_creator UUID REFERENCES auth.users(id);
