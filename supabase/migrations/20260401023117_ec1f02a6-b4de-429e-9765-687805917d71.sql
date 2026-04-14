
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
