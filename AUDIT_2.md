# AUDIT_2.md — Rapport incohérences post-modifications
_Date : 2026-04-17 — Audit lecture seule, aucune modification_

---

## Résumé exécutif

| Catégorie | Nombre |
|-----------|--------|
| Problèmes CRITIQUES (anciens noms affichés) | 8 |
| Problèmes MOYENS (doc interne) | 2 |
| Problèmes FAIBLES (nice-to-have) | 2 |

---

## Étape 1 — Anciens noms de plans dans le code

### Instances d'anciens noms trouvées

| Fichier | Ligne | Problème | Correction |
|---------|-------|----------|------------|
| `src/pages/Activate.tsx` | ~110-111 | `agence_standard: "Agence Standard"` + `agence_pro: "Agence Pro"` dans mapping rôle→nom | Remplacer par `"Studio"` et `"Elite"` |
| `src/pages/admin/AdminWaitlist.tsx` | ~57-58 | `agence_standard: "Agence Standard"` + `agence_pro: "Agence Pro"` dans badge plan | Remplacer par `"Studio"` et `"Elite"` |
| `src/pages/admin/AdminDashboard.tsx` | ~277 | `"Passez à la version Solo Standard et débloquez :"` dans prompt upgrade | Remplacer par `"Passez à CM Pro et débloquez :"` |
| `src/pages/admin/AdminContrats.tsx` | ~166-168 | `solo_standard: "Solo Standard"`, `agence_standard: "Agence Standard"`, `agence_pro: "Agence Pro"` dans labels templates | Remplacer par `"CM Pro"`, `"Studio"`, `"Elite"` |
| `src/components/landing/TeamRolesSection.tsx` | ~58 | Texte `"Disponible sur Agence Standard et Pro"` affiché sur la landing | Remplacer par `"Studio et Elite"` |
| `src/pages/Settings.tsx` | ~625 | `agence_pro: "DM Agence Pro"` dans mapping rôle→label | Remplacer par `"DM Elite"` |
| `src/pages/TeamJournal.tsx` | ~31 | `agence_pro: "DM Agence Pro"` dans mapping rôle→label | Remplacer par `"DM Elite"` |
| `src/pages/admin/AdminDocumentation.tsx` | ~46 | `"4 formules : Freemium, Solo Standard, Agence Standard, Agence Pro"` | Mettre à jour avec nouveaux noms |

### Pages Admin correctement mises à jour ✅

| Fichier | État |
|---------|------|
| `AdminPlans.tsx` | ✅ PLAN_SLUG_NAMES correct (Découverte/CM Pro/Studio/Elite) |
| `AdminComptes.tsx` | ✅ PLAN_LABELS correct |
| `AdminLicences.tsx` | ✅ TYPE_LABELS correct |
| `AdminSecurity.tsx` | ✅ Pas de référence aux plans |
| `AdminEmails.tsx` | ✅ Seule référence : `"freemium"` (technique, acceptable) |

---

## Étape 2 — Prix hardcodés

| Fichier | Lignes | Problème | Correction |
|---------|--------|----------|------------|
| `src/components/landing/PricingSection.tsx` | ~80-82 | `FALLBACK_PRICES` hardcodés `{1:15000, 6:75000, 12:140000}` pour solo, etc. | Ces valeurs sont un fallback de sécurité si plan_configs est vide — acceptable mais crée une duplication. Envisager de les supprimer et d'exiger que plan_configs soit toujours peuplé. |

**Note** : Ces FALLBACK_PRICES correspondent exactement aux valeurs en BDD (migration `20260415000019_plan_configs.sql`). Le risque est qu'une modification en BDD ne soit pas reflétée sans modifier le code.

---

## Étape 3 — Cohérence App

### Composants corrects ✅

| Fichier | État |
|---------|------|
| `src/components/AdminSidebar.tsx` | ✅ Aucun nom de plan hardcodé |
| `src/pages/Dashboard.tsx` | ✅ Utilise `isFreemium` flag, pas de noms hardcodés |
| `src/pages/Waitlist.tsx` | ✅ Pas de référence aux noms de plans |
| `src/lib/emails.ts` | ✅ Logique basée sur rôle, pas de noms affichés |
| `src/lib/account-access.ts` | ✅ Correct, basé sur `isFreemium` flag |
| `src/hooks/useAuth.tsx` | ✅ Aucun nom de plan hardcodé |

### Composants avec problèmes

| Fichier | Ligne | Problème |
|---------|-------|----------|
| `src/pages/Settings.tsx` | ~625 | `"DM Agence Pro"` → doit être `"DM Elite"` |
| `src/pages/TeamJournal.tsx` | ~31 | `"DM Agence Pro"` → doit être `"DM Elite"` |
| `src/pages/Activate.tsx` | ~110-111 | Anciens noms dans mapping d'affichage |
| `src/components/landing/TeamRolesSection.tsx` | ~58 | Texte landing avec anciens noms |

---

## Étape 4 — Migrations

### Migrations récentes (potentiellement non appliquées en prod)

| Migration | Contenu | Statut |
|-----------|---------|--------|
| `20260415000019_plan_configs.sql` | Table `plan_configs` + données par défaut | ⚠️ À vérifier en prod |
| `20260415000020_admin_account_actions.sql` | Actions admin fiche compte | ⚠️ À vérifier |
| `20260415000021_preview_anon_users.sql` | Accès anon previews | ⚠️ À vérifier |
| `20260416000022_documents_remise.sql` | Colonne remise sur documents | ⚠️ À vérifier |
| `20260416000023_elite_requests.sql` | Table `elite_requests` | ⚠️ À vérifier |
| `20260416000024_launch_settings.sql` | `launch_date` + `show_countdown` dans site_settings | ⚠️ À vérifier |

### Problèmes dans anciennes migrations (NE PAS MODIFIER)

| Migration | Ligne | Problème |
|-----------|-------|----------|
| `20260401124217_*.sql` | ~35-37 | INSERT dans `plans` avec `nom = 'Solo Standard'`, `'Agence Standard'`, `'Agence Pro'` — données historiques en prod |
| `20260401163136_*.sql` | ~113-134 | Templates contrats avec `plan_slug = 'solo_standard'`, etc. |
| `20260401104441_*.sql` | — | CHECK constraint sur `users.role` inclut `'solo_standard'`, `'solo_pro'`, `'agence_starter'` (options obsolètes mais non bloquantes) |

**Note** : Les migrations historiques ne doivent jamais être modifiées. Les données `nom` dans la table `plans` (anciens noms) doivent être corrigées via une nouvelle migration `UPDATE`.

---

## Étape 5 — Cahier des charges

| Section CDC | Ligne | État |
|-------------|-------|------|
| Section 2.1 — Types de comptes | ~64-68 | ❌ Anciens noms : "Solo Standard", "Agence Standard", "Agence Pro" |
| Section 2.2 — Pricing | ~75-77 | ❌ Prix avec anciens noms de plans |
| Section 4.1 — Formules | ~46 | ❌ `"4 formules : Freemium, Solo Standard, Agence Standard, Agence Pro"` |

### Fonctionnalités CDC — Statut d'implémentation

| Fonctionnalité | État |
|----------------|------|
| Landing countdown | ✅ Implémenté + configurable Admin |
| Waitlist | ✅ Implémenté |
| Toggle pricing 3 durées | ✅ PricingSection.tsx |
| Plan Elite sur devis | ✅ EliteContactModal + elite_requests |
| Stockage éphémère | ✅ PostCard tooltip + SolutionSection |
| Activation par lien | ✅ activation_tokens + /activate/:token |
| Copie manuelle waitlist | ✅ AdminWaitlist |
| Admin fiche compte | ✅ AdminComptes (prompt-37A/B) |
| PDF factures redesigné | ✅ facturation-pdf.ts (prompt-40) |
| Demandes Elite Admin | ✅ AdminWaitlist onglet Elite |

---

## Plan de correction suggéré (prochain prompt)

### Priorité 1 — Corrections affichage (1 prompt)
1. `Activate.tsx` : mapping rôle → nom affiché
2. `AdminWaitlist.tsx` : badges plan
3. `AdminDashboard.tsx` : texte upgrade prompt
4. `AdminContrats.tsx` : labels templates
5. `TeamRolesSection.tsx` : texte landing
6. `Settings.tsx` : label DM
7. `TeamJournal.tsx` : label DM

### Priorité 2 — Migration SQL (1 prompt)
Créer une migration `UPDATE public.plans SET nom = '...' WHERE slug = '...'` pour corriger les noms en BDD (ex: `Solo Standard` → `CM Pro`).

### Priorité 3 — Documentation (1 prompt)
Mettre à jour `Digal_Cahier_des_charges.md` et `AdminDocumentation.tsx`.
