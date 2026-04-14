-- ============================================================
-- Digal — Migration complète vers nouveau Supabase
-- Généré le : 2026-04-14T18:58:17Z
-- Projet cible : quvtfhwcwxijizsiqzpd
-- Nombre de migrations : 39
-- ============================================================


-- ============================================================
-- MIGRATION : 20260401015452_04cbc9ac-d9da-40cf-bb1a-65390fbeacdf.sql
-- ============================================================

-- Create site_settings table for configurable values
CREATE TABLE public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (public landing page needs countdown)
CREATE POLICY "Settings are publicly readable"
  ON public.site_settings FOR SELECT
  USING (true);

-- Only authenticated users can insert/update (admin)
CREATE POLICY "Authenticated users can insert settings"
  ON public.site_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update settings"
  ON public.site_settings FOR UPDATE
  TO authenticated
  USING (true);

-- Insert default launch date (30 days from now)
INSERT INTO public.site_settings (key, value)
VALUES ('launch_date', (now() + interval '30 days')::text);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- MIGRATION : 20260401015506_14c2c32c-89f4-4ad8-94be-196a8e1f7fba.sql
-- ============================================================

-- Drop overly permissive policies
DROP POLICY "Authenticated users can insert settings" ON public.site_settings;
DROP POLICY "Authenticated users can update settings" ON public.site_settings;

-- Add created_by column for ownership tracking
ALTER TABLE public.site_settings ADD COLUMN created_by UUID REFERENCES auth.users(id);

-- Tighter insert policy
CREATE POLICY "Authenticated users can insert settings"
  ON public.site_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Tighter update policy
CREATE POLICY "Creators can update their settings"
  ON public.site_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);


-- ============================================================
-- MIGRATION : 20260401015957_ab3a5c72-2552-4954-bc42-55cf14df32e1.sql
-- ============================================================

CREATE TABLE public.waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (landing page visitors)
CREATE POLICY "Anyone can join waitlist"
  ON public.waitlist FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- No one can read the waitlist publicly
CREATE POLICY "No public read on waitlist"
  ON public.waitlist FOR SELECT
  TO authenticated
  USING (false);


-- ============================================================
-- MIGRATION : 20260401020349_3a1ac8da-9ec8-4152-b31e-a4264c82b264.sql
-- ============================================================

-- Update waitlist table
ALTER TABLE public.waitlist
  ADD COLUMN prenom TEXT,
  ADD COLUMN nom TEXT,
  ADD COLUMN type_compte TEXT DEFAULT 'solo' CHECK (type_compte IN ('solo', 'agence')),
  ADD COLUMN statut TEXT DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'approuve', 'refuse'));

-- Create app_role enum for user_roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS: users can read their own roles
CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS: only admins can manage roles
CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create users (profiles) table
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL,
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'freemium' CHECK (role IN ('freemium', 'solo', 'agence_standard', 'agence_pro')),
  plan TEXT,
  licence_expiration TIMESTAMP WITH TIME ZONE,
  agence_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.users FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Authenticated users can insert their own profile (on registration)
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
  ON public.users FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- MIGRATION : 20260401023117_ec1f02a6-b4de-429e-9765-687805917d71.sql
-- ============================================================

-- Clients table
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nom text NOT NULL,
  logo_url text,
  couleur_marque text DEFAULT '#C4522A',
  contact_nom text,
  contact_email text,
  contact_telephone text,
  facturation_adresse text,
  facturation_mode text DEFAULT 'wave',
  statut text NOT NULL DEFAULT 'actif',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Client networks table
CREATE TABLE public.client_networks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  reseau text NOT NULL,
  formats text[] DEFAULT '{}',
  frequence_posts integer DEFAULT 3,
  notes_editoriales text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Updated_at trigger for clients
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS on clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own clients"
  ON public.clients FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients"
  ON public.clients FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients"
  ON public.clients FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all clients"
  ON public.clients FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS on client_networks
ALTER TABLE public.client_networks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own client networks"
  ON public.client_networks FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.clients WHERE clients.id = client_networks.client_id AND clients.user_id = auth.uid())
  );

CREATE POLICY "Admins can read all client networks"
  ON public.client_networks FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));


-- ============================================================
-- MIGRATION : 20260401023423_d642abdc-84b7-496e-8f7e-ac08a8c0a593.sql
-- ============================================================

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


-- ============================================================
-- MIGRATION : 20260401023441_31714f56-4cfa-48e4-8772-7b8c3b13497b.sql
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('post-media', 'post-media', true);

CREATE POLICY "Authenticated users can upload post media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'post-media');

CREATE POLICY "Anyone can read post media"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'post-media');

CREATE POLICY "Users can delete own post media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'post-media' AND (storage.foldername(name))[1] = auth.uid()::text);


-- ============================================================
-- MIGRATION : 20260401023810_d6775196-77fe-4037-93c6-c52bfa01a757.sql
-- ============================================================

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


-- ============================================================
-- MIGRATION : 20260401023826_6c13cbf7-1be4-4ae4-86bc-18757e5a0f45.sql
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;


-- ============================================================
-- MIGRATION : 20260401024153_7214a547-fe0e-436c-b8ed-110c13d6853b.sql
-- ============================================================

-- Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  titre text NOT NULL,
  message text,
  type text NOT NULL DEFAULT 'info',
  lien text,
  lu boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true);

-- Add review_comment to posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS review_comment text;

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;


-- ============================================================
-- MIGRATION : 20260401024841_4cd16004-c966-4cfe-b993-65f2304edb3a.sql
-- ============================================================

-- Documents table (devis & factures)
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  type text NOT NULL DEFAULT 'devis', -- 'devis' or 'facture'
  numero text NOT NULL,
  statut text NOT NULL DEFAULT 'brouillon', -- brouillon, envoye, paye, partiellement_paye, en_retard, annule, archive
  date_emission date NOT NULL DEFAULT CURRENT_DATE,
  date_echeance date,
  sous_total integer NOT NULL DEFAULT 0, -- in FCFA (integer)
  taux_brs numeric(5,2) NOT NULL DEFAULT 5.00,
  montant_brs integer NOT NULL DEFAULT 0,
  taux_tva numeric(5,2) NOT NULL DEFAULT 0,
  montant_tva integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  methodes_paiement text[] DEFAULT '{}',
  notes text,
  converted_from_id uuid REFERENCES public.documents(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Document lines
CREATE TABLE public.document_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  description text NOT NULL DEFAULT '',
  quantite integer NOT NULL DEFAULT 1,
  prix_unitaire integer NOT NULL DEFAULT 0,
  brs_applicable boolean NOT NULL DEFAULT true,
  montant integer NOT NULL DEFAULT 0,
  ordre integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Payments
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  montant integer NOT NULL DEFAULT 0,
  date_paiement date NOT NULL DEFAULT CURRENT_DATE,
  methode text NOT NULL DEFAULT 'wave',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Documents policies
CREATE POLICY "Users can manage own documents"
  ON public.documents FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all documents"
  ON public.documents FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Document lines policies (via document ownership)
CREATE POLICY "Users can manage own document lines"
  ON public.document_lines FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.documents WHERE documents.id = document_lines.document_id AND documents.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.documents WHERE documents.id = document_lines.document_id AND documents.user_id = auth.uid()));

-- Payments policies (via document ownership)
CREATE POLICY "Users can manage own payments"
  ON public.payments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.documents WHERE documents.id = payments.document_id AND documents.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.documents WHERE documents.id = payments.document_id AND documents.user_id = auth.uid()));

-- Updated_at trigger
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- MIGRATION : 20260401025344_c1413efa-baec-42b2-b501-17971f746c89.sql
-- ============================================================

-- Expenses table
CREATE TABLE public.depenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  libelle text NOT NULL,
  montant integer NOT NULL DEFAULT 0,
  categorie text NOT NULL DEFAULT 'autre',
  date_depense date NOT NULL DEFAULT CURRENT_DATE,
  piece_jointe_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Salaries table
CREATE TABLE public.salaires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  membre_nom text NOT NULL,
  salaire_mensuel integer NOT NULL DEFAULT 0,
  mois text NOT NULL, -- format: 'YYYY-MM'
  statut_paiement text NOT NULL DEFAULT 'non_paye',
  date_paiement date,
  methode_paiement text,
  inclure_facture boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.depenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salaires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own depenses"
  ON public.depenses FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all depenses"
  ON public.depenses FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can manage own salaires"
  ON public.salaires FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all salaires"
  ON public.salaires FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Updated_at triggers
CREATE TRIGGER update_depenses_updated_at
  BEFORE UPDATE ON public.depenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_salaires_updated_at
  BEFORE UPDATE ON public.salaires
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- MIGRATION : 20260401025653_68a2c878-e3fc-4a98-b207-f0d48c951672.sql
-- ============================================================

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


-- ============================================================
-- MIGRATION : 20260401030006_ddadbfef-01e9-4066-bf6e-ff5324d131f9.sql
-- ============================================================

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


-- ============================================================
-- MIGRATION : 20260401030334_964b0709-668a-415e-b0ba-31beb312b0f8.sql
-- ============================================================

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


-- ============================================================
-- MIGRATION : 20260401030753_6548f9b0-88f7-429c-999c-8e6fb0ee4847.sql
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Function to delete media of rejected posts (called on status change)
CREATE OR REPLACE FUNCTION public.cleanup_rejected_post_media()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.statut = 'refuse' AND OLD.statut != 'refuse' AND NEW.media_url IS NOT NULL THEN
    -- Clear the media_url (actual storage cleanup via edge function)
    NEW.media_url = NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_cleanup_rejected_media
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION cleanup_rejected_post_media();


-- ============================================================
-- MIGRATION : 20260401030758_a27d1e43-3301-4116-8439-a5dec2dc0f29.sql
-- ============================================================

CREATE TABLE public.changelog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL,
  titre text NOT NULL,
  description text NOT NULL,
  type_version text NOT NULL DEFAULT 'patch',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.changelog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read changelog"
  ON public.changelog FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage changelog"
  ON public.changelog FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_changelog_created ON public.changelog(created_at DESC);


-- ============================================================
-- MIGRATION : 20260401031109_d32a4990-2500-4944-935d-f6c6fdd66755.sql
-- ============================================================

CREATE TABLE public.security_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text,
  action text NOT NULL,
  ip_address text,
  user_agent text,
  success boolean NOT NULL DEFAULT false,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read all security logs"
  ON public.security_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can insert security logs"
  ON public.security_logs FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE INDEX idx_security_logs_created ON public.security_logs(created_at DESC);
CREATE INDEX idx_security_logs_email ON public.security_logs(email);

-- Storage bucket for user uploads (profile photos, logos, stamps, signatures)
INSERT INTO storage.buckets (id, name, public) VALUES ('user-uploads', 'user-uploads', true);

CREATE POLICY "Authenticated users can upload to user-uploads"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'user-uploads');

CREATE POLICY "Users can update own uploads"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'user-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public can read user-uploads"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'user-uploads');

-- Add avatar_url and stamp/signature fields to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS agence_nom text;


-- ============================================================
-- MIGRATION : 20260401031426_8f5fd023-ff39-43b7-b3a0-794882d47be9.sql
-- ============================================================

CREATE POLICY "Admins can read waitlist"
  ON public.waitlist FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update waitlist"
  ON public.waitlist FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete waitlist"
  ON public.waitlist FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));


-- ============================================================
-- MIGRATION : 20260401032809_30e487e6-ce93-43a1-9df0-20581c70ee1b.sql
-- ============================================================

-- Marketing emails table
CREATE TABLE public.marketing_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  objet text NOT NULL,
  corps text NOT NULL DEFAULT '',
  destinataires text NOT NULL DEFAULT 'tous',
  date_envoi timestamp with time zone,
  statut text NOT NULL DEFAULT 'brouillon',
  nb_destinataires integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage marketing emails" ON public.marketing_emails
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Owner payments table
CREATE TABLE public.owner_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  compte_nom text NOT NULL,
  compte_email text,
  plan text NOT NULL DEFAULT 'solo_standard',
  montant integer NOT NULL DEFAULT 0,
  methode text NOT NULL DEFAULT 'wave',
  date_paiement date NOT NULL DEFAULT CURRENT_DATE,
  statut text NOT NULL DEFAULT 'paye',
  user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.owner_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage owner payments" ON public.owner_payments
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));


-- ============================================================
-- MIGRATION : 20260401034104_a79773dd-ddaa-4733-8c3a-ea83c1fd1a89.sql
-- ============================================================
ALTER TABLE public.users DROP CONSTRAINT users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('freemium', 'solo', 'agence_standard', 'agence_pro', 'owner'));

-- ============================================================
-- MIGRATION : 20260401104441_992984b4-1984-43cf-9ff5-92b012ee5941.sql
-- ============================================================
ALTER TABLE public.users DROP CONSTRAINT users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('freemium', 'solo', 'solo_standard', 'solo_pro', 'agence_standard', 'agence_starter', 'agence_pro', 'owner', 'dm', 'cm', 'createur'));

-- ============================================================
-- MIGRATION : 20260401124217_8386d33d-af0d-4abc-af66-bb8e0fe98f1a.sql
-- ============================================================

CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  nom text NOT NULL,
  prix_mensuel integer NOT NULL DEFAULT 0,
  prix_semestriel integer DEFAULT NULL,
  promo_active boolean NOT NULL DEFAULT false,
  promo_label text DEFAULT NULL,
  promo_prix_mensuel integer DEFAULT NULL,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  ordre integer NOT NULL DEFAULT 0,
  actif boolean NOT NULL DEFAULT true,
  highlighted boolean NOT NULL DEFAULT false,
  badge text DEFAULT NULL,
  cta_text text NOT NULL DEFAULT 'Rejoindre la liste',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active plans" ON public.plans
  FOR SELECT TO anon, authenticated
  USING (actif = true);

CREATE POLICY "Admins can manage plans" ON public.plans
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed default plans
INSERT INTO public.plans (slug, nom, prix_mensuel, prix_semestriel, features, ordre, highlighted, badge, cta_text) VALUES
  ('freemium', 'Freemium', 0, NULL, '["2 clients actifs","Calendrier éditorial","Lien de validation (filigrane)"]', 0, false, NULL, 'Commencer gratuitement'),
  ('solo_standard', 'Solo Standard', 15000, 75000, '["Clients illimités","Calendrier éditorial","Lien validation sans filigrane","Facturation FCFA","Comptabilité intégrée","Rapports KPI PDF"]', 1, true, 'Le plus choisi', 'Rejoindre la liste'),
  ('agence_standard', 'Agence Standard', 35000, 175000, '["1 DM + 3 membres","Tout Solo Standard inclus","Workflow créateur","Journal d''équipe"]', 2, false, NULL, 'Rejoindre la liste'),
  ('agence_pro', 'Agence Pro', 55000, 275000, '["1 DM + 7 membres","Tout Agence Standard inclus","Support prioritaire","Upgrade sur demande"]', 3, false, NULL, 'Rejoindre la liste');


-- ============================================================
-- MIGRATION : 20260401132822_fe96a899-c1bf-4076-8860-690aa21ce6ba.sql
-- ============================================================
-- Allow anonymous users to read posts that belong to a client with an active preview link
CREATE POLICY "Anon can read posts via active preview link"
ON public.posts FOR SELECT TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.preview_links
    WHERE preview_links.client_id = posts.client_id
      AND preview_links.statut = 'actif'
      AND preview_links.expires_at > now()
  )
);

-- Allow anonymous users to read client info when there's an active preview link
CREATE POLICY "Anon can read client via active preview link"
ON public.clients FOR SELECT TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.preview_links
    WHERE preview_links.client_id = clients.id
      AND preview_links.statut = 'actif'
      AND preview_links.expires_at > now()
  )
);

-- Allow anonymous users to update post status via preview actions
CREATE POLICY "Anon can update post status via active preview link"
ON public.posts FOR UPDATE TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.preview_links
    WHERE preview_links.client_id = posts.client_id
      AND preview_links.statut = 'actif'
      AND preview_links.expires_at > now()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.preview_links
    WHERE preview_links.client_id = posts.client_id
      AND preview_links.statut = 'actif'
      AND preview_links.expires_at > now()
  )
);

-- ============================================================
-- MIGRATION : 20260401134714_3fd70583-f902-48a1-b64d-e3e74e8cb8e8.sql
-- ============================================================
-- Allow anon to update preview_links status to 'termine'
CREATE POLICY "Anon can mark preview link as termine"
ON public.preview_links FOR UPDATE TO anon
USING (statut = 'actif' AND expires_at > now())
WITH CHECK (statut = 'termine');

-- Allow anon to insert notifications (for notifying CM)
CREATE POLICY "Anon can insert notification via preview"
ON public.notifications FOR INSERT TO anon
WITH CHECK (true);

-- Allow anon to read preview_links by slug
CREATE POLICY "Anon can read active preview links"
ON public.preview_links FOR SELECT TO anon
USING (true);

-- ============================================================
-- MIGRATION : 20260401134728_47e56f0a-ee85-468d-aedd-483b4ddab1e5.sql
-- ============================================================
-- Drop overly permissive policy
DROP POLICY IF EXISTS "Anon can insert notification via preview" ON public.notifications;

-- More restrictive: anon can only insert notifications for users who own an active preview link
CREATE POLICY "Anon can insert notification via preview"
ON public.notifications FOR INSERT TO anon
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.preview_links
    WHERE preview_links.user_id = notifications.user_id
      AND preview_links.statut IN ('actif', 'termine')
  )
  AND type = 'preview_review'
);

-- ============================================================
-- MIGRATION : 20260401145426_19dbc67d-2d7f-4165-ad24-4657716c9bb0.sql
-- ============================================================
-- Allow admins to manage all posts (insert, update, delete)
CREATE POLICY "Admins can manage all posts"
ON public.posts
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to manage all clients (insert, update, delete)
CREATE POLICY "Admins can manage all clients"
ON public.clients
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- MIGRATION : 20260401154135_b52f7891-56de-4095-8096-3a4b6cb285ac.sql
-- ============================================================
-- Add secondary color column
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS couleur_secondaire text DEFAULT '#1A1A1A';

-- Fix the preview link policy: should only apply to anon role, not authenticated users
DROP POLICY IF EXISTS "Anon can read client via active preview link" ON public.clients;

CREATE POLICY "Anon can read client via active preview link"
ON public.clients
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM preview_links
    WHERE preview_links.client_id = clients.id
    AND preview_links.statut = 'actif'
    AND preview_links.expires_at > now()
  )
);

-- ============================================================
-- MIGRATION : 20260401163136_2f922642-5ad3-463e-8ad4-07d26600dd43.sql
-- ============================================================

-- Contract templates (owner-editable)
CREATE TABLE public.contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL DEFAULT 'Contrat standard',
  plan_slug TEXT NOT NULL,
  clauses JSONB NOT NULL DEFAULT '[]'::jsonb,
  owner_signature_url TEXT,
  owner_cachet_url TEXT,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage contract templates" ON public.contract_templates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can read active templates" ON public.contract_templates
  FOR SELECT TO authenticated
  USING (actif = true);

-- Signed contracts
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.contract_templates(id),
  plan_slug TEXT NOT NULL,
  plan_nom TEXT NOT NULL,
  prix_mensuel INTEGER NOT NULL DEFAULT 0,
  duree_mois INTEGER NOT NULL DEFAULT 6,
  clauses JSONB NOT NULL DEFAULT '[]'::jsonb,
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  email TEXT NOT NULL,
  signature_url TEXT,
  owner_signature_url TEXT,
  owner_cachet_url TEXT,
  pdf_url TEXT,
  signed_at TIMESTAMPTZ,
  statut TEXT NOT NULL DEFAULT 'en_attente',
  type_contrat TEXT NOT NULL DEFAULT 'souscription',
  ancien_plan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own contracts" ON public.contracts
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contracts" ON public.contracts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contracts" ON public.contracts
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all contracts" ON public.contracts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Receipt templates
CREATE TABLE public.receipt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  layout JSONB NOT NULL DEFAULT '{}'::jsonb,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.receipt_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage receipt templates" ON public.receipt_templates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can read receipt templates" ON public.receipt_templates
  FOR SELECT TO authenticated
  USING (actif = true);

-- Storage bucket for contract signatures and PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('contracts', 'contracts', false);

CREATE POLICY "Users can upload own signatures" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'contracts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read own contract files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'contracts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins can read all contract files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'contracts' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can upload contract files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'contracts' AND public.has_role(auth.uid(), 'admin'));

-- Insert default contract templates for each plan
INSERT INTO public.contract_templates (nom, plan_slug, clauses) VALUES
('Contrat Solo Standard', 'solo_standard', '[
  {"titre": "Objet du contrat", "contenu": "Le present contrat definit les conditions d''utilisation de la licence Digal Solo Standard entre le prestataire et Digal."},
  {"titre": "Duree et renouvellement", "contenu": "Le contrat est conclu pour une duree de 6 mois, renouvelable par tacite reconduction sauf denonciation par l''une des parties avec un preavis de 30 jours."},
  {"titre": "Tarification", "contenu": "Le montant de la licence est defini selon le plan choisi et payable mensuellement ou semestriellement."},
  {"titre": "Conditions d''utilisation", "contenu": "L''utilisateur s''engage a utiliser la plateforme conformement aux conditions generales d''utilisation et a ne pas partager ses identifiants d''acces."},
  {"titre": "Resiliation", "contenu": "Chaque partie peut resilier le contrat avec un preavis de 30 jours. En cas de resiliation anticipee, aucun remboursement ne sera effectue pour la periode en cours."},
  {"titre": "Protection des donnees", "contenu": "Digal s''engage a proteger les donnees personnelles conformement a la reglementation en vigueur. Les donnees du client restent sa propriete exclusive."},
  {"titre": "Responsabilite", "contenu": "Digal ne saurait etre tenu responsable des dommages indirects lies a l''utilisation de la plateforme."},
  {"titre": "Droit applicable", "contenu": "Le present contrat est regi par le droit senegalais. En cas de litige, les tribunaux de Dakar seront competents."}
]'::jsonb),
('Contrat Agence Standard', 'agence_standard', '[
  {"titre": "Objet du contrat", "contenu": "Le present contrat definit les conditions d''utilisation de la licence Digal Agence Standard entre l''agence et Digal."},
  {"titre": "Duree et renouvellement", "contenu": "Le contrat est conclu pour une duree de 6 mois, renouvelable par tacite reconduction sauf denonciation par l''une des parties avec un preavis de 30 jours."},
  {"titre": "Tarification", "contenu": "Le montant de la licence est defini selon le plan choisi et payable mensuellement ou semestriellement. Le plan inclut la gestion multi-membres."},
  {"titre": "Gestion d''equipe", "contenu": "L''agence est responsable de la gestion des acces de ses membres (CM, createurs). Les comptes membres sont lies au compte agence."},
  {"titre": "Conditions d''utilisation", "contenu": "L''agence s''engage a utiliser la plateforme conformement aux conditions generales et a garantir le respect de ces conditions par ses membres."},
  {"titre": "Resiliation", "contenu": "Chaque partie peut resilier le contrat avec un preavis de 30 jours. La resiliation entraine la desactivation de tous les comptes membres."},
  {"titre": "Protection des donnees", "contenu": "Digal s''engage a proteger les donnees personnelles. Les donnees clients de l''agence restent la propriete exclusive de l''agence."},
  {"titre": "Droit applicable", "contenu": "Le present contrat est regi par le droit senegalais. En cas de litige, les tribunaux de Dakar seront competents."}
]'::jsonb),
('Contrat Agence Pro', 'agence_pro', '[
  {"titre": "Objet du contrat", "contenu": "Le present contrat definit les conditions d''utilisation de la licence Digal Agence Pro entre l''agence et Digal."},
  {"titre": "Duree et renouvellement", "contenu": "Le contrat est conclu pour une duree de 6 mois, renouvelable par tacite reconduction sauf denonciation par l''une des parties avec un preavis de 30 jours."},
  {"titre": "Tarification", "contenu": "Le montant de la licence est defini selon le plan Pro et payable mensuellement ou semestriellement. Inclut toutes les fonctionnalites premium."},
  {"titre": "Gestion d''equipe", "contenu": "L''agence Pro beneficie d''un nombre illimite de membres et de clients. L''agence est responsable de la gestion de ses acces."},
  {"titre": "Support prioritaire", "contenu": "L''agence Pro beneficie d''un support prioritaire et d''un accompagnement personnalise pour la mise en place de la plateforme."},
  {"titre": "Resiliation", "contenu": "Chaque partie peut resilier le contrat avec un preavis de 30 jours. La resiliation entraine la desactivation de tous les comptes membres."},
  {"titre": "Protection des donnees", "contenu": "Digal s''engage a proteger les donnees personnelles conformement a la reglementation. Les donnees restent la propriete de l''agence."},
  {"titre": "Droit applicable", "contenu": "Le present contrat est regi par le droit senegalais. En cas de litige, les tribunaux de Dakar seront competents."}
]'::jsonb);

-- Insert default receipt templates
INSERT INTO public.receipt_templates (nom, slug, layout) VALUES
('Classique', 'classique', '{"style": "classic", "showLogo": true, "showFeatures": true, "accentColor": "#C4522A", "headerPosition": "left"}'::jsonb),
('Moderne', 'moderne', '{"style": "modern", "showLogo": true, "showFeatures": true, "accentColor": "#C4522A", "headerPosition": "center"}'::jsonb),
('Minimal', 'minimal', '{"style": "minimal", "showLogo": true, "showFeatures": false, "accentColor": "#1A1A1A", "headerPosition": "left"}'::jsonb),
('Premium', 'premium', '{"style": "premium", "showLogo": true, "showFeatures": true, "accentColor": "#C4522A", "headerPosition": "right", "showWatermark": true}'::jsonb);


-- ============================================================
-- MIGRATION : 20260401190245_d004de7c-28e1-4a10-a874-d6ce281f09ae.sql
-- ============================================================
CREATE POLICY "Admins can delete users"
ON public.users
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- MIGRATION : 20260415000001_license_keys.sql
-- ============================================================
-- Migration: license_keys table
-- Stores pre-generated license keys created by the Owner
-- Users activate these keys from Settings → Ma licence

CREATE TABLE IF NOT EXISTS public.license_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_code text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('solo', 'agence_standard', 'agence_pro')),
  duration_months integer NOT NULL DEFAULT 6 CHECK (duration_months > 0),
  is_used boolean NOT NULL DEFAULT false,
  used_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  used_at timestamptz,
  created_by uuid,
  promo_discount integer NOT NULL DEFAULT 0 CHECK (promo_discount >= 0 AND promo_discount <= 100),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.license_keys ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admins manage license_keys"
  ON public.license_keys
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can read unused keys (needed for validation)
-- The actual uniqueness check is done server-side
CREATE POLICY "Users can validate license keys"
  ON public.license_keys
  FOR SELECT
  TO authenticated
  USING (true);


-- ============================================================
-- MIGRATION : 20260415000002_license_activation_fn.sql
-- ============================================================
-- Migration: activate_license_key RPC function
-- Handles atomic key validation + user upgrade + cumulative extension

CREATE OR REPLACE FUNCTION public.activate_license_key(p_key_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key  license_keys%ROWTYPE;
  v_user users%ROWTYPE;
  v_base timestamptz;
  v_new_expiry timestamptz;
BEGIN
  -- Look up the key (case-insensitive)
  SELECT * INTO v_key
  FROM license_keys
  WHERE UPPER(key_code) = UPPER(p_key_code) AND is_used = false;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Clé invalide ou déjà utilisée');
  END IF;

  -- Look up caller's profile
  SELECT * INTO v_user FROM users WHERE user_id = auth.uid();

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Profil utilisateur introuvable');
  END IF;

  -- Compute cumulative expiration
  IF v_user.licence_expiration IS NOT NULL AND v_user.licence_expiration > now() THEN
    v_base := v_user.licence_expiration;
  ELSE
    v_base := now();
  END IF;
  v_new_expiry := v_base + (v_key.duration_months || ' months')::interval;

  -- Upgrade user
  UPDATE users
  SET role = v_key.type,
      licence_expiration = v_new_expiry,
      updated_at = now()
  WHERE user_id = auth.uid();

  -- Mark key consumed
  UPDATE license_keys
  SET is_used  = true,
      used_by  = v_user.id,
      used_at  = now()
  WHERE id = v_key.id;

  RETURN json_build_object(
    'success',    true,
    'type',       v_key.type,
    'expires_at', v_new_expiry
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.activate_license_key(text) TO authenticated;


-- ============================================================
-- MIGRATION : 20260415000003_production_periods.sql
-- ============================================================
-- Migration: production_periods table
-- Stores multi-day production blocks on the editorial calendar
-- Types: shooting, montage, livraison, custom

CREATE TABLE IF NOT EXISTS public.production_periods (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id   uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN ('shooting', 'montage', 'livraison', 'custom')),
  titre       text NOT NULL,
  description text,
  date_debut  date NOT NULL,
  date_fin    date NOT NULL CHECK (date_fin >= date_debut),
  assigne_a   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.production_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own production_periods"
  ON public.production_periods FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- MIGRATION : 20260415000004_drop_box.sql
-- ============================================================
-- Migration: drop_box_files table
-- Mode 2 créateur — dépôt libre de fichiers par client
-- Accessible au créateur pour upload ; CM/DM valide ou rejette

CREATE TABLE IF NOT EXISTS public.drop_box_files (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  -- owner (DM/CM)
  client_id   uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  -- créateur
  file_url    text NOT NULL,
  file_name   text NOT NULL,
  file_type   text,
  description text,
  statut      text NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'valide', 'rejete')),
  commentaire text,
  reviewed_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.drop_box_files ENABLE ROW LEVEL SECURITY;

-- Owner (DM/CM) can manage all files for their account
CREATE POLICY "Owners manage drop_box_files"
  ON public.drop_box_files FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Creators can insert files and view their own uploads
CREATE POLICY "Creators can upload drop_box_files"
  ON public.drop_box_files FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Creators can view their uploads"
  ON public.drop_box_files FOR SELECT
  TO authenticated
  USING (auth.uid() = uploaded_by OR auth.uid() = user_id);


-- ============================================================
-- MIGRATION : 20260415000005_boost_depenses.sql
-- ============================================================
-- Add boost/publicité fields to depenses
-- client_id: client affecté au boost
-- reseau: réseau publicitaire (facebook_ads, instagram_ads, etc.)
-- inclure_facture: true quand la dépense a déjà été incluse dans une facture

ALTER TABLE public.depenses
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reseau TEXT,
  ADD COLUMN IF NOT EXISTS inclure_facture BOOLEAN NOT NULL DEFAULT FALSE;


-- ============================================================
-- MIGRATION : 20260415000006_user_stamp_signature.sql
-- ============================================================
-- Add tampon (stamp) and signature URL columns to users table
-- Used in PDF generation for devis/factures

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS tampon_url TEXT,
  ADD COLUMN IF NOT EXISTS signature_url TEXT;


-- ============================================================
-- MIGRATION : 20260415000007_cron_expiry_reminders.sql
-- ============================================================
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


-- ============================================================
-- MIGRATION : 20260415000008_preview_enhancements.sql
-- ============================================================
-- Add human-readable slug to clients (modifiable by DM)
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS preview_slug TEXT;

-- Add welcome_message to preview_links (customizable per link)
ALTER TABLE public.preview_links
  ADD COLUMN IF NOT EXISTS welcome_message TEXT;


-- ============================================================
-- MIGRATION : 20260415000009_push_subscriptions.sql
-- ============================================================
-- Push notification subscriptions for Web Push API
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own subscriptions
CREATE POLICY "Users manage own push subscriptions"
  ON public.push_subscriptions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON public.push_subscriptions(user_id);

