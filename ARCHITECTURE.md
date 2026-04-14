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
| Gestionnaire de paquets | bun (lock) / npm | — |

---

## Structure des dossiers

```
digal-app/
├── public/                    # Fichiers statiques (favicon, PWA icons, manifest)
├── src/
│   ├── App.tsx                # Routeur principal, providers globaux
│   ├── main.tsx               # Point d'entrée React
│   ├── index.css              # Variables CSS globales, Tailwind base
│   ├── vite-env.d.ts
│   │
│   ├── assets/                # Images statiques (logo Digal)
│   │
│   ├── components/            # Composants partagés
│   │   ├── ui/                # shadcn/ui (40+ composants Radix)
│   │   ├── admin/             # Composants spécifiques admin
│   │   ├── calendar/          # Composants calendrier éditorial
│   │   ├── clients/           # Composants gestion clients
│   │   ├── comptabilite/      # Composants comptabilité
│   │   ├── contracts/         # Composants signature contrats
│   │   ├── facturation/       # Composants facturation
│   │   ├── kpi/               # Composants rapports KPI
│   │   ├── landing/           # Composants page d'accueil
│   │   └── preview/           # Composants liens preview client
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
│   │   ├── account-access.ts  # Utilitaire rôles/plans
│   │   ├── activity-logs.ts   # Logs d'activité
│   │   ├── clients.ts         # CRUD clients + réseaux
│   │   ├── comptabilite.ts    # CRUD dépenses + salaires
│   │   ├── creator-workflow.ts # Workflow créateur/CM
│   │   ├── facturation.ts     # CRUD documents + paiements
│   │   ├── facturation-pdf.ts # Génération PDF factures/devis
│   │   ├── kpi-pdf.ts         # Génération PDF rapports KPI
│   │   ├── kpi-reports.ts     # CRUD rapports KPI
│   │   ├── notifications.ts   # CRUD notifications
│   │   ├── posts.ts           # CRUD posts calendrier
│   │   ├── preview-links.ts   # CRUD liens preview client
│   │   └── utils.ts           # cn(), formatters
│   │
│   ├── pages/                 # Pages React Router
│   │   ├── LandingPage.tsx
│   │   ├── Login.tsx / Register.tsx / Waitlist.tsx / ResetPassword.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Clients.tsx / ClientDetail.tsx
│   │   ├── CalendarPage.tsx
│   │   ├── KpiReportsPage.tsx
│   │   ├── Facturation.tsx
│   │   ├── Comptabilite.tsx
│   │   ├── CreatorDashboard.tsx
│   │   ├── TeamJournal.tsx
│   │   ├── Journal.tsx
│   │   ├── Settings.tsx
│   │   ├── Changelog.tsx / DocsPage.tsx
│   │   ├── PreviewPage.tsx    # Public (sans auth)
│   │   └── admin/
│   │       ├── AdminDashboard.tsx
│   │       ├── AdminComptes.tsx
│   │       ├── AdminLicences.tsx
│   │       ├── AdminWaitlist.tsx
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
│       ├── setup.ts           # Config Testing Library
│       └── example.test.ts    # Test trivial placeholder
│
├── supabase/
│   ├── config.toml            # Config projet Supabase local
│   ├── functions/
│   │   ├── scheduled-cleanup/  # Edge function nettoyage preview links
│   │   └── setup-owner/        # Edge function setup compte owner
│   └── migrations/            # 30+ fichiers SQL migrations
│
├── .env                       # Variables d'env (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY)
├── package.json
├── vite.config.ts (implicite)
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
| `users` | Profils utilisateurs (role, plan, agence_id, logo, avatar) |
| `user_roles` | Rôles RBAC Supabase (enum: admin/user) |
| `clients` | Clients de l'agence/freelance |
| `client_networks` | Réseaux sociaux par client (instagram, facebook, linkedin, x, tiktok) |
| `posts` | Posts calendrier éditorial |
| `post_templates` | Templates de posts réutilisables |
| `preview_links` | Liens de validation envoyés aux clients |
| `preview_actions` | Actions des clients sur les previews (valide/refuse) |
| `documents` | Devis et factures |
| `document_lines` | Lignes de facturation |
| `payments` | Paiements reçus sur factures |
| `kpi_reports` | Rapports KPI mensuels par client |
| `depenses` | Dépenses comptables |
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
| `site_settings` | Paramètres globaux clé/valeur |
| `receipt_templates` | Templates reçus de paiement |
| `owner_payments` | Paiements reçus par l'owner |

### Fonctions PostgreSQL

- `has_role(_role, _user_id)` → boolean : vérifie le rôle RBAC
- `expire_preview_links()` → void : nettoyage des liens expirés

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
   - Si pas de facteur TOTP → enrollment obligatoire
   - Si facteur existant → vérification code 6 chiffres
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
| `freemium` | Compte gratuit (2 clients max, fonctionnalités limitées) |

### Logique d'accès (account-access.ts)

```typescript
PRIVILEGED_ROLES = { "owner", "admin", "dm" }
isPrivileged = role in PRIVILEGED_ROLES
isFreemium = role === "freemium" && !plan
```

---

## Flux éditorial (posts)

```
Statuts: idee → en_production → en_attente_validation → valide / refuse → publie

Acteurs:
- DM/CM : crée post, assigne à créateur, valide/refuse upload, envoie preview client
- Créateur : upload média → en_attente_validation
- Client : valide/refuse via preview link public (sans auth)
```

---

## Facturation (FCFA — contexte sénégalais)

- Types : `devis` | `facture`
- Taxes : TVA configurable + BRS (taxe spécifique Sénégal)
- Méthodes paiement : Wave, YAS, Orange Money, Virement, Cash
- Numérotation : `DEV-2026-001` / `FAC-2026-001`
- Conversion devis → facture : copie complète avec lien

---

## Variables d'environnement requises

```bash
VITE_SUPABASE_URL=https://bfzapmhvgnoicgbngpmi.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon_key>
```
