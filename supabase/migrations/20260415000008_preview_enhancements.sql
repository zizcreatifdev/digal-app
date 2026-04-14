-- Add human-readable slug to clients (modifiable by DM)
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS preview_slug TEXT;

-- Add welcome_message to preview_links (customizable per link)
ALTER TABLE public.preview_links
  ADD COLUMN IF NOT EXISTS welcome_message TEXT;
