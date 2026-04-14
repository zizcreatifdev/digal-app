-- Migration: activation_token_copied
-- Adds message_copied_at column to track manual copy action.
-- Adds UPDATE policy for owner/dm to set message_copied_at.

ALTER TABLE public.activation_tokens
  ADD COLUMN IF NOT EXISTS message_copied_at TIMESTAMPTZ;

-- Allow owner/dm to update activation tokens (e.g., record message_copied_at)
CREATE POLICY "Admin update activation token" ON public.activation_tokens
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'dm')
    )
  );
