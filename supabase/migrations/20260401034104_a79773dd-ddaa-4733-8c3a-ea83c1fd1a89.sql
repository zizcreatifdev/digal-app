ALTER TABLE public.users DROP CONSTRAINT users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('freemium', 'solo', 'agence_standard', 'agence_pro', 'owner'));