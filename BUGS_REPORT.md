# BUGS_REPORT.md
_Généré le 2026-04-17 — scan post-prompts 48A/48B/49_

---

## 1. Bugs critiques (bloquants pour l'utilisateur)

### BUG-01 — Notification "refus post" → lien 404
**Fichier** : `src/pages/PreviewPage.tsx` lignes 170 et 218  
**Problème** : `lien: "/dashboard/clients/${link.client_id}/calendrier"` — la route `/dashboard/clients/:id/calendrier` n'existe pas dans App.tsx (la route réelle est `/dashboard/clients/:id`). Cliquer la notification amène vers une page 404.  
**Correction** : Remplacer par `lien: "/dashboard/clients/${link.client_id}"`

---

### BUG-02 — Téléchargement PDF rapports KPI — race condition
**Fichier** : `src/pages/KpiReportsPage.tsx` lignes 144–147  
**Problème** : Bouton "PDF" appelle `handlePreview(r)` puis `setTimeout(handleDownload, 100)`. Le state `previewData` est async → non garanti à jour en 100 ms → download génère un PDF vide ou du mauvais rapport.  
**Correction** : Passer les données directement à `handleDownload(report, clientData, prevReport)` sans passer par le state, ou await le state update via un ref.

---

## 2. Bugs moyens (gênants mais contournables)

### BUG-03 — Label "Digital Manager" affiché pour les comptes Studio
**Fichier** : `src/pages/Settings.tsx` ligne 625  
**Problème** : `agence_standard: "Digital Manager"` dans `ROLE_LABELS` — doublon erroné avec `dm: "Digital Manager"`. Un utilisateur du plan Studio voit "Digital Manager" dans l'onglet équipe au lieu de "Studio".  
**Correction** : Remplacer par `agence_standard: "Studio"`

---

### BUG-04 — Logo client absent du PDF cumulatif
**Fichier** : `src/lib/kpi-pdf.ts` — fin de `generateCumulativeKpiPdf`  
**Problème** : Le paramètre `clientLogoUrl` est reçu mais masqué par `void clientLogoUrl` — le logo n'est pas inséré dans l'en-tête du PDF "Depuis le début" contrairement au PDF mensuel.  
**Correction** : Appliquer la même logique de chargement logo que dans `generateKpiPdf` (fetch → canvas → addImage), ou retirer le paramètre si fonctionnellement non souhaité.

---

### BUG-05 — Valeur 0 filtrée des PDFs et aperçus KPI
**Fichier** : `src/lib/kpi-reports.ts` lignes 174, 288  
**Problème** : `hasMetrics` et `getFilledMetrics` filtrent `v !== 0` — une métrique à 0 (ex : 0 commentaires) n'apparaît pas dans le rapport PDF ni l'aperçu, même si l'utilisateur l'a saisie volontairement.  
**Correction** : Ne filtrer que `v !== undefined && v !== null` ; 0 est une valeur valide et informative.

---

## 3. Incohérences mineures (UI, textes, labels)

### MINOR-01 — Anciens noms de plans dans la doc admin
**Fichier** : `src/pages/admin/AdminDocumentation.tsx` ligne 46  
**Problème** : Chaîne `"4 formules : Freemium, Solo Standard, Agence Standard, Agence Pro"` visible dans la documentation de la plateforme affichée aux admins.  
**Correction** : Remplacer par `"4 formules : Découverte, CM Pro, Studio, Elite"`

---

### MINOR-02 — Rôles fantômes dans ROLE_LABELS (Settings)
**Fichier** : `src/pages/Settings.tsx` lignes 622–624  
**Problème** : Entrées `solo_standard`, `solo_pro`, `agence_starter` dans `ROLE_LABELS` — ces slugs n'existent pas en BDD (les rôles réels sont `solo`, `agence_standard`, `agence_pro`). Dead code trompeur.  
**Correction** : Supprimer ces trois entrées ou les remplacer par des alias valides si des utilisateurs ont été créés avec ces rôles historiques.

---

### MINOR-03 — PROJECT_STATE.md obsolète
**Fichier** : `PROJECT_STATE.md` ligne 4  
**Problème** : `_Prompt courant : 48A_` — les prompts 48B et 49 ont été livrés sans mise à jour du fichier. Module "Rapports KPI" toujours à 95% sans mention du type "depuis_debut".  
**Correction** : Mettre à jour le prompt courant et ajouter les nouvelles fonctionnalités livrées (48B barre progression, 49 KPI cumulatif).

---

### MINOR-04 — Texte PricingSection avec ancien nom de plan
**Fichier** : `src/components/landing/PricingSection.tsx` ligne ~49  
**Problème** : Feature rename map contient `"Tout Solo Standard inclus"` → texte affiché sur la landing avec l'ancien nom commercial.  
**Correction** : Remplacer par `"Tout CM Pro inclus"`

---

## 4. Migrations non appliquées en production

Source : `MIGRATIONS_PENDING.md` — 7 migrations à appliquer sur `quvtfhwcwxijizsiqzpd`

| # | Fichier migration | Description | Priorité |
|---|-------------------|-------------|----------|
| 1 | `20260415000019_plan_configs.sql` | Table `plan_configs` (durées/prix par plan) | 🔴 CRITIQUE — PricingSection et AdminLicences défaillants sans elle |
| 2 | `20260415000020_admin_account_actions.sql` | `documents.client_id` nullable + `users.statut` | 🔴 CRITIQUE — fiche compte Admin crashe sans `users.statut` |
| 3 | `20260415000021_preview_anon_users.sql` | RLS anon sur `users` pour page preview publique | 🟡 IMPORTANT — cmName non résolu sur PreviewPage sans cette policy |
| 4 | `20260416000022_documents_remise.sql` | Colonnes `remise_pct` + `remise_montant` sur `documents` | 🟡 IMPORTANT — insert facture avec remise crash en prod |
| 5 | `20260416000023_elite_requests.sql` | Table `elite_requests` (demandes plan Elite) | 🟡 IMPORTANT — EliteContactModal crash sans la table |
| 6 | `20260416000024_launch_settings.sql` | `launch_date` + `show_countdown` dans `site_settings` | 🟢 NORMAL — countdown landing non affiché |
| 7 | `20260416000025_update_plan_names.sql` | UPDATE `plans.nom` anciens → nouveaux noms | 🟢 NORMAL — noms plans affichés depuis BDD incorrects |

**Commande d'application** : `supabase db push` ou via SQL Editor Supabase dans l'ordre numérique.

---

## Récapitulatif

| Catégorie | Nombre |
|-----------|--------|
| Critiques | 2 |
| Moyens | 3 |
| Mineurs | 4 |
| Migrations prod | 7 (dont 2 critiques) |
