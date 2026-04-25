# DIAGNOSTIC — Phase 3 : Agence + Admin + Infra

> Date : 2026-04-25  
> Périmètre : Gestion équipe, Facturation, Comptabilité, Journal, Paramètres, Dashboard Admin, Admin Comptes, Admin Licences, Admin Parrainages, Admin Plateforme, Infrastructure  
> Mode : lecture seule — aucune modification

---

## Légende

| Symbole | Sens |
|---------|------|
| ✅ | Conforme / fonctionne |
| ⚠️ | Douteux / à vérifier / amélioration suggérée |
| ❌ | Bug confirmé à corriger |

---

## 1. Gestion équipe (`Settings.tsx` → TeamTab)

### ✅ Ce qui fonctionne
- **Invitations** : génération de token, envoi email, optimistic update + `inviteLinkModal` (Dialog avec lien `font-mono` + bouton Copier via `copyToClipboard`) ✅
- **Invitations en attente** : chargées depuis `activation_tokens` (`agence_id = prof.agence_id AND is_used = false AND expires_at > now`), affichées dans une card conditionnelle ✅
- **Suppression membre** : bouton Trash2 (non-DM, non-self uniquement), `AlertDialog` de confirmation "Retirer [Prénom] de l'équipe ?" ✅
- **Répartition équipe** : champs `nb_cm` + `nb_createurs` (number inputs), vérification `overQuota`, comparé à `maxMembres` ✅
- **ROLE_LABELS** : map complète incluant `dm`, `freemium`, `solo`, `solo_standard`, `agence_standard`, `agence_pro`, `cm`, `createur` ✅
- **Solo/non-agence** : onglet Équipe absent ou désactivé si `!isAgence` ✅

### ⚠️ Ce qui est douteux
- **`handleRemoveMember` — colonne PK incertaine** : la suppression utilise `.eq("id", memberToRemove.id)`. Si la clé primaire de la table `users` est `user_id` (et non `id`), la requête ne trouve aucune ligne et échoue silencieusement sans toast d'erreur. À vérifier contre le schéma Supabase

---

## 2. Facturation (`Facturation.tsx` + `DocumentList` + `CreateDocumentModal`)

### ✅ Ce qui fonctionne
- **Garde Freemium** : écran de verrouillage complet avec icône Lock et `FreemiumLimitModal` pour les comptes freemium ✅
- **Deux onglets** : Devis + Factures avec compteurs badgés ✅
- **Ouverture auto depuis ClientDetail** : `location.state` → ouverture directe de `CreateDocumentModal` ✅
- **PDF jsPDF** : génération via `facturation-pdf.ts`, logo client inclus ✅
- **BRS (5%) + TVA (18%)** : toggles dans l'onglet Facturation des Paramètres, persistés en `site_settings` ✅
- **Méthodes de paiement** : 5 toggles (Wave, YAS, Orange Money, Virement, Cash) ✅
- **Contacts client dans PDF** : intégrés (implémenté prompt-47) ✅

### ⚠️ Ce qui est douteux
- **Conversion devis → facture** : non visible dans `Facturation.tsx` directement. La fonctionnalité est dans les sous-composants `DocumentList` / `CreateDocumentModal` non audités dans cette phase — présence à confirmer

---

## 3. Comptabilité (`Comptabilite.tsx`)

### ✅ Ce qui fonctionne
- **try/catch sur le chargement** : corrigé dans le cadre de l'audit-critique — pas de page blanche sur erreur ✅
- **Sélecteur mois** : 12 options générées via `generateMonthOptions()` ✅
- **Mois courant + précédent en parallèle** : deux queries lancées simultanément ✅
- **Sections composants** : `RevenusSection`, `DepensesSection`, `MasseSalarialeSection`, `DashboardFinancier` chargés en onglets ✅
- **Export CSV** : via `papaparse` (prompt-32) ✅
- **Boost → facture** : `fetchBoostDepenses` + `markBoostIncluded` intégrés ✅

### ⚠️ Ce qui est douteux
- Aucun point douteux identifié sur ce module

---

## 4. Journal d'activité (`Journal.tsx`)

### ✅ Ce qui fonctionne
- **Pagination** : `PAGE_SIZE = 20`, boutons Précédent / Suivant, reset page sur changement de filtre ✅
- **Filtres** : Select type d'action + date de début + date de fin — réactifs, `setPage(0)` à chaque changement ✅
- **Colonnes complètes** : Date, Type (Badge coloré), Action, Détail, Device (icône + OS), Navigateur, Localisation (flag emoji + ville · pays), IP ✅
- **Flag emoji** : `countryFlag()` convertit le code ISO 2 lettres en emoji drapeau ✅
- **Empty state** : icône `Activity` + message si aucune entrée ✅
- **Gestion erreurs** : try/catch + `toast.error` + `console.error` en DEV ✅

### ⚠️ Ce qui est douteux
- Aucun point douteux identifié sur ce module

---

## 5. Paramètres (`Settings.tsx`)

### ✅ Ce qui fonctionne
- **Avatar** : `ImageCropModal` → upload vers `user-uploads/${user.id}/avatar.png` (upsert) ✅
- **Logo agence** : `ImageCropModal` → upload vers `user-uploads/${user.id}/logo/${Date.now()}.png` (nouveaux fichiers à chaque upload) ✅
- **Couleur de marque** : color picker persisté ✅
- **SIGLE facturation** : input max 5 caractères, force uppercase, persisté en `site_settings.billing_sigle` ✅
- **BRS/TVA** : Switches avec valeurs par défaut (BRS=true, TVA=false) ✅
- **Onglet Licences** : délégué au composant `LicenceTab` ✅
- **PreviewSettingsCard + PushNotificationsCard** : embarqués dans l'onglet Profil ✅

### ⚠️ Ce qui est douteux
- **Tampon / Signature** : upload PNG/WEBP sans `ImageCropModal` — l'utilisateur ne peut pas recadrer son tampon. Risque d'image mal cadrée ou de dimensions incohérentes dans les PDF. Accepte PNG et WEBP mais pas SVG (contrairement à ce qu'on pourrait attendre pour un tampon vectoriel)

---

## 6. Dashboard Admin (`admin/AdminDashboard.tsx`)

### ✅ Ce qui fonctionne
- **KPIs globaux** : MRR calculé via `roleToPlanSlug` × prix plans, comptes actifs, expirations proches, taux de conversion ✅
- **4 widgets parrainages** : total filleuls, revenus parrainage, taux activation, quota moyen (prompt-56D) ✅
- **Alertes prioritaires** : 4 niveaux — `urgent` (expire ≤7j), `attention` (inactif 14j+), `opportunite` (freemium 30j+ sans upgrade), `info` (jamais connecté) ✅
- **Engagement** : totalClients, postsThisWeek, previewLinksThisMonth, revenueThisMonth ✅
- **TanStack Query** : données chargées via `useQuery` avec cache ✅
- **Santé** : `fetchHealthData` — inactifs 7j/30j, jamais connectés (exclusion <1h), hot prospects ✅

### ⚠️ Ce qui est douteux
- **MRR approximatif** : basé sur `role` × prix fixes — ne reflète pas les remises ou extensions de licence manuelles accordées depuis `AdminLicences`. Indicateur de tendance, pas un MRR comptable exact

---

## 7. Admin Comptes (`admin/AdminComptes.tsx`)

### ✅ Ce qui fonctionne
- **Création compte** : `createAccountSchema` RHF + Zod avec `superRefine` — durée et méthode de paiement requis si plan ≠ freemium (sauf si `offert=true`) ✅
- **Validation mot de passe** : confirmation password dans `superRefine` ✅
- **Suspension** : edge function `ban-user`, `AlertDialog` de confirmation ✅
- **Suppression** : `AlertDialog` avec double confirmation ✅
- **Interface `UserProfile`** : inclut `statut` et `referral_quota` ✅
- **Recherche / filtrage** : présent ✅

### ⚠️ Ce qui est douteux
- Aucun point douteux identifié sur ce module

---

## 8. Admin Licences (`admin/AdminLicences.tsx`)

### ✅ Ce qui fonctionne
- **Génération clé** : `crypto.getRandomValues` pour 6 caractères alphanumériques aléatoires ✅
- **Format** : `DIGAL-{TYPE_SHORT[type]}-{6chars}` (ex: `DIGAL-SOLO-AB12CD`) ✅
- **TYPE_SHORT** : `solo→SOLO`, `agence_standard→STD`, `agence_pro→PRO` ✅
- **Toggle promo** : switch + champ `discount %` ✅
- **Extension licence** : dialog dédié ✅
- **`planConfigs`** : chargé depuis `plan_configs` (`est_actif = true` uniquement) ✅
- **Copier clé** : `copyToClipboard` de `lib/clipboard.ts` ✅

### ⚠️ Ce qui est douteux
- Aucun point douteux identifié sur ce module

---

## 9. Admin Parrainages (`admin/AdminParrainages.tsx`)

### ✅ Ce qui fonctionne
- **Deux onglets** : Parrainages + Demandes quota ✅
- **`markRewarded`** : mutation `UPDATE referrals SET status="rewarded"` ✅
- **`approveQuota`** : incrémente `referral_quota`, passe en `status="approved"`, envoie notification ✅
- **`rejectQuota`** : passe en `status="rejected"` ✅
- **Countdown auto-approve** : `minutesUntil()` affiche le temps restant avant approbation automatique ✅
- **Gestion erreurs** : try/catch dans toutes les mutations ✅

### ⚠️ Ce qui est douteux
- Aucun point douteux identifié sur ce module

---

## 10. Admin Paramètres plateforme (`admin/AdminPlateforme.tsx`)

### ✅ Ce qui fonctionne
- **Compte à rebours lancement** : `launch_date` + `show_countdown` → upsert `site_settings`, prévisualisation "J-X" en temps réel ✅
- **Toggle parrainage** : `referral_enabled` → `site_settings` ✅
- **Paliers parrainage** : `TIER_KEYS = ["3","5","10","20"]` avec champs éditables persistés en `site_settings.referral_tiers` ✅
- **Template WhatsApp** : Textarea persistée en `site_settings.referral_whatsapp_template` ✅
- **Message de remerciement preview** : `site_settings.preview_thanks_message` via mutation dédiée `thanksMutation` ✅

### ⚠️ Ce qui est douteux
- **Messages d'activation par plan** : absents de `AdminPlateforme`. Cette fonctionnalité (table `activation_messages`, prompt-54) est dans `AdminWaitlist` — si l'on cherche tous les paramètres "plateforme" dans ce fichier, on ne trouvera pas ces messages. Risque de confusion pour la maintenance future

---

## 11. Infrastructure

### ✅ Ce qui fonctionne
- **10 edge functions** présentes dans `supabase/functions/` : `activate-account`, `ban-user`, `create-user`, `expiry-reminders`, `geolocate-ip`, `keep-alive`, `scheduled-cleanup`, `send-email`, `send-push`, `setup-owner` ✅
- **Cron expiry-reminders** : migration `000015`, planifié à 08:00 UTC quotidiennement ✅
- **Cron keep-alive** : migration `000030`, planifié toutes les 48h pour éviter la mise en veille Supabase ✅
- **PWA** : `vite-plugin-pwa` + Workbox + Web Push VAPID — code présent et configuré ✅
- **Migrations** : 30+ migrations dans `supabase/migrations/`, séquentielles et cohérentes ✅

### ⚠️ Ce qui est douteux
- **Déploiement edge functions** : les fichiers existent en local mais il est impossible de vérifier depuis le code seul si toutes les fonctions sont déployées et actives sur le projet Supabase remote. Notamment `geolocate-ip`, `send-push`, `setup-owner` — à valider via dashboard Supabase
- **`RESEND_API_KEY`** : marquée ❌ À configurer dans `PROJECT_STATE.md` — sans cette clé, tous les emails transactionnels (invitations, reset, activation) échouent silencieusement (edge function retourne une erreur non bloquante)
- **VAPID keys** : marquées ❌ À configurer dans `PROJECT_STATE.md` — sans ces clés, les push notifications (`send-push`) ne fonctionnent pas. Les abonnements PWA échouent à l'enregistrement
- **Comportement PWA en production** : l'installabilité (HTTPS + manifest + service worker) et les push notifications ne peuvent pas être vérifiés à partir du code seul — nécessite un test sur l'environnement de production

---

## Synthèse des points à corriger

### ❌ Bug à corriger (0)

Aucun bug confirmé dans le périmètre Phase 3.

### ⚠️ Améliorations mineures (5)

| # | Fichier / Périmètre | Description |
|---|---------------------|-------------|
| A1 | `Settings.tsx` (TeamTab) | Vérifier que `handleRemoveMember` utilise la bonne colonne PK — si `users.user_id` est la PK, remplacer `.eq("id", ...)` par `.eq("user_id", ...)` |
| A2 | `Settings.tsx` (BillingTab) | Ajouter `ImageCropModal` pour l'upload tampon/signature (cohérence avec avatar et logo) |
| A3 | `AdminPlateforme.tsx` | Documenter ou regrouper la gestion des messages d'activation (actuellement dispersée entre `AdminPlateforme` et `AdminWaitlist`) |
| A4 | Infrastructure | Configurer `RESEND_API_KEY` dans les secrets Supabase (edge function `send-email`) |
| A5 | Infrastructure | Configurer les clés VAPID dans les secrets Supabase (edge function `send-push`) |

---

*Rapport généré automatiquement — aucun fichier modifié.*
