
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
