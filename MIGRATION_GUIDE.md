# MIGRATION_GUIDE.md — Digal vers Supabase personnel

**Nouveau projet** : `quvtfhwcwxijizsiqzpd`  
**URL** : `https://quvtfhwcwxijizsiqzpd.supabase.co`

---

## Ce qui est déjà fait (côté code)

- [x] `.env` mis à jour avec les nouvelles clés
- [x] `.env.lovable.backup` — sauvegarde de l'ancienne config
- [x] `supabase/config.toml` — project_id mis à jour
- [x] 0 référence à `bfzapmhvgnoicgbngpmi` dans le code
- [x] `supabase/MIGRATION_BUNDLE.sql` — toutes les migrations en 1 fichier

---

## Étapes à effectuer manuellement sur le dashboard Supabase

### 1. Appliquer toutes les migrations SQL

1. Ouvrir https://supabase.com/dashboard/project/quvtfhwcwxijizsiqzpd/editor
2. Ouvrir le fichier `supabase/MIGRATION_BUNDLE.sql`
3. Copier le contenu complet et le coller dans l'éditeur SQL
4. Cliquer **Run** (ou F5)

> Le fichier contient **39 migrations** dans l'ordre chronologique correct.

### 2. Activer les extensions requises

Dans l'éditeur SQL, exécuter :
```sql
-- Extension pour les cron jobs (expiry-reminders)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Extension pour les appels HTTP depuis SQL (cron → edge functions)
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### 3. Déployer les Edge Functions

Avec la Supabase CLI connectée (token personnel) :
```bash
npx supabase login
npx supabase link --project-ref quvtfhwcwxijizsiqzpd

# Déployer toutes les edge functions
npx supabase functions deploy send-email
npx supabase functions deploy expiry-reminders
npx supabase functions deploy scheduled-cleanup
npx supabase functions deploy setup-owner
npx supabase functions deploy send-push
```

### 4. Configurer les secrets des Edge Functions

Dans le dashboard :
https://supabase.com/dashboard/project/quvtfhwcwxijizsiqzpd/settings/functions

Ajouter les secrets suivants :
```
RESEND_API_KEY=<votre_clé_resend>
VAPID_PUBLIC_KEY=<votre_clé_vapid_publique>
VAPID_PRIVATE_KEY=<votre_clé_vapid_privée>
VAPID_SUBJECT=mailto:contact@digal.sn
```

### 5. Configurer le cron (expiry-reminders)

Le cron est créé automatiquement par la migration `20260415000007_cron_expiry_reminders.sql`.
Vérifier dans :
https://supabase.com/dashboard/project/quvtfhwcwxijizsiqzpd/database/extensions

Activer **pg_cron** et **pg_net** si pas déjà fait.

Ensuite, configurer le paramètre app.supabase_url dans le projet :
```sql
ALTER DATABASE postgres SET app.supabase_url = 'https://quvtfhwcwxijizsiqzpd.supabase.co';
```

### 6. Configurer le bucket Storage

Dans le dashboard Storage :
https://supabase.com/dashboard/project/quvtfhwcwxijizsiqzpd/storage/buckets

Créer les buckets suivants (la migration les configure mais Storage doit être initialisé) :
- `post-media` (public)
- `client-logos` (public)
- `documents` (private)
- `avatars` (public)
- `receipts` (private)

### 7. Configurer le premier compte Admin

Aller sur https://quvtfhwcwxijizsiqzpd.supabase.co/admin/setup et créer le compte owner.

Ou via l'éditeur SQL :
```sql
-- Remplacer par votre user_id Supabase Auth
UPDATE public.users SET role = 'owner' WHERE id = '<your-user-id>';
INSERT INTO public.user_roles (user_id, role) VALUES ('<your-user-id>', 'admin')
ON CONFLICT DO NOTHING;
```

---

## Vérification post-migration

### Tables créées (attendues : 25+)
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Tables attendues :
- activity_logs, changelog, changelog_reactions
- client_networks, clients, contracts, contract_templates
- depenses, document_lines, documents
- drop_box_files, kpi_reports
- license_keys, marketing_emails
- notifications, owner_payments, payments
- plans, post_templates, posts, preview_actions, preview_links
- production_periods, push_subscriptions
- receipt_templates, salaires, security_logs
- site_settings, users, user_roles, waitlist

### Politiques RLS actives
```sql
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Edge functions déployées
Vérifier dans :
https://supabase.com/dashboard/project/quvtfhwcwxijizsiqzpd/functions

---

## Rapport de migration

| Élément | Quantité | Statut |
|---------|----------|--------|
| Migrations SQL | 39 fichiers | ✅ Bundle créé |
| Edge functions | 5 | ⏳ À déployer manuellement |
| Variables d'environnement | 5 | ✅ `.env` mis à jour |
| `config.toml` | 1 | ✅ project_id mis à jour |
| Références ancien projet | 0 | ✅ Aucune dans le code |
| Tests unitaires | 137/137 | ✅ Passent |
| ESLint | 0 erreurs | ✅ |

---

## En cas de problème

### Rollback vers Lovable Supabase
```bash
cp .env.lovable.backup .env
# Remettre dans config.toml :
# project_id = "bfzapmhvgnoicgbngpmi"
```

### Ordre des migrations
Les migrations sont numérotées chronologiquement. En cas d'erreur SQL,
identifier la migration échouée et continuer depuis celle-là.
Chaque migration est idempotente pour les `CREATE TABLE IF NOT EXISTS`.
