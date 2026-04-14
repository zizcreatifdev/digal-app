# CHANGELOG — Digal

## [1.0.0] — 2026-04-14

### Première version de production

---

### Fonctionnalités principales

#### Gestion clients
- Création, modification et archivage de clients avec réseaux sociaux associés
- Slug client modifiable par le DM (utilisé pour les liens preview)
- Limites Freemium : 2 clients actifs, 3 archivés

#### Calendrier éditorial
- Calendrier mensuel avec drag & drop par réseau social
- Filtres par réseau, statut, et membre
- Flux de validation multi-acteurs : DM → Créateur → CM → Client
- Workflow créateur avec upload média et drop-box
- Notifications in-app pour chaque changement de statut

#### Liens de prévisualisation client
- Génération de liens publics (sans auth) avec période configurable
- Slug personnalisé : `{clientSlug}-{random6}`
- Message d'accueil personnalisable par le CM
- Période par défaut configurable dans les Paramètres
- Countdown visible ("Ce lien expire dans X heures")
- Page expirée avec date d'expiration affichée
- Onglets réseaux scrollables horizontalement sur mobile

#### Facturation (FCFA — Sénégal)
- Création de devis et factures avec numérotation automatique (`FAC-SIGLE-YYYY-0001`)
- Support TVA + BRS (Bordereau de Retenue à la Source)
- Méthodes de paiement : Wave, YAS, Orange Money, Virement, Cash
- Conversion devis → facture en un clic
- Export PDF avec tampon et signature numérique
- Intégration boosts publicitaires → lignes de facture automatiques
- ProUpgradeModal avec mockups interactifs (Facturation, Comptabilité, Rapports KPI)

#### Comptabilité
- Suivi des dépenses par catégorie et client
- Masse salariale de l'équipe par mois
- Boosts publicitaires marqués comme inclus dans une facture
- Rapports KPI mensuels par client

#### Équipe
- Gestion des membres (CM, Créateurs)
- Journal de l'équipe avec activité récente

#### Paramètres
- Profil utilisateur (avatar, logo agence, couleur de marque)
- Paramètres de facturation (sigle, TVA/BRS, mentions, méthodes)
- Tampon et signature numérique (upload SVG/PNG)
- Gestion des modèles de posts (limite 3 en Freemium)
- Période de preview par défaut
- Notifications push Web (opt-in)

---

### Administration (/admin/*)

- Tableau de bord global (métriques plateforme)
- Gestion des comptes utilisateurs avec onglet **Financier** (CA, dépenses, masse salariale) + Export CSV
- Gestion des licences : génération clé `DIGAL-TYPE-XXXXXX`, activation directe, extension cumulative
- File d'attente (waitlist) avec approbation par email automatique
- Campagnes email marketing
- Gestion des plans tarifaires
- Contrats et templates
- Guides et documentation
- Sécurité (logs, tentatives)
- **2FA TOTP obligatoire** sur toutes les routes `/admin/*` via `AdminTotpGate` (enrollment QR + vérification)

---

### Emails automatiques (Resend)

| Type | Déclencheur |
|------|-------------|
| `bienvenue` | Inscription validée |
| `expiration_licence` | J-30, J-15, J-7 (cron pg_cron) |
| `preview_expire` | Expiration lien de prévisualisation |
| `rejet_createur` | Rejet d'un upload créateur |
| `waitlist_approuve` | Approbation depuis AdminWaitlist |

---

### Pages publiques

- **Landing page** : sections hero, solution, mockups (4 features animées), tarifs, CTA
- **Countdown de lancement** : configurable via `site_settings`
- **Page /cgu** : Conditions Générales d'Utilisation (droit sénégalais)
- **Page /privacy** : Politique de Confidentialité (Loi n°2008-12)
- **Changelog** : liste des mises à jour publiques

---

### PWA & Performance

- Progressive Web App installable (manifest + Service Worker Workbox)
- Cache statique des assets (JS, CSS, PNG)
- Cache API Supabase : NetworkFirst (24h, timeout 5s)
- Cache Storage Supabase : CacheFirst (7 jours)
- Web Push notifications (VAPID) : opt-in dans Paramètres
- Auto-update en arrière-plan

---

### Infrastructure technique

- **Supabase** : PostgreSQL + Auth + Storage + Edge Functions + pg_cron
- **Edge Functions** : `send-email`, `expiry-reminders`, `send-push`, `scheduled-cleanup`, `setup-owner`
- **Migrations** : 30+ fichiers SQL gérés via Supabase CLI
- **RLS** : Row Level Security sur toutes les tables
- **TypeScript** : 0 erreur, types Supabase auto-générés

---

### Tests

- 137 tests unitaires passent (Vitest)
- 10 fichiers de test couvrant : facturation, account-access, KPI, preview-links, licences, routes, documents, freemium-limits, boost-facture
- 0 erreur ESLint
