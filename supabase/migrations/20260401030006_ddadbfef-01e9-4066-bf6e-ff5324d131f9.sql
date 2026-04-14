
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  type_action text NOT NULL DEFAULT 'autre',
  detail text,
  metadata jsonb DEFAULT '{}',
  entity_type text,
  entity_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own logs"
  ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own logs"
  ON public.activity_logs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all logs"
  ON public.activity_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_activity_logs_user_created ON public.activity_logs(user_id, created_at DESC);
CREATE INDEX idx_activity_logs_type ON public.activity_logs(type_action);
