INSERT INTO public.site_settings (key, value) VALUES
('launch_limit_cm_pro', '100'),
('launch_limit_studio', '100'),
('show_launch_counters', 'true')
ON CONFLICT (key) DO NOTHING;
