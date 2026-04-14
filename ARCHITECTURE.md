# ARCHITECTURE.md — Digal

## Stack technique

| Couche | Technologie | Version |
|--------|-------------|---------|
| Framework UI | React | 18.3 |
| Build tool | Vite + SWC | 5.4 |
| Langage | TypeScript | 5.8 |
| Styles | Tailwind CSS | 3.4 |
| Composants UI | shadcn/ui (Radix) | latest |
| Backend / BDD | Supabase (PostgreSQL) | 2.101 |
| Auth | Supabase Auth + TOTP (MFA) | — |
| State serveur | TanStack React Query | 5.83 |
| Routing | React Router DOM | 6.30 |
| Formulaires | React Hook Form + Zod | 7 / 3 |
| PDF | jsPDF + jsPDF-AutoTable | 4 / 5 |
| Animations | Framer Motion | 12 |
| Charts | Recharts | 2 |
| Tests unitaires | Vitest + Testing Library | 3.2 |
| Tests E2E | Playwright | 1.57 |
| PWA | vite-plugin-pwa + Workbox | 1.2 |
| Gestionnaire de paquets | bun (lock) / npm | — |

---

## Structure des dossiers

```
digal-app/
├── public/                    # Fichiers statiques (favicon, PWA icons, manifest)
│   ├── icon-192.png           # PWA icon 192×192
│   ├── icon-512.png           # PWA icon 512×512
│   └── manifest.json          # Web App Manifest (PWA)
├── src/
│   ├── App.tsx                # Routeur principal, providers globaux
│   ├── main.tsx               # Point d'entrée React + registerSW (PWA)
│   ├── sw.ts                  # Service Worker custom (Workbox + Web Push)
│   ├── index.css              # Variables CSS globales, Tailwind base
│   ├── vite-env.d.ts          # Types Vite + vite-plugin-pwa
│   │
│   ├── assets/                # Images statiques (logo Digal)
│   │
│   ├── components/            # Composants partagés
│   │   ├── ui/                # shadcn/ui (40+ composants Radix)
│   │   ├── admin/             # Composants spécifiques admin
│   │   ├── AdminTotpGate.tsx  # 2FA TOTP obligatoire /admin/*
│   │   ├── AuthGuard.tsx      # Protection routes par rôle
│   │   ├── ProUpgradeModal.tsx # Modal upgrade avec mockups par feature
│   │   ├── calendar/          # Composants calendrier éditorial
│   │   ├── clients/           # Composants gestion clients
│   │   ├── comptabilite/      # Composants comptabilité
│   │   ├── contracts/         # Composants signature contrats
│   │   ├── facturation/       # Composants facturation
│   │   ├── kpi/               # Composants rapports KPI
│   │   ├── landing/           # Composants page d'accueil
│   │   │   ├── LandingHeader.tsx
│   │   │   ├── LandingFooter.tsx   # Liens CGU + Privacy + Contact
│   │   │   ├── MockupsSection.tsx  # 4 feature cards animées (framer-motion)
│   │   │   └── ...
│   │   └── preview/           # Composants liens preview client
│   │       └── GeneratePreviewLinkModal.tsx  # welcome_message + default period
│   │
│   ├── hooks/                 # Hooks React custom
│   │   ├── useAuth.tsx        # Contexte auth global
│   │   ├── usePlans.ts        # Fetch plans Supabase
│   │   ├── useCountdown.ts    # Compte à rebours
│   │   └── use-mobile.tsx     # Détection mobile
│   │
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts      # createClient Supabase (singleton)
│   │       └── types.ts       # Types générés (toutes les tables)
│   │
│   ├── lib/                   # Logique métier / appels Supabase
│   │   ├── account-access.ts  # Utilitaire rôles/plans (getAccountAccess)
│   │   ├── activity-logs.ts   # Logs d'activité
│   │   ├── clients.ts         # CRUD clients + réseaux + slugifyClientName
│   │   ├── comptabilite.ts    # CRUD dépenses + salaires + fetchBoostDepenses
│   │   ├── creator-workflow.ts # Workflow créateur/CM + email rejet
│   │   ├── drop-box.ts        # Drop-box créateur + email rejet
│   │   ├── emails.ts          # Helper sendEmail (5 types)
│   │   ├── facturation.ts     # CRUD documents + paiements + generateNumero
│   │   ├── facturation-pdf.ts # Génération PDF factures/devis
│   │   ├── kpi-pdf.ts         # Génération PDF rapports KPI
│   │   ├── kpi-reports.ts     # CRUD rapports KPI
│   │   ├── notifications.ts   # CRUD notifications
│   │   ├── posts.ts           # CRUD posts calendrier
│   │   ├── preview-links.ts   # CRUD liens preview + generateSlug + welcome_message
│   │   ├── push-notifications.ts # Web Push API (subscribe/unsubscribe)
│   │   └── utils.ts           # cn(), formatters
│   │
│   ├── pages/                 # Pages React Router
│   │   ├── LandingPage.tsx    # Landing avec MockupsSection
│   │   ├── CGU.tsx            # /cgu — Conditions Générales d'Utilisation
│   │   ├── Privacy.tsx        # /privacy — Politique de Confidentialité
│   │   ├── Login.tsx / Register.tsx / Waitlist.tsx / ResetPassword.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Clients.tsx / ClientDetail.tsx  # Limites freemium + slug modifiable
│   │   ├── CalendarPage.tsx
│   │   ├── KpiReportsPage.tsx
│   │   ├── Facturation.tsx    # Boost → ligne facture auto
│   │   ├── Comptabilite.tsx
│   │   ├── CreatorDashboard.tsx
│   │   ├── TeamJournal.tsx
│   │   ├── Journal.tsx
│   │   ├── Settings.tsx       # Push notifications + preview default period
│   │   ├── Changelog.tsx / DocsPage.tsx
│   │   ├── PreviewPage.tsx    # Countdown expiration + welcome message + page expirée
│   │   └── admin/
│   │       ├── AdminDashboard.tsx
│   │       ├── AdminComptes.tsx   # Onglet Financier + Export CSV
│   │       ├── AdminLicences.tsx
│   │       ├── AdminWaitlist.tsx  # Email approbation waitlist
│   │       ├── AdminFacturation.tsx
│   │       ├── AdminPlans.tsx
│   │       ├── AdminContrats.tsx
│   │       ├── AdminEmails.tsx
│   │       ├── AdminSecurity.tsx
│   │       ├── AdminGuides.tsx
│   │       ├── AdminDocumentation.tsx
│   │       ├── AdminProfil.tsx
│   │       ├── AdminSetup.tsx
│   │       └── AdminPlaceholder.tsx
│   │
│   └── test/
│       ├── setup.ts                 # Config Testing Library
│       ├── example.test.ts          # Test placeholder
│       ├── account-access.test.ts   # getAccountAccess (13 tests)
│       ├── facturation.test.ts      # calculateTotals + formatFCFA (14 tests)
│       ├── kpi-reports.test.ts      # hasMetrics + getFilledMetrics (18 tests)
│       ├── preview-links.test.ts    # getPeriodDates (15 tests)
│       ├── licences.test.ts         # Format clé + génération + extension cumulative (18 tests)
│       ├── routes.test.ts           # Protection routes par rôle (19 tests)
│       ├── documents.test.ts        # generateNumero + slugifyClientName (13 tests)
│       ├── freemium-limits.test.ts  # Limites 2/3/3 clients/archives/templates (16 tests)
│       └── boost-facture.test.ts    # fetchBoostDepenses + markBoostIncluded (10 tests)
│
├── supabase/
│   ├── config.toml            # Config projet Supabase local
│   ├── functions/
│   │   ├── scheduled-cleanup/  # Edge function nettoyage preview links
│   │   ├── setup-owner/        # Edge function setup compte owner
│   │   ├── send-email/         # Edge function emails transactionnels (5 types)
│   │   ├── expiry-reminders/   # Edge function cron J-30/15/7 expiration licences
│   │   └── send-push/          # Edge function Web Push notifications
│   └── migrations/            # 30+ fichiers SQL migrations
│       ├── ...
│       ├── 20260415000007_cron_expiry_reminders.sql  # pg_cron daily 08:00
│       ├── 20260415000008_preview_enhancements.sql   # preview_slug + welcome_message
│       └── 20260415000009_push_subscriptions.sql     # Table push_subscriptions
│
├── .env                       # Variables d'env (VITE_SUPABASE_*, VITE_VAPID_PUBLIC_KEY)
├── package.json
├── vite.config.ts             # Vite + VitePWA (Workbox, injectManifest, sw.ts)
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.js
├── playwright.config.ts
└── components.json            # Config shadcn/ui
```

---

## Base de données (Supabase PostgreSQL)

### Tables principales

| Table | Description |
|-------|-------------|
| `users` | Profils utilisateurs (role, plan, agence_id, logo, avatar, tampon_url, signature_url) |
| `user_roles` | Rôles RBAC Supabase (enum: admin/user) |
| `clients` | Clients de l'agence/freelance (+ `preview_slug` TEXT) |
| `client_networks` | Réseaux sociaux par client (instagram, facebook, linkedin, x, tiktok) |
| `posts` | Posts calendrier éditorial |
| `post_templates` | Templates de posts réutilisables |
| `preview_links` | Liens de validation (+ `welcome_message` TEXT) |
| `preview_actions` | Actions des clients sur les previews (valide/refuse) |
| `documents` | Devis et factures |
| `document_lines` | Lignes de facturation |
| `payments` | Paiements reçus sur factures |
| `kpi_reports` | Rapports KPI mensuels par client |
| `depenses` | Dépenses comptables (+ `inclure_facture` BOOLEAN pour boosts) |
| `salaires` | Masse salariale équipe |
| `notifications` | Notifications in-app |
| `activity_logs` | Journal d'activité utilisateur |
| `security_logs` | Logs de sécurité (connexions, tentatives) |
| `plans` | Plans tarifaires (slug, prix, features, promo) |
| `contracts` | Contrats signés numériquement |
| `contract_templates` | Templates de contrats par plan |
| `marketing_emails` | Campagnes email admin |
| `waitlist` | Liste d'attente inscription |
| `changelog` | Entrées changelog publique |
| `site_settings` | Paramètres globaux clé/valeur (billing_sigle, preview_default_period, etc.) |
| `receipt_templates` | Templates reçus de paiement |
| `owner_payments` | Paiements reçus par l'owner |
| `license_keys` | Clés de licence générées (DIGAL-TYPE-6chars) |
| `drop_box_files` | Fichiers déposés par les créateurs |
| `push_subscriptions` | Abonnements Web Push (endpoint, p256dh, auth) |

### Fonctions PostgreSQL

- `has_role(_role, _user_id)` → boolean : vérifie le rôle RBAC
- `expire_preview_links()` → void : nettoyage des liens expirés

### Crons (pg_cron)

- `digal-expiry-reminders` → quotidien 08:00 → edge function `expiry-reminders` → emails J-30/15/7

### Enum

- `app_role` : `admin | user`

---

## Flux d'authentification

```
1. Utilisateur → /login → supabase.auth.signInWithPassword()
2. AuthProvider (useAuth.tsx) écoute onAuthStateChange
3. Fetch user_roles → setUserRole("admin" | "user")
4. AuthGuard vérifie session + role pour chaque route protégée
5. Routes /admin/* → AuthGuard(requiredRole="admin") + AdminTotpGate (TOTP MFA)
   - Si pas de facteur TOTP → enrollment obligatoire (QR code api.qrserver.com)
   - Si facteur existant → vérification code 6 chiffres via challenge+verify
   - Si AAL2 → accès accordé
```

---

## Rôles utilisateurs (users.role)

| Role | Description |
|------|-------------|
| `owner` | Super-admin propriétaire de la plateforme |
| `admin` | Admin plateforme (accès panel /admin/*) |
| `dm` | Directeur Marketing / Chef de projet agence |
| `solo` | Freelance solo (plan Solo) |
| `agence_standard` | Agence plan standard |
| `agence_pro` | Agence plan pro |
| `freemium` | Compte gratuit (2 clients actifs, 3 archivés, 3 templates max) |
| `cm` | Community Manager (membre équipe) |
| `createur` | Créateur de contenu (accès restreint, pas de facturation) |

### Logique d'accès (account-access.ts)

```typescript
PRIVILEGED_ROLES = { "owner", "admin", "dm" }
isPrivileged = role in PRIVILEGED_ROLES
isFreemium = role === "freemium" && !plan
```

### Limites Freemium

| Ressource | Limite |
|-----------|--------|
| Clients actifs | 2 |
| Clients archivés | 3 |
| Modèles de posts | 3 |
| Facturation/Comptabilité/Rapports | ❌ Non accessible |

---

## Flux éditorial (posts)

```
Statuts: idee → en_production → en_attente_validation → valide / refuse → publie

Acteurs:
- DM/CM : crée post, assigne à créateur, valide/refuse upload, envoie preview client
- Créateur : upload média → en_attente_validation
- Client : valide/refuse via preview link public (sans auth)

Emails automatiques:
- Rejet créateur → sendCreatorRejectionEmail
- Expiration preview → sendPreviewExpiredEmail
- Approbation waitlist → sendWaitlistApprovalEmail
```

---

## Preview links

```
Slug: {clientSlug}-{random6} ou random12 (si pas de slug client)
Expiration: configurable par le DM (7/14/30 jours ou date fixe)
Période par défaut: site_settings.preview_default_period (par user)
Welcome message: preview_links.welcome_message (personnalisable)
Page publique: countdown visible + message expiré avec date
```

---

## Facturation (FCFA — contexte sénégalais)

- Types : `devis` | `facture`
- Taxes : TVA configurable + BRS (taxe spécifique Sénégal)
- Méthodes paiement : Wave, YAS, Orange Money, Virement, Cash
- Numérotation : `DEV-SIGLE-2026-0001` / `FAC-SIGLE-2026-0001`
- Conversion devis → facture : copie complète avec lien
- Boost → ligne facture : dépenses `publicite` non facturées → lignes auto (brs_applicable=false)
- Tampon + signature : upload SVG/PNG dans Settings, inclus dans PDF

---

## Licences

- Format clé : `DIGAL-SOLO-XXXXXX` / `DIGAL-STD-XXXXXX` / `DIGAL-PRO-XXXXXX`
- Durée standard : 6 mois
- Extension cumulative : ajoute sur la date d'expiration actuelle (si future)
- Rappels automatiques : J-30, J-15, J-7 via cron + edge function

---

## PWA (Progressive Web App)

- Plugin : `vite-plugin-pwa` (strategy: `injectManifest`)
- Service Worker : `src/sw.ts` (Workbox precaching + Web Push)
- Cache statique : tous assets JS/CSS/HTML/PNG
- Cache API Supabase : NetworkFirst (24h), timeout 5s
- Cache Storage Supabase : CacheFirst (7 jours)
- Web Push : VAPID keys, table `push_subscriptions`, edge function `send-push`
- Opt-in UI : Settings → toggle dans onglet Profil
- Auto-update : `registerSW({ onNeedRefresh: window.location.reload })`

---

## Variables d'environnement requises

```bash
VITE_SUPABASE_URL=https://bfzapmhvgnoicgbngpmi.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon_key>
VITE_VAPID_PUBLIC_KEY=<vapid_public_key>  # Pour Web Push

# Supabase edge functions (secrets)
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
RESEND_API_KEY=<resend_key>
VAPID_PRIVATE_KEY=<vapid_private_key>
VAPID_PUBLIC_KEY=<vapid_public_key>
VAPID_SUBJECT=mailto:contact@digal.sn
```
