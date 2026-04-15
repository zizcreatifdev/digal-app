-- Migration: team_invite
-- Adds agence_id to activation_tokens so team invitations can be associated
-- with the inviting agency, allowing activate-account to set the correct role/agence.

ALTER TABLE public.activation_tokens
  ADD COLUMN IF NOT EXISTS agence_id TEXT;
