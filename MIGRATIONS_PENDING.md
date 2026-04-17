# MIGRATIONS_PENDING.md
_À appliquer sur Supabase production (projet quvtfhwcwxijizsiqzpd)_
_Généré le 2026-04-17 — prompt-46_

---

## Comment appliquer

```bash
# Via Supabase CLI (recommandé)
supabase db push

# Ou manuellement via le dashboard Supabase → SQL Editor
# Copier/coller le contenu de chaque fichier dans l'ordre
```

---

## Migrations à vérifier / appliquer

Les migrations suivantes ont été créées depuis la dernière synchronisation connue avec la production.
**Appliquer dans l'ordre numérique.**

| # | Fichier | Description | Priorité |
|---|---------|-------------|----------|
| 1 | `20260415000019_plan_configs.sql` | Table `plan_configs` (durées/prix par plan) + données par défaut | 🔴 CRITIQUE |
| 2 | `20260415000020_admin_account_actions.sql` | `documents.client_id` nullable + colonne `users.statut` | 🔴 CRITIQUE |
| 3 | `20260415000021_preview_anon_users.sql` | RLS anon sur `users` pour page preview publique | 🟡 IMPORTANT |
| 4 | `20260416000022_documents_remise.sql` | Colonnes `remise_pct` + `remise_montant` sur `documents` | 🟡 IMPORTANT |
| 5 | `20260416000023_elite_requests.sql` | Table `elite_requests` (demandes plan Elite) + RLS | 🟡 IMPORTANT |
| 6 | `20260416000024_launch_settings.sql` | INSERT `launch_date` + `show_countdown` dans `site_settings` | 🟢 NORMAL |
| 7 | `20260416000025_update_plan_names.sql` | UPDATE `plans.nom` : anciens noms → Découverte/CM Pro/Studio/Elite | 🟢 NORMAL |

---

## SQL complet à appliquer (dans l'ordre)

### 1. plan_configs

```sql
CREATE TABLE public.plan_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_type TEXT NOT NULL,
  duree_mois INTEGER NOT NULL,
  prix_fcfa INTEGER NOT NULL,
  est_actif BOOLEAN DEFAULT true,
  est_populaire BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.plan_configs (plan_type, duree_mois, prix_fcfa, est_actif) VALUES
('solo', 1, 15000, true),
('solo', 3, 40000, true),
('solo', 6, 75000, true),
('solo', 12, 140000, true),
('agence_standard', 1, 35000, true),
('agence_standard', 3, 95000, true),
('agence_standard', 6, 175000, true),
('agence_standard', 12, 330000, true),
('agence_pro', 1, 55000, true),
('agence_pro', 3, 150000, true),
('agence_pro', 6, 275000, true),
('agence_pro', 12, 520000, true);

UPDATE public.plan_configs SET est_populaire = true WHERE duree_mois = 6;

ALTER TABLE public.plan_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plan_configs_select_public" ON public.plan_configs FOR SELECT USING (true);
CREATE POLICY "plan_configs_all_admin" ON public.plan_configs FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
```

### 2. admin_account_actions

```sql
ALTER TABLE public.documents ALTER COLUMN client_id DROP NOT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS statut TEXT DEFAULT 'actif';
```

### 3. preview_anon_users

Voir fichier `supabase/migrations/20260415000021_preview_anon_users.sql` pour le contenu complet (policies RLS complexes).

### 4. documents_remise

```sql
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS remise_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS remise_montant NUMERIC(12,2) NOT NULL DEFAULT 0;
```

### 5. elite_requests

```sql
CREATE TABLE public.elite_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  agence TEXT NOT NULL,
  email TEXT NOT NULL,
  telephone TEXT NOT NULL,
  nb_membres TEXT NOT NULL,
  message TEXT,
  statut TEXT DEFAULT 'nouveau',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.elite_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can insert elite requests" ON public.elite_requests
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Owner can manage elite requests" ON public.elite_requests
  FOR ALL USING (true);
```

### 6. launch_settings

```sql
INSERT INTO public.site_settings (key, value)
VALUES ('launch_date', '2026-05-01T00:00:00Z')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.site_settings (key, value)
VALUES ('show_countdown', 'true')
ON CONFLICT (key) DO NOTHING;
```

### 7. update_plan_names

```sql
UPDATE public.plans SET nom = 'Découverte' WHERE slug = 'freemium';
UPDATE public.plans SET nom = 'CM Pro'     WHERE slug = 'solo';
UPDATE public.plans SET nom = 'Studio'     WHERE slug = 'agence_standard';
UPDATE public.plans SET nom = 'Elite'      WHERE slug = 'agence_pro';
```

---

## Vérification post-migration

```sql
-- Vérifier les noms de plans
SELECT slug, nom FROM public.plans ORDER BY ordre;

-- Vérifier plan_configs
SELECT plan_type, duree_mois, prix_fcfa FROM public.plan_configs ORDER BY plan_type, duree_mois;

-- Vérifier site_settings countdown
SELECT * FROM public.site_settings WHERE key IN ('launch_date', 'show_countdown');
```
