# PROJECT_STATE.md — État du projet Digal

_Dernière mise à jour : 2026-04-18_
_Prompt courant : 53 — Géolocalisation IP + Cron keep-alive_

---

## Vue d'ensemble

**Digal** est un SaaS B2B de gestion pour agences de communication digitale et freelances (marché sénégalais). Il couvre la gestion de clients, le calendrier éditorial, la facturation (FCFA), la comptabilité, les rapports KPI et la gestion d'équipe.

**Version : 1.0.0** — Production-ready.

### Supabase

| | Ancien (Lovable) | Nouveau (Personnel) |
|-|-----------------|---------------------|
| Project ID | `bfzapmhvgnoicgbngpmi` | `quvtfhwcwxijizsiqzpd` |
| URL | `https://bfzapmhvgnoicgbngpmi.supabase.co` | `https://quvtfhwcwxijizsiqzpd.supabase.co` |
| `.env` | ✅ Mis à jour | ✅ Actif |
| `config.toml` | — | ✅ Mis à jour |
| Migrations SQL | — | ✅ Bundle `supabase/MIGRATION_BUNDLE.sql` (39 migrations) |
| Edge functions | — | ⏳ À déployer via CLI (voir MIGRATION_GUIDE.md) |

---

## État des modules

### Module AUTH — 95% ✅
| Fonctionnalité | État | Notes |
|----------------|------|-------|
| Login email/password | ✅ Complet | Via Supabase Auth |
| Register | ✅ Complet | Email redirect |
| Reset password | ✅ Complet | Page `/reset-password` |
| AuthGuard (protection routes) | ✅ Complet | Redirige vers /login |
| Rôles (admin/user) | ✅ Complet | Table `user_roles` |
| Protection routes par profileRole | ✅ Complet (prompt-06) | `allowedProfileRoles` dans AuthGuard |
| TOTP 2FA pour admin | ✅ Complet | `AdminTotpGate` — enrollment QR + vérification |
| Onboarding wizard | ✅ Complet | 4 étapes, skip possible |
| Checklist onboarding 5 étapes | ✅ Complet (prompt-29) | `OnboardingChecklist` floating, badges DB, modal félicitations |
| Étape onboarding équipe (agence) | ✅ Complet (prompt-52) | Étape 0 "Configure ton équipe" pour rôle DM/agence, modal nb_cm/nb_createurs |
| Waitlist | ✅ Complet | Page publique |
| Tests routes | ✅ Complet (prompt-11) | 19 tests dans `routes.test.ts` |

---

### Module CLIENTS — 98% ✅
| Fonctionnalité | État | Notes |
|----------------|------|-------|
| Liste clients actifs | ✅ Complet | |
| Ajout client + réseaux | ✅ Complet | Modal AddClientModal |
| Édition client post-création | ✅ Complet (prompt-06) | EditClientModal + updateClient() |
| Détail client | ✅ Complet | Page ClientDetail + bouton Modifier |
| Réseaux sociaux par client | ✅ Complet | Table `client_networks` |
| Archive / restore client | ✅ Complet | |
| Couleur de marque | ✅ Complet | Color picker |
| Upload logo client | ✅ Complet | Supabase Storage |
| Freemium limit (2 clients actifs) | ✅ Complet | Via `getAccountAccess` |
| Freemium limit (3 archivés) | ✅ Complet (prompt-09) | Bloqué à 3 archives |
| Slug client modifiable | ✅ Complet (prompt-10) | `clients.preview_slug` + édition dans ClientDetail |
| Tests freemium limits | ✅ Complet (prompt-11) | 16 tests dans `freemium-limits.test.ts` |

---

### Module CALENDRIER ÉDITORIAL — 100% ✅ (prompt-48B)
| Fonctionnalité | État | Notes |
|----------------|------|-------|
| Vue calendrier mensuelle | ✅ Complet | `EditorialCalendar` |
| Créer un post | ✅ Complet | `CreatePostModal` — statut initial "brouillon" |
| Modifier un post | ✅ Complet | `EditPostModal` |
| Workflow statuts | ✅ Complet | brouillon→en_attente_validation→programme_valide→publie |
| Statuts verrouillés (48A) | ✅ Complet | Règles 1/2/3/4/5 — transitions validées |
| Couleur bordure par statut (48B) | ✅ Complet | `POST_STATUT_HEX` dans PostCard |
| Boutons contextuels PostCard (48B) | ✅ Complet | Soumettre / Générer lien / En attente / Publier |
| Barre progression mois ClientDetail (48B) | ✅ Complet | programme_valide + publie / total |
| Upload média post | ✅ Complet | Supabase Storage `post-media` |
| Blocs périodes de production | ✅ Complet (prompt-07) | 4 types colorés |
| Filtres par client/réseau | ✅ Complet | |
| Templates de posts | ✅ Complet | Limite 3 en Freemium (prompt-09) |
| Assignation à créateur | ✅ Complet | `assigne_a` field |
| Review par CM | ✅ Complet | `ReviewPostModal` |
| Blocs périodes production | ✅ Complet (prompt-27) | Shooting/montage/livraison/custom |
| Couleur libre période custom | ✅ Complet (prompt-27) | Color picker + migration 000014 |
| Carrousel 10 médias par post | ✅ Complet (prompt-27) | CreatePost + EditPost multi-file |
| Compression images auto | ✅ Complet (prompt-27) | browser-image-compression → 2 Mo |
| Drag & drop ordre médias | ✅ Complet (prompt-27) | Reorder dans les 2 modaux |
| Validation formats par réseau | ✅ Complet (prompt-27) | TikTok MP4 only, etc. |

---

### Module PREVIEW LINKS (validation client) — 100% ✅
| Fonctionnalité | État | Notes |
|----------------|------|-------|
| Génération lien unique | ✅ Complet | Slug `{clientSlug}-{random6}` ou random12 |
| Page preview publique | ✅ Complet | `/preview/:slug` sans auth |
| Sélection période | ✅ Complet | Semaine/mois courant ou suivant |
| Validation/refus par client | ✅ Complet | `preview_actions` |
| Expiration liens | ✅ Complet | Edge function `scheduled-cleanup` |
| Maquette réseau (NetworkMockup) | ✅ Complet | |
| Slug client modifiable | ✅ Complet (prompt-10) | |
| Période par défaut configurable | ✅ Complet (prompt-10) | `site_settings.preview_default_period` |
| Countdown expiration | ✅ Complet (prompt-10) | "Ce lien expire dans X heures" |
| Message d'accueil | ✅ Complet (prompt-10) | Champ texte dans modal + affiché sur preview |
| Page expirée améliorée | ✅ Complet (prompt-10) | Date d'expiration visible + logo Digal |
| Onglets réseaux scroll mobile | ✅ Complet | `overflow-x-auto` + shrink-0 |
| Tests | ✅ 15/15 | `preview-links.test.ts` |

---

### Module FACTURATION — 90% ✅
| Fonctionnalité | État | Notes |
|----------------|------|-------|
| Création devis | ✅ Complet | |
| Création facture | ✅ Complet | |
| Lignes de facturation | ✅ Complet | Avec BRS et TVA |
| Calcul taxes (BRS + TVA) | ✅ Complet | `calculateTotals()` |
| Remise sur facture | ✅ Complet (prompt-38) | Champ remise % dans modal, PDF ligne verte, auto-calculé sur factures_licence |
| Refonte PDF style épuré | ✅ Complet (prompt-40) | facturation-pdf.ts + AdminFacturation receipt : palette #E8511A, header logo+numéro+badge, 2 colonnes info, table DESCRIPTION/QTÉ/PRIX UNIT./MONTANT, totaux right-aligned, footer Digal |
| Conversion devis → facture | ✅ Complet | |
| Enregistrement paiements | ✅ Complet | |
| Statuts (brouillon/envoyé/payé/...) | ✅ Complet | 7 statuts |
| Génération PDF | ✅ Complet | jsPDF |
| Méthodes paiement (Wave, OM, etc.) | ✅ Complet | |
| Numérotation avec SIGLE | ✅ Complet (prompt-08) | `FAC-LCS-2026-0001` |
| Tampon + Signature PDF | ✅ Complet (prompt-08) | |
| Protection route /facturation | ✅ Complet (prompt-06) | |
| Tests calculateTotals | ✅ 14/14 | `facturation.test.ts` |
| Tests generateNumero | ✅ 7/7 (prompt-11) | `documents.test.ts` |
| Tests slugifyClientName | ✅ 6/6 (prompt-11) | `documents.test.ts` |

---

### Module COMPTABILITÉ — 100% ✅ (prompt-32)
| Fonctionnalité | État | Notes |
|----------------|------|-------|
| Dashboard financier | ✅ Complet | |
| Dépenses (CRUD) | ✅ Complet | |
| Boost dépenses (client + réseau) | ✅ Complet (prompt-08) | |
| Boost → ligne facture | ✅ Complet (prompt-08) | |
| Masse salariale | ✅ Complet | |
| Export CSV/rapport | ✅ Complet (prompt-32) | papaparse, bouton Download, colonnes dépenses + salaires |
| Graphiques | ✅ Complet | Recharts |
| Protection route /comptabilite | ✅ Complet (prompt-06) | |
| Tests fetchBoostDepenses | ✅ 4/4 (prompt-11) | `boost-facture.test.ts` |
| Tests markBoostIncluded | ✅ 2/2 (prompt-11) | `boost-facture.test.ts` |

---

### Module RAPPORTS KPI — 100% ✅ (prompt-49)
| Fonctionnalité | État | Notes |
|----------------|------|-------|
| Création rapport KPI | ✅ Complet | |
| Métriques par réseau | ✅ Complet (prompt-29) | +likes/commentaires/partages instagram, facebook, linkedin, x, tiktok |
| Métriques Instagram | ✅ Complet (prompt-29) | Likes, Commentaires, Partages ajoutés |
| Métriques Facebook | ✅ Complet (prompt-29) | Likes, Commentaires, Partages ajoutés |
| Métriques LinkedIn | ✅ Complet (prompt-29) | Réactions, Commentaires, Partages ajoutés |
| Métriques X/Twitter | ✅ Complet (prompt-29) | Likes, Retweets, Réponses ajoutés |
| Métriques TikTok | ✅ Complet (prompt-29) | Favoris, Portée ajoutés |
| Période Trimestrielle | ✅ Complet (prompt-29) | Sélecteur type période + calcul T1/T2/T3/T4 |
| Période Personnalisée | ✅ Complet (prompt-29) | 2 date pickers libres |
| Points forts / axes | ✅ Complet | |
| Export PDF | ✅ Complet | `kpi-pdf.ts` + labels période adapt. |
| Historique rapports | ✅ Complet | `formatMoisLabel` pour tous les formats |
| Période Depuis le début (49) | ✅ Complet | Stats auto BDD + PDF cumulatif + tableaux mensuels |
| Protection route /rapports | ✅ Complet (prompt-06) | |
| Tests | ✅ 137/137 | `kpi-reports.test.ts` — 0 inclus dans métriques |

---

### Module LICENCES — 100% ✅
| Fonctionnalité | État | Notes |
|----------------|------|-------|
| Table `license_keys` | ✅ Complet | |
| Génération clé DIGAL-TYPE-XXXX | ✅ Complet | |
| Activation côté utilisateur | ✅ Complet | RPC `activate_license_key` |
| Extension cumulative expiration | ✅ Complet | |
| Popup expiration J-30 | ✅ Complet | |
| Retour freemium auto si expirée | ✅ Complet (prompt-25) | Dashboard.tsx `check()` — UPDATE DB |
| Validation format clé (regex) | ✅ Complet (prompt-25) | `DIGAL-(SOLO\|STD\|PRO)-[A-Z0-9]{6}` |
| Messages RPC distincts | ✅ Complet (prompt-25) | "Clé introuvable" vs "déjà utilisée" |
| Clé promo (-30%) | ✅ Complet (prompt-09) | |
| Prolongation manuelle (N mois) | ✅ Complet (prompt-09) | |
| Rappels J-30/15/7 (cron) | ✅ Complet (prompt-09) | Edge fn + pg_cron |
| Tests licences | ✅ 18/18 (prompt-11) | `licences.test.ts` |

---

### Module EMAIL — 100% ✅ (prompt-30)
| Fonctionnalité | État | Notes |
|----------------|------|-------|
| Edge function `send-email` | ✅ Complet | Deno + Resend |
| `lib/emails.ts` | ✅ Complet | 10 types dont relance_freemium |
| Rejet créateur câblé | ✅ Complet (prompt-09) | |
| Approbation waitlist câblée | ✅ Complet (prompt-09) | |
| Cron J-30/15/7 (09h UTC) | ✅ Complet (prompt-30) | Reschedule à 09:00 UTC |
| Templates emails améliorés | ✅ Complet (prompt-30) | Sujets corrects + CTA button |
| Lien expiré sans réponse → CM | ✅ Complet (prompt-30) | `scheduled-cleanup` + `expiry_notified` flag |
| Relance freemium inactif 30j | ✅ Complet (prompt-30) | `expiry-reminders` + `relance_sent` flag |
| RPC `get_inactive_freemium_users` | ✅ Complet (prompt-30) | SECURITY DEFINER, join auth.users |
| Migration `expiry_notified` | ✅ Complet (prompt-30) | `preview_links.expiry_notified` BOOLEAN |
| Migration `relance_sent` | ✅ Complet (prompt-30) | `users.relance_sent` BOOLEAN |
| Clé RESEND_API_KEY | ❌ À configurer | Variable env Supabase |

---

### Module PWA — 95% ✅ (prompt-31)
| Fonctionnalité | État | Notes |
|----------------|------|-------|
| Manifest PWA | ✅ Complet | `public/manifest.json` |
| Service Worker (Workbox) | ✅ Complet (prompt-11) | `src/sw.ts` via vite-plugin-pwa |
| Cache assets statiques | ✅ Complet (prompt-11) | Workbox precacheAndRoute |
| Cache API Supabase (NetworkFirst) | ✅ Complet (prompt-11) | 24h + timeout 5s |
| Cache Storage (CacheFirst) | ✅ Complet (prompt-11) | 7 jours |
| Auto-update SW | ✅ Complet (prompt-11) | `registerSW` dans main.tsx |
| Web Push API | ✅ Complet (prompt-11) | VAPID, table push_subscriptions, edge fn send-push |
| Opt-in UI (Settings) | ✅ Complet (prompt-11) | Toggle dans onglet Profil |
| Fix clavier iOS PWA | ✅ Complet (prompt-31B) | ios-scroll-container fixed+overflow-y, min-h-[100dvh], autoComplete/inputMode |
| VAPID keys | ❌ À configurer | Env VITE_VAPID_PUBLIC_KEY + secrets |

---

### Module PARAMÈTRES — 98% ✅ (prompt-32)
| Fonctionnalité | État | Notes |
|----------------|------|-------|
| Profil utilisateur | ✅ Complet | |
| Invitation équipe | ✅ Complet (prompt-32) | Token activation_tokens + email Resend + activate-account gère rôle + agence_id |
| Répartition équipe (nb_cm/nb_createurs) | ✅ Complet (prompt-52) | Card "Répartition équipe" dans TeamTab, quota/progression, save users.nb_cm/nb_createurs |
| Clé licence | ✅ Complet | |
| Historique licences | ✅ Complet | |
| Tampon + signature | ✅ Complet (prompt-08) | |
| Modèles de posts | ✅ Complet | Limite 3 freemium |
| Période preview par défaut | ✅ Complet (prompt-10) | |
| Notifications push | ✅ Complet (prompt-11) | Toggle Web Push |

---

### Module AUTH — 100% ✅ (prompt-26)
| Fonctionnalité | État | Notes |
|----------------|------|-------|
| Guards routes avec toast "Accès non autorisé" | ✅ Complet (prompt-26) | AuthGuard useEffect + toast.error |
| `/dashboard/calendrier` restreint (no createur) | ✅ Complet (prompt-26) | allowedProfileRoles sans createur |
| Filtrage clients par rôle CM | ✅ Complet (prompt-26) | fetchClients({ role }) + assigned_cm |
| Freemium limit clients → FreemiumLimitModal | ✅ Complet (prompt-26) | Bouton → /parametres?tab=licence |
| Freemium limit archives → FreemiumLimitModal | ✅ Complet (prompt-26) | ClientDetail |
| Freemium limit templates → FreemiumLimitModal | ✅ Complet (prompt-26) | Settings TemplatesTab |
| Settings deep-link ?tab=licence | ✅ Complet (prompt-26) | useSearchParams |

---

### Module ADMIN — 100% ✅
| Page admin | État | Notes |
|------------|------|-------|
| Dashboard KPIs (MRR, comptes) | ✅ Complet | |
| Gestion comptes + Export CSV | ✅ Complet (prompt-09) | |
| Fiche compte : en-tête avatar + stats Aperçu | ✅ Complet (prompt-37A) | Initiales colorées, email, dernière connexion, clients actifs/posts/liens/factures mois |
| Fiche compte : onglet Actions | ✅ Complet (prompt-37B) | Facturation plan 3 étapes, révoquer/suspendre/supprimer avec confirmations |
| Onglet Financier par compte | ✅ Complet (prompt-09) | CA, dépenses, salaires |
| Génération clés + promo + prolongation | ✅ Complet | |
| Génération clé avec durée depuis plan_configs | ✅ Complet (prompt-36) | Select durées actives par plan |
| Gestion waitlist + Demandes Elite | ✅ Complet (prompt-41) | Onglets : Liste d'attente + Demandes Elite ; tableau Elite avec statuts colorés, select inline, copier contact, compteurs |
| Gestion plans tarifaires | ✅ Complet | |
| Configurations tarifaires (plan_configs) | ✅ Complet (prompt-36) | Durées/prix par plan, toggle actif/populaire, inline edit, ajout |
| Membres max par plan (agence) | ✅ Complet (prompt-52) | Input max_membres + toggle Illimité dans AdminPlans, sauvegarde plans.max_membres |
| Gestion contrats | ✅ Complet | |
| Campagnes emails | ✅ Complet | |
| Logs de sécurité | ✅ Complet (prompt-53) | Device + Navigateur (parsé depuis user_agent) |
| Journal activité utilisateur | ✅ Complet (prompt-53) | Device / Navigateur / Ville · Pays avec flag emoji |
| Géolocalisation IP | ✅ Complet (prompt-53) | Edge fn geolocate-ip → ip-api.com → activity_logs.city/country |
| Keep-alive cron | ✅ Complet (prompt-53) | Edge fn keep-alive + pg_cron toutes les 48h |
| TOTP 2FA obligatoire | ✅ Complet | AdminTotpGate |
| Paramètres plateforme | ✅ Complet (prompt-44) | /admin/plateforme — widget countdown : date+heure, toggle show/hide, aperçu jours restants |

---

### Module LANDING PAGE — 100% ✅
| Composant | État | Notes |
|-----------|------|-------|
| Hero + countdown | ✅ (prompt-44) | Countdown configurable via Admin ; toggle show/hide ; état lancé → CTA "Créer mon compte" |
| Problem / Solution | ✅ | |
| MockupsSection | ✅ (prompt-10) | 4 cartes animées |
| Pricing | ✅ (prompt-41) | Toggle 3 options Mensuel/6mois/Annuel, badges -X% sur toggle, "au lieu de", taglines par plan, nouveaux noms |
| Elite sur mesure | ✅ (prompt-41) | Carte Elite : "Tarif sur mesure" + "Demander un devis" → EliteContactModal |
| Texte membres dynamique | ✅ (prompt-52) | getMemberText() depuis plans.max_membres — remplace textes hardcodés |
| EliteContactModal | ✅ (prompt-41) | Form 6 champs, insert table elite_requests, toast 24h |
| CTA | ✅ | |
| Header + Footer | ✅ | Liens /cgu + /privacy |
| Page /privacy | ✅ (prompt-10) | |
| Page /cgu | ✅ (prompt-10) | |

---

### Module DOCUMENTATION — 100% ✅ (prompt-11)
| Document | État |
|----------|------|
| ARCHITECTURE.md | ✅ Mis à jour (PWA, push, migrations, edge fns, tests) |
| TEST_AGENT.md | ✅ Mis à jour (137 tests, patterns mock, couverture) |
| CHANGELOG.md | ✅ Créé — v1.0.0 |
| PROJECT_STATE.md | ✅ À jour — 100% |
| CLAUDE.md | ✅ Stable |

---

## Qualité du code

| Métrique | État |
|----------|------|
| Erreurs ESLint | ✅ 0 erreur |
| Warnings ESLint | 12 warnings (shadcn/ui + exhaustive-deps — non bloquants) |
| Tests unitaires | ✅ 137/137 passent |
| Fichiers de tests | 10 fichiers |
| TypeScript | 0 erreur (strict) |
| Build | ✅ Passe |

---

## Bugs connus

| # | Description | Sévérité |
|---|-------------|----------|
| 1 | ~~QR code TOTP via api.qrserver.com~~ | ✅ Corrigé (prompt-33) — génération locale via `qrcode` |
| 2 | ~~Double fetch session dans useAuth (race condition)~~ | ✅ Corrigé (prompt-32) |
| 3 | ~~Export CSV comptabilité non implémenté~~ | ✅ Implémenté (prompt-32) |
| 4 | RESEND_API_KEY + VAPID keys à configurer en production | CRITIQUE (config) |
| 5 | ~~Notification refus lien vers route inexistante~~ | ✅ Corrigé (prompt-50) — `/calendrier` retiré |
| 6 | ~~Race condition PDF KpiReportsPage setTimeout~~ | ✅ Corrigé (prompt-50) — `handleDirectDownload(report)` |
| 7 | ~~Settings agence_standard → "Digital Manager"~~ | ✅ Corrigé (prompt-50) — "Studio" |
| 8 | ~~Valeur 0 filtrée des PDFs KPI~~ | ✅ Corrigé (prompt-50) — 0 est une valeur valide |

---

## Variables d'environnement à configurer en production

```bash
# Supabase
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...

# Web Push
VITE_VAPID_PUBLIC_KEY=...

# Supabase secrets (edge functions)
RESEND_API_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_PUBLIC_KEY=...
VAPID_SUBJECT=mailto:contact@digal.sn
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## Historique des prompts

| Prompt | Description | Date |
|--------|-------------|------|
| init | Création des fichiers de mémoire | 2026-04-14 |
| 01 | Correction 66 erreurs ESLint → 0 erreur | 2026-04-14 |
| 02 | Dashboard connecté Supabase — stats réelles | 2026-04-14 |
| 03 | Scan données hardcodées — correction cmName KPI | 2026-04-14 |
| 04 | 61 tests unitaires (facturation, account-access, kpi-reports, preview-links) | 2026-04-14 |
| 05A/B/C | Audits CDC sections 1-17 → AUDIT_A/B/C.md | 2026-04-14 |
| 06 | Phase 1 : licences DIGAL, service email, routes par rôle, EditClientModal | 2026-04-14 |
| 07 | Phase 2A : onboarding checklist, blocs périodes, boîte dépôt Mode 2 | 2026-04-14 |
| 08 | Phase 2B : numérotation SIGLE, tampon+signature PDF, boost→facture | 2026-04-14 |
| 09 | Phase 3A : export CSV + onglet financier admin, clé promo, emails trigger, ProUpgradeModal, limites freemium | 2026-04-14 |
| 10 | Phase 3B : preview améliorations, landing page complète (mockups, /privacy, /cgu) | 2026-04-14 |
| 11 | Phase 4 : PWA (Workbox + Web Push), tests ×5 (137 total), documentation v1.0.0 | 2026-04-14 |
| 12 | Migration Supabase Lovable → personnel (quvtfhwcwxijizsiqzpd), .env + config.toml + bundle SQL 39 migrations | 2026-04-14 |
| 13-17 | CI deploy edge fns, VAPID, vercel.json SPA, create-user admin modal, logos SVG intégration | 2026-04-14 |
| 18 | Activation compte par lien unique (activation_tokens, edge fn, page /activate/:token) | 2026-04-14 |
| 19 | Copie manuelle message activation (suppression email auto, bouton copy, badge statut, regénération) | 2026-04-14 |
| 25 | Licences : retour freemium auto, validation regex, messages RPC distincts | 2026-04-15 |
| 26 | Sécurité rôles : AuthGuard toast, filtrage CM, FreemiumLimitModal, deep-link settings | 2026-04-15 |
| 27 | Calendrier : couleur custom périodes, carrousel 10 médias, compression images, drag&drop | 2026-04-15 |
| 28 | Boîte dépôt (déjà existante) + historique liens validation (PreviewLinksHistory) | 2026-04-15 |
| 29 | Onboarding 5 étapes (DB persistence + badge modal) + KPI métriques complètes + périodes trimestrielle/personnalisée | 2026-04-15 |
| 30 | Emails automatiques : relance freemium, expiry reminders améliorés, notification lien expiré CM, migrations expiry_notified + relance_sent | 2026-04-15 |
| 31 | Fix clavier iOS PWA : viewport-fit=cover + interactive-widget, onFocus scrollIntoView (Login + Activate), CSS @supports pwa-login-container | 2026-04-15 |
| 31B | Fix clavier iOS PWA (approche dvh) : viewport simplifié, ios-scroll-container (fixed+overflow), min-h-[100dvh], autoComplete/inputMode | 2026-04-15 |
| 32 | Export CSV comptabilité (papaparse) + invitation équipe complète (token+email+agence_id) + fix useAuth race condition (initializedRef) | 2026-04-15 |
| 33 | QR code TOTP local : remplacement api.qrserver.com par lib qrcode (toDataURL), fallback Loader2 | 2026-04-15 |
| 34 | Rapport test end-to-end TEST_REPORT.md (10 modules, 137/137 tests) | 2026-04-15 |
| 35 | Fix log connexion activity_logs : login_success dans Activate + useAuth + widget "Jamais connectés" (exclure < 1h) | 2026-04-15 |
| 36 | Durées licence flexibles : table plan_configs, AdminPlans configs tarifaires, AdminLicences select durée, PricingSection toggle, AdminWaitlist durée+prix | 2026-04-15 |
| 37A | Fiche compte Admin : en-tête avatar + onglet Aperçu (clients actifs, posts, liens, factures mois) | 2026-04-15 |
| 37B | Fiche compte Admin : onglet Actions — facturation plan 3 étapes + zone dangereuse | 2026-04-15 |
| bugs | Fix 4 bugs : bouton Facture ClientDetail, TeamJournal refonte équipe, route journal, lien Login AdminSetup | 2026-04-16 |
| 38 | Nouveaux noms plans (Découverte/CM Pro/Studio/Elite), toggle pricing 3 options + -X% + taglines, remise sur factures | 2026-04-16 |
| 41 | Plan Elite sur mesure : carte "Tarif sur mesure" + EliteContactModal (6 champs, insert elite_requests), AdminWaitlist onglets + tableau Demandes Elite, migration SQL | 2026-04-16 |
| 44 | Countdown configurable : migration launch_date+show_countdown, AdminPlateforme widget (date, toggle, aperçu), useCountdown showCountdown, HeroSection lancé → CTA "Créer mon compte" | 2026-04-16 |
| audit-2 | Audit lecture seule : 8 problèmes critiques noms plans, 6 migrations en attente prod | 2026-04-17 |
| 45 | Fix AdminPlans : PLAN_SLUG_NAMES, query plan_configs + filtre .in(), prix depuis plan_configs (duree=1), "Tarif sur mesure" Elite | 2026-04-16 |
| 46 | Fix cohérence noms plans : 7 fichiers corrigés, src/lib/plan-labels.ts centralisé, migration UPDATE plans.nom, MIGRATIONS_PENDING.md | 2026-04-17 |
| 47 | Refonte PDF factures CM : header branding CM, bloc client dans modal, footer Digal centré | 2026-04-17 |
| fix | Notifications cliquables + select colonnes explicites | 2026-04-17 |
| 48A | Statuts posts verrouillés : brouillon+programme_valide, Règles 1-5 (submission, preview filter, validation→programme_valide, refus→brouillon+notif CM, publie depuis programme_valide uniquement) | 2026-04-17 |
| 48B | UI statuts : POST_STATUT_HEX, boutons contextuels PostCard, barre progression mensuelle ClientDetail | 2026-04-17 |
| 49 | KPI cumulatif "Depuis le début" : CumulativeStats, fetchCumulativeStats, formatMoisLabel, generateCumulativeKpiPdf, CreateKpiReportModal depuis_debut | 2026-04-17 |
| 50 | Fix 9 bugs : notif lien 404, race condition PDF, label Studio, logo PDF, valeur 0, AdminDoc, rôles fantômes, PricingSection, PROJECT_STATE | 2026-04-17 |
| 51 | Formulaire création compte enrichi : Durée & Prix depuis plan_configs, toggle Offrir, section Paiement, facture_licence auto à la création | 2026-04-17 |
| 52 | Membres configurables par plan : migration max_membres+nb_cm+nb_createurs, AdminPlans quota, OnboardingChecklist étape équipe, PricingSection dynamique, Settings TeamTab | 2026-04-17 |
| 53 | Géolocalisation IP (geolocate-ip edge fn, ip-api.com) + keep-alive cron (pg_cron 48h) + Device/Navigateur/Localisation dans Journal et AdminSecurity | 2026-04-18 |
