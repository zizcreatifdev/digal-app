# PROJECT_STATE.md — État du projet Digal

_Dernière mise à jour : 2026-04-15_
_Prompt courant : 36 — Durées de licence flexibles depuis Admin_

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

### Module CALENDRIER ÉDITORIAL — 100% ✅ (prompt-27)
| Fonctionnalité | État | Notes |
|----------------|------|-------|
| Vue calendrier mensuelle | ✅ Complet | `EditorialCalendar` |
| Créer un post | ✅ Complet | `CreatePostModal` |
| Modifier un post | ✅ Complet | `EditPostModal` |
| Workflow statuts | ✅ Complet | idee→en_production→validation→publie |
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

### Module RAPPORTS KPI — 95% ✅ (prompt-29)
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
| Historique rapports | ✅ Complet | |
| Protection route /rapports | ✅ Complet (prompt-06) | |
| Tests | ✅ 18/18 | `kpi-reports.test.ts` |

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

### Module ADMIN — 99% ✅
| Page admin | État | Notes |
|------------|------|-------|
| Dashboard KPIs (MRR, comptes) | ✅ Complet | |
| Gestion comptes + Export CSV | ✅ Complet (prompt-09) | |
| Onglet Financier par compte | ✅ Complet (prompt-09) | CA, dépenses, salaires |
| Génération clés + promo + prolongation | ✅ Complet | |
| Génération clé avec durée depuis plan_configs | ✅ Complet (prompt-36) | Select durées actives par plan |
| Gestion waitlist | ✅ Complet (prompt-36) | Select durée + prix dans message copié |
| Gestion plans tarifaires | ✅ Complet | |
| Configurations tarifaires (plan_configs) | ✅ Complet (prompt-36) | Durées/prix par plan, toggle actif/populaire, inline edit, ajout |
| Gestion contrats | ✅ Complet | |
| Campagnes emails | ✅ Complet | |
| Logs de sécurité | ✅ Complet | |
| TOTP 2FA obligatoire | ✅ Complet | AdminTotpGate |

---

### Module LANDING PAGE — 100% ✅
| Composant | État | Notes |
|-----------|------|-------|
| Hero + countdown | ✅ | |
| Problem / Solution | ✅ | |
| MockupsSection | ✅ (prompt-10) | 4 cartes animées |
| Pricing | ✅ (prompt-36) | Toggle durée Mensuel/3m/6m/12m, prix depuis plan_configs, badge "Économisez X%" |
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
| Warnings ESLint | 15 warnings (shadcn/ui + exhaustive-deps — non bloquants) |
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
