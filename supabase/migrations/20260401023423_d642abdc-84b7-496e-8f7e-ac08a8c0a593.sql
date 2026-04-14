
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reseau text NOT NULL,
  format text NOT NULL,
  date_publication timestamptz NOT NULL,
  texte text,
  hashtags text,
  media_url text,
  statut text NOT NULL DEFAULT 'idee',
  assigne_a uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own client posts"
  ON public.posts FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.clients WHERE clients.id = posts.client_id AND clients.user_id = auth.uid())
  );

CREATE POLICY "Admins can read all posts"
  ON public.posts FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
