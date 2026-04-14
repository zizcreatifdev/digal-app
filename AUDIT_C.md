# AUDIT_C.md — Sections 11 à 17
_Date : 2026-04-14 — Prompt 05-C — Lecture seule, aucune modification_

---

### Section 11 — Lien de prévisualisation client
- **Statut :** ⚠️
- **%** : 65%
- **Fait :**
  - ✅ Slug unique (12 chars), page publique `/preview/:slug` sans auth
  - ✅ Double logo en header : logo CM/agence + logo client côte à côte (`PreviewPage.tsx` ligne 318/327)
  - ✅ Période affichée (date_debut → date_fin) + filtre par réseau
  - ✅ `NetworkMockup` : aperçu mockup par réseau par post
  - ✅ Validation / refus par post avec commentaire obligatoire (textarea inline sur refus)
  - ✅ "Tout valider" + "Tout refuser" avec commentaire global
  - ✅ "Envoyer mes retours au CM" (quand tous les posts sont reviewés) — équivalent fonctionnel du "Terminer"
  - ✅ Barre de progression (% validés) en sticky header
  - ✅ Expiration 48h enforced (check `statut !== "actif"` + `expires_at < now`)
  - ✅ Filigrane "Créé avec Digal" pour les comptes freemium (ligne 647)
  - ✅ Edge function `scheduled-cleanup` expire les liens après 48h
- **Manque :**
  - ❌ **URL format** : code = `/preview/:slug`, CDC §11.2 = `/preview/[slug-client]/[période]`
  - ❌ **Slug modifiable par le DM** — auto-généré, aucun champ pour le personnaliser
  - ❌ **Édition inline du texte** par le client (modifier la légende directement)
  - ❌ **Countdown "Ce lien expire dans X heures"** — aucun timer visible sur la page
  - ❌ **Bannière de couverture agence** en en-tête (CDC §11.3 : bannière pleine largeur)
  - ❌ **Message d'accueil personnalisable** par le CM
  - ❌ **Historique des versions** (corrections après refus, horodatage décisions) — CDC §11.5
  - ❌ CM notifié si lien expire sans réponse — `scheduled-cleanup` expire mais n'appelle pas `createNotification`

---

### Section 12 — Rapports KPI mensuels PDF
- **Statut :** ⚠️
- **%** : 70%
- **Fait :**
  - ✅ Création rapport par client, par mois (select mensuel dans `CreateKpiReportModal`)
  - ✅ 5 réseaux avec métriques configurées (`NETWORK_METRICS_CONFIG` dans `lib/kpi-reports.ts`)
  - ✅ Champs : points_forts, axes_amelioration, objectifs
  - ✅ Règle "champ vide = invisible" — enforced par `hasMetrics()` + `getFilledMetrics()`
  - ✅ Export PDF (`kpi-pdf.ts`) — logo client + logo agence + période en en-tête
  - ✅ Historique des rapports par client, trié par mois
  - ✅ Comparaison avec mois précédent dans le modal de création
- **Manque :**
  - ❌ **Période trimestrielle** — uniquement mensuel implémenté, pas de trimestriel ni custom (date début + date fin)
  - ❌ **Métriques Instagram incomplètes** — code a : `abonnes, portee, impressions, engagement, reach_stories, vues_reels` ; CDC ajoute : Likes, Commentaires, Partages
  - ❌ **Métriques Facebook incomplètes** — code a : `fans, portee, engagement, clics` ; CDC ajoute : Abonnés, Likes, Commentaires, Partages, Impressions (engagement ≠ likes)
  - ❌ **Métriques LinkedIn incomplètes** — CDC ajoute : Réactions, Commentaires, Partages
  - ❌ **Métriques X incomplètes** — CDC ajoute : Retweets, Réponses
  - ❌ Nb de posts publiés ce mois par réseau dans le PDF — non trouvé dans `kpi-pdf.ts`
  - ⚠️ CM en agence peut générer rapports — CDC §12.1 réserve cela au DM + CM Solo

---

### Section 13 — Facturation
- **Statut :** ⚠️
- **%** : 65%
- **Fait :**
  - ✅ Devis + Factures (deux types de `documents`)
  - ✅ 7 statuts : brouillon, envoye, paye, partiellement_paye, en_retard, annule, archive
  - ✅ Lignes avec BRS par ligne + TVA globale — `calculateTotals()` testé (14 tests)
  - ✅ Méthodes paiement : Wave, YAS, Orange Money, Virement, Cash
  - ✅ Conversion devis → facture (`converted_from_id`)
  - ✅ Suivi paiements (`payments` table)
  - ✅ PDF génération (`facturation-pdf.ts`)
  - ✅ Settings facturation : sigle, BRS on/off, TVA on/off, header/footer texte, méthodes paiement
  - ✅ Numérotation auto avec reset annuel (`generateNumero` compte les docs de l'année en cours)
- **Manque :**
  - ❌ **SIGLE absent de la numérotation** — `generateNumero()` génère `DEV-2026-001`, CDC requiert `DEV-[SIGLE]-2026-0001`. Le sigle est saisi en Settings mais **non utilisé** dans `generateNumero()`
  - ❌ **Remise** (% ou montant fixe, optionnel) — absente du schéma `DocumentLine` et `Document`
  - ❌ **Tampon** (stamp PNG transparent) — absent de Settings BillingTab et du PDF
  - ❌ **Signature** (image PNG transparent) — absent de Settings et du PDF
  - ❌ **NINEA / RC** champ dans Settings facturation
  - ❌ Création rapide client (nom + email uniquement) depuis Facturation
  - ❌ Ligne Boost auto-pré-remplie depuis une dépense Comptabilité
  - ❌ Statut "Irrécouvrable" (CDC §13.7 + §8.5) — non implémenté
  - ❌ Conditions de paiement (texte libre) — absent du modal de création

---

### Section 14 — Comptabilité
- **Statut :** ⚠️
- **%** : 65%
- **Fait :**
  - ✅ Dashboard financier mensuel : revenus, charges, résultat, graphique Recharts (`DashboardFinancier`)
  - ✅ Sélecteur de mois (12 mois en arrière)
  - ✅ Comparaison mois précédent
  - ✅ Dépenses CRUD (`DepensesSection`) avec upload pièce jointe
  - ✅ Masse salariale (`MasseSalarialeSection`) — liste membres avec salaire + statut payé/non payé
  - ✅ Revenus (`RevenusSection`) — factures par statut + total encaissé
- **Manque :**
  - ❌ **Export CSV** — aucun bouton d'export dans les composants comptabilité
  - ❌ **Dépense Boost** : catégorie dédiée avec réseau (Facebook Ads, Instagram Ads, LinkedIn Ads, TikTok Ads, X Ads) + **affectation client obligatoire** — non implémenté
  - ❌ **Boost → ligne facture auto** : dépense Boost affectée à un client apparaît en ligne optionnelle sur la prochaine facture — absent
  - ⚠️ Catégories de dépenses prédéfinies (Loyer, Abonnements, Fournitures, Boost, Autres) — à vérifier si `DepensesSection` les a toutes

---

### Section 15 — Journal d'activité & Notifications
- **Statut :** ⚠️
- **%** : 70%
- **Fait :**
  - ✅ Journal d'activité (`Journal.tsx`) : filtres type + date, table horodatée, 200 entrées
  - ✅ Types tracés : auth, post, client, preview, document, kpi, parametre, autre
  - ✅ `NotificationPanel` : cloche + badge compteur non-lus + panneau latéral
  - ✅ Realtime via `postgres_changes` Supabase (channel `notifications-realtime`)
  - ✅ Marquer lu (individuel + tout marquer)
  - ✅ `createNotification()` appelé pour : upload créateur → CM, validation → créateur, rejet → créateur
  - ✅ Lien cliquable depuis notification (`lien` field)
  - ✅ Settings → onglet Notifications : toggles pour 10 types dont `push_pwa`
- **Manque :**
  - ❌ **Emails automatisés** : bienvenue, expiration J-30/J-15/J-7, relance freemium — aucun service email (Resend/Brevo) configuré
  - ❌ **Notification expiration lien sans réponse** — `scheduled-cleanup` expire mais n'insère pas de notification
  - ❌ **Rappel publication J-1** — toggle UI existe, aucun cron/trigger réel
  - ❌ **Membre non payé fin de mois** — toggle UI existe, aucun trigger automatique
  - ❌ Suppression notifications après 30 jours — aucun job de nettoyage
  - ❌ Notifications push PWA (`push_pwa`) — toggle présent, Web Push API non implémentée

---

### Section 16 — Paramètres
- **Statut :** ⚠️
- **%** : 65%
- **Fait :**
  - ✅ Onglet Profil : avatar, prénom/nom, email, logo, couleur_marque, agence_nom, reset mdp
  - ✅ Onglet Facturation : sigle, BRS on/off, TVA on/off, header/footer texte, méthodes paiement (toggle par méthode)
  - ✅ Onglet Équipe : inviter (email + rôle CM/Créateur), lister membres, supprimer membre
  - ✅ Onglet Modèles : CRUD templates de posts (titre, texte, réseau, format)
  - ✅ Onglet Licence : plan actuel + date expiration depuis DB
  - ✅ Onglet Notifications : 10 toggles (validation client, refus, upload, tâche, fichier validé/rejeté, lien expiré, membre non payé, rappel publication, push PWA)
- **Manque :**
  - ❌ **Tampon** (PNG transparent) upload dans l'onglet Facturation — absent
  - ❌ **Signature** (PNG transparent) upload dans l'onglet Facturation — absent
  - ❌ **Bannière de couverture** upload dans l'onglet Profil — visible sur preview + onboarding client
  - ❌ **Champ saisie clé de licence** — bouton "Ajouter une licence" = `toast.info("Demande envoyée")` uniquement
  - ❌ **Historique licences activées** — "Aucun historique disponible" hardcodé
  - ❌ **Téléchargement factures Digal PDF** — absent
  - ❌ **Salaire par membre** défini dans l'onglet Équipe (visible DM uniquement) — non implémenté
  - ❌ **Configuration période par défaut preview** (semaine / mois) — CDC §16.4, absent
  - ❌ NINEA / RC dans l'onglet Facturation

---

### Section 17 — Architecture technique
- **Statut :** ⚠️
- **%** : 70%
- **Fait :**
  - ✅ Stack : React 18 + Vite + TypeScript + Tailwind + shadcn/ui (vs Next.js recommandé — acceptable)
  - ✅ Supabase : PostgreSQL + Auth + Storage + Realtime — conforme
  - ✅ **Lucide Icons exclusivement** — conforme CDC §17.0
  - ✅ JWT Auth Supabase + RLS activé sur les tables (17/30 migrations contiennent ENABLE ROW LEVEL SECURITY)
  - ✅ TOTP 2FA Owner (`AdminTotpGate`)
  - ✅ Rate limiting login (5 tentatives, lockout 15 min)
  - ✅ Logs de sécurité (`security_logs` table, `AdminSecurity`)
  - ✅ `manifest.json` : name, icons 192/512, display:standalone, lang:fr, categories:business
  - ✅ **Stockage éphémère — les 2 règles implémentées** dans `scheduled-cleanup` :
    - Liens preview expirés après 48h (update statut → "expire")
    - Médias posts publiés supprimés J+1 depuis Supabase Storage
  - ✅ Route `/docs/:type` existe (`DocsPage.tsx`)
  - ✅ Route `/changelog` existe
  - ✅ 30 migrations SQL (schéma complet)
- **Manque :**
  - ❌ **Service Worker** — absent (pas de `sw.ts`, pas de Workbox, pas de registration dans `main.tsx`)
  - ❌ **Mode offline** — aucun cache des assets/données calendrier
  - ❌ **Push notifications Web Push API** — toggle dans Settings mais non implémenté
  - ❌ **Background sync** — non implémenté
  - ❌ **Compression fichiers** : aucun FFmpeg/Sharp — les uploads vont directement dans Supabase Storage sans compression
  - ❌ **Service email** (Resend/Brevo) — non intégré, aucune edge function pour emails transactionnels
  - ⚠️ URL preview : `/preview/:slug` au lieu de `/preview/[slug]/[période]` (CDC §17.2)
  - ⚠️ URL clients : `/dashboard/clients/:id` au lieu de `/clients/[id]` (CDC §17.2)
  - ⚠️ `scheduled-cleanup` : pas de cron configuré dans `supabase/config.toml` (fonction existe mais déclenchement non visible)

---

## Résumé sections 11–17

| Section | Statut | % |
|---------|--------|---|
| 11 — Preview client | ⚠️ | 65% |
| 12 — Rapports KPI | ⚠️ | 70% |
| 13 — Facturation | ⚠️ | 65% |
| 14 — Comptabilité | ⚠️ | 65% |
| 15 — Journal & Notifications | ⚠️ | 70% |
| 16 — Paramètres | ⚠️ | 65% |
| 17 — Architecture | ⚠️ | 70% |

**Moyenne sections 11–17 : 67%**

### Points bloquants identifiés
1. **SIGLE absent de `generateNumero()`** (§13) — setting saisi mais non utilisé dans la numérotation
2. **Service Worker absent** (§17) — PWA non installable réellement, offline impossible
3. **Tampon + Signature** (§13/§16) — uploads manquants en Settings et non appliqués dans PDF
4. **Boost → auto-line facture** (§14) — chaîne comptabilité/facturation non reliée
5. **Email service absent** (§15/§17) — aucun Resend/Brevo, zéro email transactionnel automatisé
