# E2E Rapport — Partie 3 : Parcours Agence (Studio/Elite)
_2026-04-26 — lecture seule du code source_

---

## FLOW DM (Digital Manager)

### 1. Inscription / Activation DM

✅ Waitlist identique, type `agence`/`agence_standard`/`agence_pro` dans `TYPE_LABELS` — `src/pages/admin/AdminWaitlist.tsx:62-68`
✅ Activation : champ "Nom de l'agence" conditionnel pour les types agence — `src/pages/Activate.tsx:217-222`
✅ `type_compte.startsWith("agence")` → redirect `/dashboard?onboarding=dm` + `onboarding_role=dm` — `src/pages/Activate.tsx:126`

### 2. Onboarding DM — 5 slides (TOTAL_STEPS = 5)

⚠️ `TOTAL_STEPS = 5` dans le code, pas 6 comme attendu — `src/components/OnboardingDM.tsx:22`
✅ Slide 0 : intro DM (bienvenue Digital Manager) — `src/components/OnboardingDM.tsx:202`
✅ Slide 1 : identité agence (nom, logo ImageCropModal, couleur principale) — `src/components/OnboardingDM.tsx:222-283`
✅ Slide 2 : équipe — inputs `nb_cm` / `nb_createurs` sauvegardés en BDD — `src/components/OnboardingDM.tsx:285-329`
✅ Slide 3 : invites — génération liens `/activate/{token}` CM + Créateur, copie presse-papier — `src/components/OnboardingDM.tsx:331-403`
✅ Slide 4 : premier client (nom + réseaux sociaux) — `src/components/OnboardingDM.tsx:405-463`
✅ Slide 5 : félicitations + récap — `src/components/OnboardingDM.tsx:465-520`

### 3. Inviter CM → lien activation

✅ Token généré dans `activation_tokens` avec `agence_id` du DM — `src/components/OnboardingDM.tsx:110-138`
✅ Lien `/activate/{token}` copié presse-papier depuis slide 3 — `src/components/OnboardingDM.tsx:361-380`
✅ Également disponible depuis Settings → TeamTab → `handleInvite` — `src/pages/Settings.tsx:791-834`
✅ Email envoyé via `sendActivationEmail()` (edge fn `send-email`) — `src/lib/emails.ts:97-116`

### 4. Inviter Créateur → lien activation

✅ Même mécanisme que CM, type_compte `"createur"` dans le token — `src/components/OnboardingDM.tsx:110-138`
✅ Lien distinct généré "Générer un lien Créateur" — `src/components/OnboardingDM.tsx:386-403`

### 5. Voir tous les clients (DM)

✅ `fetchClients` pour rôle `dm`/`owner` : retourne tous les clients de `user_id` sans filtre `assigned_cm` — `src/lib/clients.ts:56-68`
✅ Clients illimités (DM non freemium) — `src/lib/account-access.ts:12`

### 6. Assigner CM à un client

✅ Champ `assigned_cm` sélectionnable dans `ClientDetail` — `src/pages/ClientDetail.tsx:91`
✅ Sauvegarde `assigned_cm = null` si valeur `"none"` (corrigé) — `src/pages/ClientDetail.tsx:149`

### 7. Créer post + assigner tâche créateur

⚠️ `assigne_a: null` à la création — aucun champ dans `CreatePostModal` pour assigner un créateur dès la création — `src/components/calendar/CreatePostModal.tsx:154`
✅ Assignation possible via `ReviewPostModal` : `post.assigne_a` utilisé pour valider/rejeter upload créateur — `src/components/calendar/ReviewPostModal.tsx:29-50`
✅ `fetchAssignedTasks` filtre par `assigne_a = creatorUserId` → les missions apparaissent dans `CreatorDashboard` — `src/lib/creator-workflow.ts:16`

### 8. Facturation + Comptabilité accessibles pour DM

✅ Route `/dashboard/facturation` : `agence_standard`, `agence_pro` dans `allowedProfileRoles` — `src/App.tsx:152-156`
✅ Route `/dashboard/comptabilite` : `agence_standard`, `agence_pro` dans `allowedProfileRoles` — `src/App.tsx:160-164`
✅ Route `/dashboard/rapports` : `agence_standard`, `agence_pro` dans `allowedProfileRoles` — `src/App.tsx:136-140`

---

## FLOW CM MEMBRE AGENCE

### 1. Activation via lien DM

✅ Token avec `type_compte = "cm"` + `agence_id` → Activate redirect `/dashboard?onboarding=cm` — `src/pages/Activate.tsx:124`
✅ `agence_id` rattaché au profil CM à l'activation — `src/pages/Activate.tsx:73-109`

### 2. Onboarding CM agence — 6 slides (0→5)

✅ Slide 0 : intro CM — `src/components/OnboardingCM.tsx:128`
✅ Slide 1 : vos clients (liste des clients assignés) — `src/components/OnboardingCM.tsx:146`
✅ Slide 2 : le calendrier (workflow visuel brouillon→soumis→lien→validé→publié) — `src/components/OnboardingCM.tsx:165`
✅ Slide 3 : validation client (lien preview) — `src/components/OnboardingCM.tsx:197`
✅ Slide 4 : profil (nom + avatar) — `src/components/OnboardingCM.tsx:216`
✅ Slide 5 : terminé + `onboarding_completed: true` en BDD — `src/components/OnboardingCM.tsx:276`

### 3. Voir uniquement clients assignés

✅ `fetchClients({role:"cm"})` filtre `user_id.eq.${id},assigned_cm.eq.${id}` — `src/lib/clients.ts:63-68`
✅ Même filtre appliqué dans `CalendarPage` — `src/pages/CalendarPage.tsx:47-58`

### 4. Créer posts calendrier

✅ Route `/dashboard/calendrier` accessible pour rôle `cm` — `src/App.tsx:129`
✅ Création post en brouillon, workflow statuts complet — `src/components/calendar/CreatePostModal.tsx:153`

### 5. Générer lien preview

✅ `GeneratePreviewLinkModal` accessible depuis `ClientDetail` — `src/pages/ClientDetail.tsx:417`
⚠️ Bouton "Générer lien" dans PostCard no-op depuis `/dashboard/calendrier` — `src/pages/CalendarPage.tsx:152-158`

### 6. Facturation NON accessible pour CM

✅ Route `/dashboard/facturation` exclut `"cm"` → toast "Accès non autorisé" + redirect — `src/App.tsx:152-156`
✅ Routes `/comptabilite` et `/rapports` également inaccessibles pour `cm` — `src/App.tsx:137,161`

---

## FLOW CRÉATEUR

### 1. Activation via lien DM

✅ Token `type_compte = "createur"` → redirect `/dashboard?onboarding=createur` + `localStorage("onboarding_role", "createur")` — `src/pages/Activate.tsx:125`

### 2. Onboarding Créateur — 7 slides (0→6)

✅ Slide 0 : intro Créateur — `src/components/OnboardingCreateur.tsx:162`
✅ Slide 1 : vos missions (CM vous assigne, deadline, livraison) — `src/components/OnboardingCreateur.tsx:180`
✅ Slide 2 : livrez vos fichiers (upload + review/rejet CM) — `src/components/OnboardingCreateur.tsx:199`
✅ Slide 3 : boîte de dépôt libre — `src/components/OnboardingCreateur.tsx:218`
✅ Slide 4 : votre équipe (membres agence chargés via `agence_id`) — `src/components/OnboardingCreateur.tsx:237`
✅ Slide 5 : profil (nom + avatar) — `src/components/OnboardingCreateur.tsx:281`
✅ Slide 6 : terminé + redirect `/dashboard/createur` — `src/components/OnboardingCreateur.tsx:341`

### 3. Vue "Mes missions"

✅ Onglet "Tâches assignées" : `fetchAssignedTasks(user.id)` → filtre `assigne_a = userId` — `src/pages/CreatorDashboard.tsx:23-35`
✅ Séparation visuelle : tâches en attente vs tâches rejetées (avec commentaire) — `src/pages/CreatorDashboard.tsx:52-53`

### 4. Upload fichier tâche assignée

✅ `handleUpload(task, file)` → `submitCreatorUpload()` → toast "Fichier soumis pour validation" — `src/pages/CreatorDashboard.tsx:38-43`

### 5. Boîte de dépôt libre

✅ Onglet "Boîte de dépôt" avec `DropBoxUpload` + sélecteur de client — `src/pages/CreatorDashboard.tsx:67,145-168`

### 6. Calendrier complet NON accessible

✅ `"createur"` absent de `allowedProfileRoles` sur `/dashboard/calendrier` → redirect + toast — `src/App.tsx:129`
✅ Seule route autorisée : `/dashboard/createur` avec `allowedProfileRoles: ["createur"]` — `src/App.tsx:145`

### 7. Notifications rejet avec commentaire

✅ `rejectCreatorUpload()` : commentaire obligatoire (toast d'erreur si vide), `review_comment` sauvegardé en BDD — `src/components/calendar/ReviewPostModal.tsx:44-51`
✅ `rejectedTasks` filtrés sur `review_comment != null` et affichés dans section "À refaire" — `src/pages/CreatorDashboard.tsx:53,108-119`
⚠️ Pas de notification push/email au créateur lors du rejet — affichage uniquement au prochain chargement de `CreatorDashboard` — `src/lib/creator-workflow.ts:71-97`

---

## Anomalies prioritaires

| # | Sévérité | Fichier | Problème |
|---|----------|---------|---------|
| 1 | ⚠️ | `OnboardingDM.tsx:22` | `TOTAL_STEPS = 5` mais 6 slides affichées (0 à 5) — compteur de progression décalé |
| 2 | ⚠️ | `CreatePostModal.tsx:154` | Pas de champ "Assigner au créateur" à la création — uniquement disponible via `ReviewPostModal` |
| 3 | ⚠️ | `CalendarPage.tsx:152` | Bouton "Générer lien" no-op depuis le calendrier principal (CM agence comme CM solo) |
| 4 | ⚠️ | `creator-workflow.ts:71-97` | Rejet créateur : pas de push/email → créateur ne le voit qu'à la prochaine ouverture de l'app |
