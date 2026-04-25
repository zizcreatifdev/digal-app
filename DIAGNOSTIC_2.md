# DIAGNOSTIC — Phase 2 : Dashboard CM/Solo

> Date : 2026-04-25  
> Périmètre : modules Dashboard, Clients, Calendrier, Preview, KPI, Parrainages  
> Mode : lecture seule — aucune modification

---

## Légende

| Symbole | Sens |
|---------|------|
| ✅ | Conforme / fonctionne |
| ⚠️ | Douteux / à vérifier / amélioration suggérée |
| ❌ | Bug confirmé à corriger |

---

## 1. Dashboard principal (`Dashboard.tsx`)

### ✅ Ce qui fonctionne
- **Salutation dynamique** : `Bonjour`/`Bonsoir` selon l'heure, prénom personnalisé, avatar/initiales (`AvatarFallback` si pas de photo)
- **Hero card dynamique** : contenu change selon l'heure — matin → posts à publier, après-midi → liens en attente, soir → récap journée. Cliquable vers la section correspondante
- **KPI widgets** : 4 cards avec chargement/erreur géré individuellement. `DeltaBadge` pour posts (vs semaine dernière). Compteur links expirés en amber. Badge "freemium" sur clients actifs (X/2). Widget Factures verrouillé pour freemium avec `ProUpgradeModal`
- **Section "À publier aujourd'hui"** : posts `programme_valide` du jour, bouton "Publié" inline avec optimistic update
- **Activité récente** : 6 dernières entrées `activity_logs` avec icône colorée par type et ville géolocalisée si disponible
- **Alerte DM clients sans CM** : query `assigned_cm IS NULL AND statut = actif`, bouton "Assigner maintenant" → /clients
- **Popup expiration licence** : dismissable via `sessionStorage`, redirect `/parametres?tab=licence`
- **Erreur retry stats** : bandeau rouge avec bouton "Réessayer"

### ⚠️ Ce qui est douteux
- **Code `fetchStats` dupliqué** : `retryStats()` (ligne ~300) réimplémente entièrement la logique de `fetchStats` dans le useEffect (lignes ~227-296) — 70 lignes copiées. Si on modifie une version, l'autre diverge

---

## 2. Onboardings (`Dashboard.tsx` → composants dédiés)

### ✅ Ce qui fonctionne
- **Priorité correcte** : `checkingOnboarding=true` → `null` rendu pendant la vérif, évite un flash de contenu
- **OnboardingDM** : déclenché si `isDmRole && onboardingRole === "dm"` ✅
- **OnboardingCM** : déclenché si `role === "cm" && onboardingRole === "cm"` ✅
- **OnboardingCreateur** : déclenché si `role === "createur" && onboardingRole === "createur"` ✅
- **OnboardingWizard** (CM Solo / Freemium) : déclenché en fallback pour tous les autres cas si `!onboarding_completed` ✅

### ⚠️ Ce qui est douteux
- **`OnboardingWizard` PLAN_LABELS** : la map interne utilise des clés `solo_standard`, `solo_pro`, `agence_starter` — qui ne correspondent pas aux roles réels en BDD (`solo`, `dm`, `agence_standard`, `agence_pro`). Un utilisateur avec `role="solo"` verra `PLAN_LABELS["solo"] ?? "solo"` → le rôle brut s'affiche
- **Onboarding Solo sans `onboarding_role`** : un solo qui ne passe pas par `/activate` n'aura pas `localStorage.onboarding_role` → tombe sur `OnboardingWizard` (OK, mais le wizard n'a pas de slide "explications" comme les onboardings dédiés)

---

## 3. Menu Clients (`Clients.tsx`)

### ✅ Ce qui fonctionne
- **Liste** : TanStack Query + `fetchClients`, rafraîchie à l'invalidation
- **Onglets Actifs/Archivés** avec compteurs badgés
- **Recherche** : filtre local (case-insensitive) sur le nom, réactif à chaque keystroke
- **Empty states** : cas liste vide (icône + CTA "Ajouter") et cas recherche sans résultat (icône Search) — différenciés ✅
- **Ajout client** : `AddClientModal` avec crop logo (`ImageCropModal`)
- **Limite Freemium** : `FreemiumLimitModal` si `activeClients.length >= 2`
- **Réseau par client** : chargés séparément en `networkMap`, affichés dans `ClientCard`

### ⚠️ Ce qui est douteux
- **Modification logo** : uniquement disponible depuis la fiche client (`ClientLogoButton`), pas depuis la liste. Un clic sur le logo dans `ClientCard` n'ouvre pas de modal d'upload
- **Archivage** : accessible uniquement depuis la fiche client (bouton "Archiver"), pas directement depuis la liste

---

## 4. Fiche client (`ClientDetail.tsx`)

### ✅ Ce qui fonctionne
- **6 onglets** : Calendrier, Fichiers (DropBox), Factures, Activité (PreviewLinksHistory), Équipe, Contacts ✅
- **Contacts** : sauvegarde correcte via `UPDATE clients SET contact_*`, invalidation React Query, toggle view/edit ✅
- **Équipe** : `SELECT users WHERE agence_id = DM.agence_id`, CM et Créateur dans des Select séparés, bouton "Assigner" → `UPDATE clients SET assigned_cm, assigned_creator` ✅
- **Barre progression mensuelle** : posts `programme_valide + publie / total` du mois, visible si total > 0 ✅
- **Logo au clic** : `ClientLogoButton` — crop + upload + optimistic update React Query ✅
- **Archivage** : limite freemium checkée (query count archivés), `FreemiumLimitModal` si dépassé ✅
- **Slug modifiable** : input `font-mono` avec validation regex `[^a-z0-9-]`, sauvegarde via `updateClientSlug` ✅

### ❌ Bug confirmé
- **Select "none" écrit en BDD** : l'option "— Aucun —" a `value="none"`. `handleSaveTeam` fait `assigned_cm: assignedCm || null` — or `"none"` est truthy → la BDD reçoit la string `"none"` au lieu de `null`. Un client aura `assigned_cm = "none"` après déselection explicite

### ⚠️ Ce qui est douteux
- **Onglet Factures** : contenu placeholder — "La facturation sera bientôt disponible ici." — non fonctionnel depuis la fiche client (la facturation est dans `/dashboard/facturation`)
- **Équipe sans agence** : pour un solo (pas d'`agence_id`), `teamCms` et `teamCreators` restent vides → les Select affichent "Aucun CM/créateur dans votre équipe" — cohérent mais sans mention que la fonctionnalité est réservée aux agences

---

## 5. Calendrier éditorial (`CalendarPage.tsx` + `EditorialCalendar.tsx`)

### ✅ Ce qui fonctionne
- **Vue Semaine/Mois** : toggle Tabs, navigation chevrons + bouton "Aujourd'hui" ✅
- **Logo client en en-tête** : image logo ou fallback couleur marque + initiale ✅
- **CM assigné affiché** : avatar + nom en sous-titre (chargé via `assigned_cm` → query users) ✅
- **Filtre par réseau** : badges cliquables pour filtrer les posts affichés ✅
- **Création post** : `CreatePostModal`, statut initial "brouillon" (PROJECT_STATE 48A) ✅
- **Workflow statuts verrouillés** : Règles 1-5 (PROJECT_STATE 48A/B) ✅
- **Boutons contextuels** : `PostCard` contextuel par statut (Soumettre, Générer lien, En attente, Publier) ✅
- **Blocs périodes de production** : affiché en overlay dans les jours, cliquables pour édition ✅
- **Empty state** : `CalendarDays` icon + message si aucun client actif ✅
- **Tooltips nav** : `Tooltip` sur chevrons et boutons ✅

### ⚠️ Ce qui est douteux
- **Heatmap** : absente dans le code — la vue mois montre des posts tronqués (`max 2` + "+N autres") mais sans colorisation de densité par jour. Si une heatmap était attendue, elle n'est pas implémentée
- **Vue mois overflow** : au-delà de 2 posts par jour, seul "+N autres" est affiché sans pouvoir les voir sans changer de vue

---

## 6. Lien de prévisualisation (`GeneratePreviewLinkModal.tsx`)

### ✅ Ce qui fonctionne
- **Garde : posts en_attente_validation requis** : vérification `.in("statut", ["en_attente_validation", "lien_envoye"])` avant création — toast si aucun post éligible ✅
- **Message explicite** : "Aucun post à valider. Soumettez d'abord vos posts pour validation." ✅
- **Expiration 48h** : mentionné deux fois — dans la prévisualisation ("Le lien sera valable 48 heures") et après génération ("Expire dans 48 heures") ✅
- **Countdown** : affiché sur la page PreviewPage publique (heures restantes) ✅
- **Période par défaut** : chargée depuis `site_settings.preview_default_period`, fallback `semaine_courante` ✅
- **Mise à jour statut posts** : après génération, les posts `en_attente_validation` passent en `lien_envoye` ✅
- **Message d'accueil** : champ Textarea, transmis à `createPreviewLink` ✅

### ⚠️ Ce qui est douteux
- **`navigator.clipboard.writeText` direct** dans `handleCopy` (ligne 99) : n'utilise pas `copyToClipboard` de `src/lib/clipboard.ts` qui gère le fallback textarea pour les contextes non-HTTPS / Safari privé. Risque d'échec silencieux sur iOS PWA

---

## 7. Rapports KPI (`KpiReportsPage.tsx`)

### ✅ Ce qui fonctionne
- **Création rapport mensuel** : `CreateKpiReportModal` ouvert via "Nouveau rapport" (si client sélectionné) ✅
- **Création rapport cumulatif** : option "Depuis le début" dans `CreateKpiReportModal` (prompt-49) ✅
- **PDF téléchargeable** : `handleDirectDownload` (téléchargement direct) + `handleDownload` (depuis aperçu) — sans race condition setTimeout ✅
- **Logo client dans PDF** : `selectedClientData?.logo_url ?? null` passé à `generateKpiPdf` ✅
- **Aperçu** : `KpiReportPreviewModal` avec rapports précédent calculé automatiquement ✅
- **Error state** : bandeau rouge si échec chargement clients ✅

### ⚠️ Ce qui est douteux
- **`activeNetworks` vide** : `KpiReportsPage` passe `activeNetworks={[]}` à `CreateKpiReportModal`. Aucun réseau pré-coché — l'utilisateur doit les saisir manuellement. Depuis `ClientDetail`, les réseaux sont passés correctement. Incohérence entre les deux points d'entrée
- **Empty state sans icône** : les messages "Sélectionnez un client" et "Aucun rapport pour ce client" sont du texte brut, sans icône — contraste avec le standard du reste de l'app

---

## 8. Parrainages (`Parrainages.tsx`)

### ✅ Ce qui fonctionne
- **Pas de page blanche** : `RenderErrorBoundary` (classe React) + fallback "Profil introuvable" + spinner ✅
- **Lien de parrainage visible** : `${APP_URL}/ref/${referralCode}` en `font-mono` dans une card dédiée ✅
- **Bouton Copier** : `copyToClipboard` de `lib/clipboard.ts` avec toast ✅
- **Bouton WhatsApp** : remplace `[Lien]` et `[Prénom parrain]` dans le template `site_settings.referral_whatsapp_template`, ouvre `wa.me` ✅
- **Tableau filleuls** : colonnes Filleul/Inscription/Plan/Statut, empty state avec `Users2` icon ✅
- **Progression quota** : barre `Progress`, compteurs filleuls/mois gagnés/mois utilisés ✅
- **Paliers** : calcul automatique depuis `site_settings.referral_tiers` — supporte format array et format objet ✅
- **Demande quota** : card "Invitations supplémentaires" si `quotaUsed >= quota`, countdown auto-approve ✅
- **Fallback colonnes manquantes** : si colonnes referral non migrées, fallback sur query basique ✅

### ⚠️ Ce qui est douteux
- **`referral_code` vide** : si le profil remonte sans `referral_code` (fallback query), `referralCode = ""` → `referralLink = "${APP_URL}/ref/"` — lien affiché mais brisé. Pas de garde ni avertissement
- **`window.location.origin` au module level** : `const APP_URL = window.location.origin` est déclaré en dehors du composant. En SSR ou lors des tests unitaires, `window` pourrait ne pas être disponible

---

## Synthèse des points à corriger

### ❌ Bug à corriger (1)

| # | Fichier | Description |
|---|---------|-------------|
| B1 | `ClientDetail.tsx` | `assigned_cm: assignedCm || null` : la valeur `"none"` (option "Aucun") est truthy → écrit "none" en BDD au lieu de `null`. Corriger avec `assignedCm === "none" ? null : assignedCm \|\| null` |

### ⚠️ Améliorations mineures (6)

| # | Fichier | Description |
|---|---------|-------------|
| A1 | `Dashboard.tsx` | Extraire `fetchStats` en fonction partagée (évite la duplication dans `retryStats`) |
| A2 | `OnboardingWizard.tsx` | Mettre à jour `PLAN_LABELS` pour utiliser les vrais rôles DB (`solo`, `dm`, `agence_standard`) ou importer depuis `src/lib/plan-labels.ts` |
| A3 | `GeneratePreviewLinkModal.tsx` | Remplacer `navigator.clipboard.writeText` par `copyToClipboard` de `src/lib/clipboard.ts` |
| A4 | `KpiReportsPage.tsx` | Charger les réseaux du client sélectionné avant d'ouvrir `CreateKpiReportModal` (passer `activeNetworks` réels) |
| A5 | `KpiReportsPage.tsx` | Ajouter icônes sur les empty states (ex: `FileText` pour "Aucun rapport") |
| A6 | `Parrainages.tsx` | Ajouter une garde si `referral_code` est vide/null (afficher un message "Votre code est en cours de génération…" au lieu d'un lien brisé) |

---

*Rapport généré automatiquement — aucun fichier modifié.*
