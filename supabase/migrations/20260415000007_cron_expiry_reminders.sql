-- Enable pg_cron extension (requires Supabase Pro or pg_cron add-on)
-- Schedule the expiry-reminders edge function to run daily at 08:00 UTC
SELECT cron.schedule(
  'digal-expiry-reminders',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/expiry-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
