
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
