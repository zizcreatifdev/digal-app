
-- Preview links table
CREATE TABLE public.preview_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  slug text NOT NULL UNIQUE,
  periode_debut timestamptz NOT NULL,
  periode_fin timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '48 hours'),
  statut text NOT NULL DEFAULT 'actif'
);

-- Preview actions table
CREATE TABLE public.preview_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  preview_link_id uuid NOT NULL REFERENCES public.preview_links(id) ON DELETE CASCADE,
  post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL,
  decision text NOT NULL,
  commentaire text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for preview_links
ALTER TABLE public.preview_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preview links"
  ON public.preview_links FOR ALL TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Public can read active preview links by slug"
  ON public.preview_links FOR SELECT TO anon
  USING (statut = 'actif');

CREATE POLICY "Admins can read all preview links"
  ON public.preview_links FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS for preview_actions
ALTER TABLE public.preview_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert preview actions"
  ON public.preview_actions FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can read actions on their links"
  ON public.preview_actions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.preview_links
      WHERE preview_links.id = preview_actions.preview_link_id
      AND preview_links.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can read actions on active links"
  ON public.preview_actions FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.preview_links
      WHERE preview_links.id = preview_actions.preview_link_id
      AND preview_links.statut = 'actif'
    )
  );

-- Function to expire old links (called by cron)
CREATE OR REPLACE FUNCTION public.expire_preview_links()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE public.preview_links
  SET statut = 'expire'
  WHERE statut = 'actif' AND expires_at < now();
$$;
