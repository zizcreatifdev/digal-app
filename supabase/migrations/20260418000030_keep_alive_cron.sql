-- prompt-53 : cron keep-alive toutes les 48h pour garder le projet Supabase actif
-- Requiert les extensions pg_cron et pg_net activées sur le projet Supabase
-- app.supabase_url et app.supabase_anon_key doivent être configurés via :
--   ALTER DATABASE postgres SET "app.supabase_url" = 'https://xxx.supabase.co';
--   ALTER DATABASE postgres SET "app.supabase_anon_key" = 'eyJ...';

SELECT cron.schedule(
  'keep-alive-every-48h',
  '0 9 */2 * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/keep-alive',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  )
  $$
);
