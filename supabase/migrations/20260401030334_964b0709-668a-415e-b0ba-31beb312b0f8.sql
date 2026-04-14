
CREATE TABLE public.post_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  titre text NOT NULL,
  texte text,
  reseau text NOT NULL,
  format text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.post_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own templates"
  ON public.post_templates FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all templates"
  ON public.post_templates FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_post_templates_updated_at
  BEFORE UPDATE ON public.post_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
