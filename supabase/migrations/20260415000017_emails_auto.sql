-- Migration: automatic email triggers support

-- 1. Add expiry_notified column to preview_links
--    Tracks whether a "no response" expiry notification was sent to the CM/DM
ALTER TABLE public.preview_links
  ADD COLUMN IF NOT EXISTS expiry_notified BOOLEAN DEFAULT false;

-- 2. Add relance_sent column to users
--    Prevents re-sending the freemium inactivity relance email
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS relance_sent BOOLEAN DEFAULT false;

-- 3. RPC: get inactive freemium users for relance email
--    Returns users on freemium plan whose last login was > 30 days ago
--    and who haven't been relanced yet.
--    SECURITY DEFINER allows access to auth.users from public functions.
CREATE OR REPLACE FUNCTION public.get_inactive_freemium_users()
RETURNS TABLE(user_email text, user_prenom text, user_uid uuid)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT u.email, u.prenom, u.user_id
  FROM public.users u
  JOIN auth.users au ON au.id = u.user_id
  WHERE (u.plan = 'freemium' OR u.role = 'freemium')
    AND au.last_sign_in_at < NOW() - INTERVAL '30 days'
    AND (u.relance_sent IS NULL OR u.relance_sent = false)
    AND u.email IS NOT NULL;
$$;

GRANT EXECUTE ON FUNCTION public.get_inactive_freemium_users() TO service_role;

-- 4. Update cron to 09:00 UTC (replaces the 08:00 schedule from migration 000007)
--    Unschedule existing job first (safe: no-op if it doesn't exist)
DO $$
BEGIN
  PERFORM cron.unschedule(jobid)
  FROM cron.job
  WHERE jobname = 'digal-expiry-reminders';
EXCEPTION WHEN OTHERS THEN
  -- pg_cron might not be enabled; skip silently
  NULL;
END $$;

SELECT cron.schedule(
  'digal-expiry-reminders',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/expiry-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
