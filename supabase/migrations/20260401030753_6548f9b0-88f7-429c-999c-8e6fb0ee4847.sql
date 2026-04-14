
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Function to delete media of rejected posts (called on status change)
CREATE OR REPLACE FUNCTION public.cleanup_rejected_post_media()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.statut = 'refuse' AND OLD.statut != 'refuse' AND NEW.media_url IS NOT NULL THEN
    -- Clear the media_url (actual storage cleanup via edge function)
    NEW.media_url = NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_cleanup_rejected_media
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION cleanup_rejected_post_media();
