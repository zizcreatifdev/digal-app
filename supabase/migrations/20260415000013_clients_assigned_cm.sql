-- Migration: add assigned_cm column to clients
-- Allows assigning a Community Manager to a client in an agency context
-- CM users see clients where assigned_cm = their auth UID OR they created the client

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS assigned_cm uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS clients_assigned_cm_idx ON public.clients(assigned_cm);

COMMENT ON COLUMN public.clients.assigned_cm IS 'auth.users.id of the CM assigned to this client (agency context)';
