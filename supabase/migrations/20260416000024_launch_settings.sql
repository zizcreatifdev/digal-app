-- Paramètres countdown de lancement
INSERT INTO public.site_settings (key, value)
VALUES ('launch_date', '2026-05-01T00:00:00Z')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.site_settings (key, value)
VALUES ('show_countdown', 'true')
ON CONFLICT (key) DO NOTHING;
