# Audit UX/UI — Partie 4 : Comptabilité · KPI · Journal · Parrainages · Paramètres · Admin

---

### Comptabilité (`src/pages/Comptabilite.tsx`)
✅ Tabs Dashboard / Revenus / Dépenses / Masse salariale — séparation claire des vues financières
✅ Export CSV via papaparse avec bouton dédié — action directe sans navigation
✅ Spinner Loader2 centré pendant le chargement (fix partie 3 appliqué)

⚠️ `fetchDocuments(user.id)` appelé 2× à l'identique (lignes 63 et 66) pour `documents` et `documentsPrev` — même data, appel redondant
⚠️ Sélecteur de mois limité aux 12 derniers mois — pas d'accès à l'historique antérieur
⚠️ `prevMois` recalculé via `getPrevMonth()` à chaque render sans `useMemo`

❌ `Promise.all` ligne 63 sans gestion d'erreur UI — si un seul appel échoue, tout le dashboard reste vide sans feedback
❌ Comparaison mois précédent pour les revenus compare les mêmes données (`fetchDocuments` sans filtre par mois)

---

### Rapports KPI (`src/pages/KpiReportsPage.tsx`)
✅ Loader2 avant le sélecteur client (fix partie 3) — états cohérents avec les autres pages
✅ Aperçu PDF + téléchargement direct sans re-génération — expérience fluide
✅ Historique des rapports par mois avec label formaté via `formatMoisLabel`

⚠️ `refreshReports` hors `useCallback` — warning ESLint `react-hooks/exhaustive-deps` persistant (ligne 60)
⚠️ `activeNetworks={[]}` passé vide à `CreateKpiReportModal` (ligne 181) — les réseaux actifs du client ne sont pas transmis au formulaire KPI
⚠️ Pas de recherche dans le sélecteur de client — difficile à utiliser avec 10+ clients

❌ Aucune gestion d'erreur si la query `kpi_reports` échoue — liste silencieusement vide
❌ Pas de confirmation avant suppression d'un rapport (si la fonctionnalité existe ou est ajoutée)

---

### Journal d'activité (`src/pages/Journal.tsx`)
✅ Filtres combinables type d'action + plage de dates — recherche flexible
✅ Device / Navigateur / Localisation / IP affichés avec icônes — audit visuel riche
✅ Flag emoji pays via `countryFlag()` — UX soignée sans dépendance externe

⚠️ Aucune pagination — tous les logs chargés en une seule requête, lent avec beaucoup d'activité
⚠️ Colonne IP affichée en clair — donnée sensible sans masquage partiel ni avertissement RGPD
⚠️ Filtre `typeAction = "all"` récupère tout côté DB mais l'interface ne le signale pas

❌ Aucune gestion d'erreur si `fetchActivityLogs` échoue — liste silencieusement vide sans toast
❌ Pas d'export CSV du journal — manquant pour les audits de sécurité

---

### Parrainages (`src/pages/Parrainages.tsx`)
✅ Partage WhatsApp + copie lien en un clic — friction zéro pour inviter
✅ Barre de progression filleuls / quota avec pourcentage — gamification claire
✅ Historique filleuls avec badges statuts sémantiques (`bg-success/10`, `bg-warning/10`)

⚠️ `text-emerald-600` lignes 297/326 et `text-blue-600` ligne 331 — couleurs hardcodées non sémantiques
⚠️ Pas de feedback visuel si la demande de quota est déjà en cours d'examen côté admin
⚠️ Pas de skeleton loader — les cartes apparaissent brusquement après le spinner

❌ `onError` de `requestQuota.mutate` silencieux si Supabase échoue — l'utilisateur ne sait pas que sa demande n'est pas passée
❌ `navigator.clipboard` utilisé sans fallback — échoue silencieusement sur HTTP ou anciens navigateurs

---

### Paramètres (`src/pages/Settings.tsx`)
✅ 7 onglets bien organisés (Profil / Équipe / Licence / Tampon / Modèles / Notifications / Aperçu)
✅ ImageCropModal 1:1 + compression auto pour le logo — upload contrôlé et optimisé
✅ Deep-link `?tab=licence` fonctionnel — navigable depuis d'autres pages

⚠️ `bg-purple-100 text-purple-700` lignes 466-467 pour les badges rôles équipe (Studio/Elite) — hardcodé, non thémable
⚠️ Aucune validation format email avant soumission du formulaire d'invitation (`handleInvite`)
⚠️ `bg-checkerboard` utilisé (ligne 515) — classe CSS personnalisée qui peut être absente du build

❌ Chargement initial de `users` sans gestion d'erreur — si la query échoue, le formulaire profil reste vide silencieusement
❌ `void handleInvite()` ligne 752 — anti-pattern, les erreurs async sont ignorées sans catch

---

### Dashboard Admin (`src/pages/admin/AdminDashboard.tsx`)
✅ KPI MRR / comptes / alertes avec 3 niveaux de priorité (urgent / attention / info) — vue opérationnelle
✅ Widget waitlist avec copie contact inline — workflow sans navigation
✅ Spinners Loader2 sur chaque section indépendante

⚠️ `console.warn("[waitlist] Token creation failed:", ...)` ligne 308 — warning visible en production
⚠️ Dots de priorité hardcodés : `bg-red-500`, `bg-orange-500`, `bg-yellow-500`, `bg-blue-500`
⚠️ Tableau alertes sans scroll horizontal — overflow sur petits écrans

❌ Aucun état d'erreur pour le widget "santé" — silencieusement vide si la requête échoue
❌ Clé React d'alerte composite `${userId}-${priority}-${i}` — fragile, peut causer des problèmes de reconciliation

---

### AdminComptes (`src/pages/admin/AdminComptes.tsx`)
✅ Fiche compte 360° : avatar + stats mois + onglets Aperçu / Actions — vue complète
✅ Zone dangereuse avec `AlertDialog` de confirmation pour suspend/suppression
✅ Export CSV des comptes avec filtres appliqués

⚠️ `bg-purple-100 text-purple-700` lignes 466-467 pour les rôles `agence_standard` / `agence_pro` — hardcodé
⚠️ Recherche par email uniquement — pas de recherche par nom ou par plan
⚠️ Formulaire création compte multi-étapes sans indicateur de progression visuel

❌ `Promise.all` ligne 375 charge tous les détails sans gestion d'erreur individuelle — un échec partiel vide tout le panneau
❌ `console.warn` résiduel ligne 308 (partagé avec AdminWaitlist via import) — visible en production

---

### AdminWaitlist (`src/pages/admin/AdminWaitlist.tsx`)
✅ Onglets liste d'attente / demandes Elite — workflows séparés clairement
✅ Copie message d'activation avec variables substituées ([Prénom] [Plan] [Durée] [Lien])
✅ Badges statuts sémantiques après Fix 4

⚠️ `console.warn("[waitlist] Token creation failed:", ...)` ligne 308 — même warning production que AdminDashboard
⚠️ Sélecteur de durée affiché seulement si un token valide existe — logique confuse pour l'administrateur
⚠️ Textarea message préchargé sans indicateur de chargement — apparaît vide puis se remplit

❌ `navigator.clipboard` sans fallback — copie silencieusement ratée sur HTTP ou anciens navigateurs
❌ Table 8 colonnes sans `overflow-x-auto` explicite — overflow garanti sur mobile

---

### AdminPlans (`src/pages/admin/AdminPlans.tsx`)
✅ CRUD complet : plans + configurations tarifaires (durées, prix, toggle actif/populaire)
✅ Toggle "Illimité" pour `max_membres` avec rendu conditionnel distinct
✅ État vide explicite "Aucune configuration" avec CTA

⚠️ `text-emerald-600` ligne 463 pour les checkmarks — couleur hardcodée (devrait être `text-success`)
⚠️ Pas de confirmation avant suppression d'une configuration tarifaire — action irréversible sans garde-fou
⚠️ Prix et durée sans validation min/max explicite dans l'UI (accepte 0 ou négatif)

❌ Features du plan stockées comme JSON mais affichées sans parsing — expérience de lecture dégradée
❌ Toggles `actif`/`populaire` sans feedback d'erreur réseau — état UI et DB peuvent diverger

---

### AdminLicences (`src/pages/admin/AdminLicences.tsx`)
✅ Génération, activation et prolongation de clés centralisées sur une page
✅ Badges Actif / Expiré sémantiques après Fix 4
✅ Rappels automatiques J-30/J-15/J-7 via cron — proactivité sans action manuelle

⚠️ `bg-slate-100 text-slate-700` ligne 292 pour badge "Utilisée" — incohérent avec les tokens sémantiques (`bg-muted`)
⚠️ Clé générée côté client avec timestamp (déterministe) — pas cryptographiquement sûr
⚠️ Sélecteur de durée qui se réinitialise au changement de type sans feedback

❌ `navigator.clipboard` sans fallback — même bug que AdminWaitlist/Parrainages
❌ Aucun état d'erreur si la query `license_keys` échoue — table silencieusement vide

---

### AdminSecurity (`src/pages/admin/AdminSecurity.tsx`)
✅ `refetchInterval: 15000` — monitoring quasi temps réel sans action manuelle
✅ Device / Browser / Localisation avec icônes + badges OK/Échec sémantiques
✅ Filtre de recherche texte sur action / email / IP

⚠️ Filtre appliqué côté client uniquement — tous les logs chargés en mémoire, lent avec volume important
⚠️ Aucune pagination — liste plate sans limite de résultats
⚠️ IP affichée en clair — même problème que Journal.tsx (données sensibles sans masquage)

❌ Aucun état d'erreur géré dans le JSX si `useQuery` échoue — page silencieusement vide
❌ Pas de filtre par date ni par succès/échec — granularité insuffisante pour une investigation réelle

---

### AdminEmails (`src/pages/admin/AdminEmails.tsx`)
✅ 4 KPI (Total / Planifiés / Envoyés / Destinataires) — visibilité des campagnes
✅ Badges statuts sémantiques après Fix 4 (brouillon / planifié / envoyé)
✅ Sélection du plan cible pour cibler les destinataires

⚠️ Pas de confirmation avant suppression d'un email — action irréversible sans garde-fou
⚠️ Champ `corps` non validé — un email peut être envoyé sans contenu
⚠️ Pas de prévisualisation de l'email avant l'envoi

❌ Textarea `corps` brut sans éditeur ni preview — impossible de vérifier le rendu final
❌ Comptage destinataires (`computeDestinataires`) non affiché pendant la création — l'admin ne sait pas combien seront touchés

---

### AdminParrainages (`src/pages/admin/AdminParrainages.tsx`)
✅ Onglets Parrainages / Demandes quota — séparation claire des workflows
✅ Approve / Reject avec toast de confirmation — feedback immédiat
✅ Countdown auto-approve visible pour chaque demande

⚠️ `text-amber-700` ligne 307 pour le countdown auto-approve — couleur hardcodée
⚠️ Tableau sans filtre ni recherche — difficile à exploiter avec beaucoup de parrainages
⚠️ Countdown formaté manuellement en minutes — devrait utiliser `formatDistanceToNow` de date-fns

❌ `onError` des mutations approve/reject sans toast — si Supabase échoue, l'admin ne voit aucun message
❌ Copie code parrainage sans fallback clipboard — même bug récurrent

---

### AdminContrats (`src/pages/admin/AdminContrats.tsx`)
✅ Templates + contrats signés en 2 onglets — workflow de bout en bout
✅ Aperçu PDF intégré dans le modal — pas de sortie de page
✅ Badges sémantiques pour signature / cachet / type contrat après Fix 4

⚠️ `<label>` wrappant `<Button asChild>` ligne 348 — éléments interactifs imbriqués, problème d'accessibilité
⚠️ Upload signature peut échouer silencieusement si CORS bloque le `fetch` (ligne 125)
⚠️ ScrollArea dans le modal sans indication de contenu supplémentaire

❌ Suppression de template sans confirmation dialog — irréversible
❌ Pas de pagination des contrats signés — liste plate potentiellement longue

---

### AdminFacturation (`src/pages/admin/AdminFacturation.tsx`)
✅ Stats MRR avec tendance vs mois précédent — visibilité financière immédiate
✅ Génération de facture licence avec sélection compte + plan en modal — workflow admin complet
✅ Aperçu reçu (receipt) avant confirmation de l'envoi

⚠️ `bg-green-100` / `bg-red-100` lignes 447-458 pour indicateurs de tendance — hardcodés, non thémables
⚠️ Conversion SVG → PNG pour logo (lignes 20-42) peut échouer silencieusement — PDF généré sans logo
⚠️ Table 7 colonnes sans `overflow-x-auto` explicite — overflow sur mobile

❌ Aucun état d'erreur si le chargement des paiements échoue — liste silencieusement vide
❌ Reset formulaire avec valeurs hardcodées (ligne 141) au lieu de constantes — fragile si le schéma évolue

---

### AdminPlateforme (`src/pages/admin/AdminPlateforme.tsx`)
✅ Toggle show/hide countdown + éditeur datetime inline — contrôle complet de la landing
✅ Configuration tiers parrainage avec éditeur de valeurs — flexible
✅ Template WhatsApp d'activation avec variable `[Lien]` — centralisation des messages

⚠️ `text-emerald-600` lignes 155 et 261 — couleurs hardcodées (devrait être `text-success`)
⚠️ Valeurs des tiers de parrainage sans validation (nombre entier positif non nul)
⚠️ Variable `[Lien]` dans le template non mise en évidence visuellement — difficile à repérer

❌ Aucun feedback si le format des tiers est invalide lors de la sauvegarde (JSON parse silencieux)
❌ Pas de confirmation avant écrasement du template WhatsApp — perte possible de contenu personnalisé
