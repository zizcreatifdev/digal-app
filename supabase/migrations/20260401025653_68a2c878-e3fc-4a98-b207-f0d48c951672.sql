
CREATE TABLE public.kpi_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  mois text NOT NULL, -- 'YYYY-MM'
  metriques jsonb NOT NULL DEFAULT '{}',
  points_forts text,
  axes_amelioration text,
  objectifs text,
  pdf_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, mois)
);

ALTER TABLE public.kpi_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own kpi_reports"
  ON public.kpi_reports FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all kpi_reports"
  ON public.kpi_reports FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_kpi_reports_updated_at
  BEFORE UPDATE ON public.kpi_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
