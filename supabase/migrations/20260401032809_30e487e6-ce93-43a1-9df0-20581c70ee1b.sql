
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
