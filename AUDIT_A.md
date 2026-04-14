# AUDIT_A.md — Sections 1 à 5
_Date : 2026-04-14 — Prompt 05-A — Lecture seule, aucune modification_

---

### Section 1 — Vision & Positionnement
- **Statut :** ✅
- **%** : 100%
- **Fait :**
  - Pas de publication automatique (conforme — Digal gère l'avant-publication)
  - 5 réseaux supportés : Instagram, Facebook, LinkedIn, X, TikTok (code + CDC alignés)
  - Marché sénégalais : FCFA, BRS, Wave/OM, contexte CM — conforme
  - Positionnement "outil de planification + validation + facturation" respecté dans toute l'architecture
- **Manque :** _Rien_ — section descriptive, aucune implémentation requise

---

### Section 2 — Structure des comptes & Pricing
- **Statut :** ⚠️
- **%** : 65%
- **Fait :**
  - ✅ Plans : Freemium, Solo, Agence Standard/Pro gérés via `plans` table + AdminPlans
  - ✅ Freemium : limite 2 clients actifs enforced (`Clients.tsx`, `getAccountAccess()`)
  - ✅ Freemium : Facturation / Comptabilité / KPI verrouillés dans sidebar (Lock + badge "PRO")
  - ✅ `ProUpgradeModal` affiché au clic sur item verrouillé
  - ✅ Filigrane "Créé avec Digal" affiché en freemium sur `PreviewPage.tsx` (ligne 647)
  - ✅ Prix dynamiques depuis Supabase (PricingSection + promo_active/promo_prix)
- **Manque :**
  - ❌ Limite archivage freemium : "blocage après 3 archives" — aucun comptage d'archives
  - ❌ Limite 3 modèles de posts pour freemium — non enforced (Templates tab sans restriction)
  - ❌ Factures de licence PDF par compte (0 FCFA freemium / montant réel sinon) — absent
  - ❌ UI upgrade Solo → Agence (différentiel au prorata) — bouton "Passer en Agence" = toast.info uniquement
  - ❌ Formulaire in-app demande d'upgrade équipe (nbr membres + message → Owner) — absent
  - ❌ Plan "Agence Sur-mesure" non représenté

---

### Section 3 — Landing Page
- **Statut :** ⚠️
- **%** : 80%
- **Fait :**
  - ✅ Header : logo + "Rejoindre la liste" CTA + lien Se connecter
  - ✅ HeroSection : countdown dynamique (`useCountdown` → `site_settings.launch_date`), flag `isLaunched`
  - ✅ Sections : MarqueeBanner, ProblemSection, SolutionSection, PricingSection (4 plans), CtaSection
  - ✅ LandingFooter : liens CGU + Contact
  - ✅ Page Waitlist (`/waitlist`) avec formulaire d'inscription
  - ✅ PricingSection connectée à Supabase (plans dynamiques, promo activable)
- **Manque :**
  - ❌ Section "Aperçu visuel" (screenshots ou mockups de l'app) — absente de `LandingPage.tsx`
  - ❌ "Politique de confidentialité" manquante dans le footer (CDC §3.1 point 7)
  - ⚠️ Waitlist : champ "Type de compte souhaité (Solo / Agence)" — à vérifier dans `Waitlist.tsx`
  - ⚠️ Countdown "Digal est lancé — rejoignez-nous" au zéro — `isLaunched` existe, texte à vérifier

---

### Section 4 — Dashboard Owner (/admin)
- **Statut :** ⚠️
- **%** : 70%
- **Fait :**
  - ✅ 2FA TOTP obligatoire (`AdminTotpGate`) — enrollment + vérification + AAL2
  - ✅ Dashboard KPIs : MRR, Solo actifs, Agence actifs, licences ce mois, expirant J+30, total comptes, freemium, taux conversion (8 widgets, CDC en demande 7)
  - ✅ `AdminComptes` : liste avec filtre rôle, modal détail (clients, posts, docs, dernière activité)
  - ✅ `AdminLicences` : liste licences + export CSV licences + bouton "Activer licence" (set role + expiration)
  - ✅ `AdminEmails` : campagnes email avec templates
  - ✅ `AdminWaitlist` : gestion liste d'attente avec approbation
  - ✅ `AdminSecurity` : logs de sécurité
  - ✅ `AdminFacturation` : suivi paiements owner
  - ✅ `AdminGuides` + `AdminDocumentation`
- **Manque :**
  - ❌ Format clé DIGAL-[TYPE]-[6 chars] — AdminLicences écrit directement `role` + `licence_expiration`, aucune clé générée
  - ❌ Clé promotionnelle avec réduction % — absent
  - ❌ Export CSV comptes (AdminComptes) — bouton absent (seulement dans AdminLicences)
  - ❌ Tableau comptes triable par CA / activité / nb clients
  - ❌ Onglet "Financier" dans détail compte (CA facturé, encaissé, dépenses — lecture seule)
  - ❌ Envoi message direct à un utilisateur (email) depuis AdminComptes
  - ❌ Alertes automatiques comportement suspect (10 tentatives / 5 min)
  - ❌ Historique complet des activations de licence par compte
  - ❌ Prolongation manuelle d'une licence sans clé — non implémenté (seul update date direct)
  - ⚠️ Configuration date countdown depuis admin — `site_settings` existe, UI admin pour le modifier non trouvée

---

### Section 5 — Authentification & Licences
- **Statut :** ⚠️
- **%** : 50%
- **Fait :**
  - ✅ Inscription email/mdp + confirmation email (Supabase Auth)
  - ✅ Accès immédiat Freemium après confirmation
  - ✅ Connexion email/mdp + réinitialisation mdp (`/reset-password`)
  - ✅ `AuthGuard` protection routes (session + rôle requis)
  - ✅ Admin TOTP 2FA (`AdminTotpGate`) — enrollment QR + code 6 chiffres + AAL2
  - ✅ Rate limiting login : 5 tentatives → blocage 15 min (`Login.tsx`)
  - ✅ `manifest.json` PWA (name, icons, display:standalone, lang:fr)
  - ✅ Settings → Licence : affiche plan actuel + date d'expiration depuis DB
- **Manque :**
  - ❌ Choix type de compte (Solo / Agence) à l'inscription — `Register.tsx` sans ce champ
  - ❌ Option "Se souvenir de moi" dans `Login.tsx`
  - ❌ Champ saisie clé de licence dans Settings — bouton "Ajouter une licence" = `toast.info("Demande envoyée à l'administrateur")` uniquement
  - ❌ Validation instantanée d'une clé DIGAL-SOLO-XXXXX — aucune logique de parsing/validation
  - ❌ Extension cumulative (nouvelle clé ajoute la durée à l'expiration actuelle)
  - ❌ Génération automatique facture Digal à l'activation
  - ❌ Notifications J-30 / J-15 / J-7 avant expiration — aucune edge function / cron pour cela
  - ❌ Pop-up à chaque connexion si licence expirée/expirant + bouton "Renouveler"
  - ❌ Retour automatique Freemium à l'expiration — aucun job planifié
  - ❌ Service Worker — absent du projet (pas de `sw.ts`, pas de Workbox)
  - ❌ Notifications push (Web Push API)
  - ❌ Mode offline partiel (lecture calendrier sans connexion)
  - ❌ Background sync

---

## Résumé sections 1–5

| Section | Statut | % |
|---------|--------|---|
| 1 — Vision & Positionnement | ✅ | 100% |
| 2 — Structure des comptes & Pricing | ⚠️ | 65% |
| 3 — Landing Page | ⚠️ | 80% |
| 4 — Dashboard Owner | ⚠️ | 70% |
| 5 — Authentification & Licences | ⚠️ | 50% |

**Moyenne sections 1–5 : 73%**
