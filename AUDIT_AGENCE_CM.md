# AUDIT_AGENCE_CM.md — Bugs côté Agence & CM Pro
_Lecture seule — 2026-04-30_

---

## CÔTÉ AGENCE

### A1 — OnboardingDM — TOTAL_STEPS correct ?
✅ **Fonctionne** — `src/components/OnboardingDM.tsx:22`
`TOTAL_STEPS = 6`, slides de 0 à 5 (6 slides). Le fix E2E-A a déjà corrigé la valeur depuis l'audit E2E_3 qui signalait `TOTAL_STEPS = 5`.

---

### A2 — Invitation membres — lien activation fonctionne ?
✅ **Fonctionne** — `src/pages/Settings.tsx:801-819`
- Token inséré dans `activation_tokens` (ligne 801)
- Lien `/activate/:token` construit avec `window.location.origin` (ligne 817) — plus de domaine hardcodé
- Email envoyé via `sendActivationEmail()` (ligne 819)

---

### A3 — Assignation CM aux clients — fonctionne ?
✅ **Fonctionne** — `src/pages/ClientDetail.tsx:149, 468-481`
- Champ `assigned_cm` présent et sélectionnable (liste les CMs de l'agence)
- Sauvegarde correcte : `assigned_cm = null` si valeur `"none"` (bug corrigé dans diag-bugs)

---

### A4 — Assignation créateur à un post — fonctionne ?
⚠️ **Partiellement** — `src/components/calendar/CreatePostModal.tsx:254-271` / `EditPostModal.tsx`
- ✅ À la **création** : select "Assigner à un créateur" conditionnel (`isAgenceMember && creators.length > 0`), persiste `assigne_a` en BDD
- ❌ À l'**édition** : aucun champ `assigne_a` dans `EditPostModal.tsx` — impossible de réassigner (ou désassigner) un créateur après création du post

---

### A5 — Boîte de dépôt créateur — accessible ?
✅ **Fonctionne** — `src/pages/CreatorDashboard.tsx:90, 168`
- Onglet "Boîte de dépôt" présent, composant `DropBoxUpload` importé et rendu
- Accessible via route `/dashboard/createur` (rôle `createur` seulement)

---

### A6 — Validation fichiers créateur par CM/DM — fonctionne ?
✅ **Fonctionne** — `src/components/calendar/ReviewPostModal.tsx:28-61`
- Valider : `validateCreatorUpload()` — `src/lib/creator-workflow.ts:56`
- Rejeter : `rejectCreatorUpload()` avec commentaire obligatoire — `src/lib/creator-workflow.ts:72`
- Toast d'erreur si commentaire vide avant rejet

---

### A7 — Notification rejet créateur avec push — câblée ?
✅ **Fonctionne** — `src/lib/creator-workflow.ts:104-130`
Séquence complète après rejet :
1. UPDATE post (statut, review_comment) — ligne 86-94
2. INSERT notification in-app — ligne 96-101
3. `supabase.functions.invoke("send-push")` — ligne 110 (silent fail)
4. `sendCreatorRejectionEmail()` — ligne 127-130

---

### A8 — handleRemoveMember — utilise bien user_id ?
✅ **Fonctionne** — `src/pages/Settings.tsx:774`
`.eq("user_id", memberToRemove.user_id)` — colonne correcte, pas `id`.

---

### A9 — Calendrier DM — voit tous les clients ?
✅ **Fonctionne** — `src/pages/CalendarPage.tsx:51-54` / `src/lib/clients.ts:63-67`
- Rôle `cm` → filtre `user_id.eq.${id},assigned_cm.eq.${id}`
- Rôle `dm` (et autres) → filtre `user_id.eq.${id}` : DM voit les clients qu'il a créés (user_id = dm.id), ce qui correspond au workflow attendu (le DM crée les clients et les assigne aux CM)

---

### A10 — Facturation DM — accessible et fonctionnelle ?
✅ **Fonctionne** — `src/App.tsx:152-157` / `src/pages/Facturation.tsx:69-92`
- Route `/dashboard/facturation` : `"dm"`, `"agence_standard"`, `"agence_pro"` dans `allowedProfileRoles`
- Écran normal pour DM/agence, écran verrouillé gracieux (Lock + bouton licence) pour freemium

---

## CÔTÉ CM PRO (solo / solo_standard)

### B1 — Onboarding CM Solo — PLAN_LABELS correct ?
✅ **Fonctionne** — `src/components/OnboardingWizard.tsx:30`
`"solo_standard": "CM Pro"` présent dans `PLAN_LABELS`. Le bug E2E-A3 a déjà été corrigé.

---

### B2 — getOnboardingDestination — gère solo_standard ?
⚠️ **Douteux** — `src/pages/Activate.tsx:120-135`
- Types gérés explicitement : `cm`, `createur`, `agence*` / `dm`
- `solo` et `solo_standard` tombent en commentaire : `// freemium, solo, solo_standard → dashboard sans onboarding spécifique` → redirect `/dashboard` **sans** setter `localStorage("onboarding_role")`
- Conséquence : `OnboardingWizard` charge `role` depuis Supabase (pas localStorage), donc le plan affiché dans l'onboarding dépend de la valeur en BDD — fonctionnel mais `getOnboardingDestination` n'est pas cohérent avec les autres rôles

---

### B3 — Calendrier — bouton "Générer lien" câblé ?
✅ **Fonctionne** (fix E2E-A1 appliqué) — `src/pages/CalendarPage.tsx:4, 31, 162, 165-171`
- `onGenerateLink={() => setShowPreviewModal(true)}` câblé dans PostCard
- `GeneratePreviewLinkModal` importé et rendu conditionnellement sur `showPreviewModal`

---

### B4 — Lien preview sans filigrane pour CM Pro ?
✅ **Fonctionne** — `src/pages/PreviewPage.tsx:57, 732-737`
- `isFreemium = getAccountAccess(cmUser).isFreemium`
- Pour `solo_standard` : `isFreemium = false` → filigrane "Créé avec Digal" absent

---

### B5 — Facturation — accessible CM Pro ?
✅ **Fonctionne** — `src/App.tsx:154`
`"solo"` et `"solo_standard"` dans `allowedProfileRoles` de la route `/dashboard/facturation`.

---

### B6 — Comptabilité — accessible CM Pro ?
✅ Route accessible — `src/App.tsx:162`
`"solo"` et `"solo_standard"` dans `allowedProfileRoles`.

❌ **Bug runtime** — `src/pages/Comptabilite.tsx:63`
`supabase` est appelé à la ligne 63 (`supabase.from("users")...`) mais **n'est jamais importé** dans ce fichier. Le build Vite passe (esbuild ne type-check pas), mais l'exécution lève une `ReferenceError: supabase is not defined` dès que la page se charge pour un utilisateur non-freemium.

Fix : ajouter `import { supabase } from "@/integrations/supabase/client";` dans les imports.

---

### B7 — KPI Reports — accessible CM Pro ?
✅ **Fonctionne** — `src/App.tsx:138`
`"solo"` et `"solo_standard"` dans `allowedProfileRoles`. Écran verrouillé gracieux pour freemium (`src/pages/KpiReportsPage.tsx:127-142`).

---

### B8 — Écran verrouillé freemium gracieux ?
✅ **Fonctionne** (fix E2E-B1 appliqué)
- `src/pages/Comptabilite.tsx:101-116` : bloc Lock + "Débloquer avec une licence"
- `src/pages/KpiReportsPage.tsx:127-142` : même pattern
- Pas de toast "Accès non autorisé" + redirect — UX cohérente avec Facturation

---

### B9 — TVA défaut depuis site_settings ?
✅ **Fonctionne** (fix E2E-B2 appliqué) — `src/components/facturation/CreateDocumentModal.tsx:84-89`
```typescript
supabase.from("site_settings").select("key, value")
  .eq("key", "billing_tva").maybeSingle()
  .then(({ data }) => setTauxTva(data?.value === "true" ? 18 : 0));
```
TVA initialisée à 18% si `billing_tva = "true"` en DB, 0% sinon.

---

### B10 — Parrainages — referral_code jamais vide ?
⚠️ **Douteux** — `src/pages/Parrainages.tsx:233-235`
```typescript
const referralCode: string = profile.referral_code ?? "";
const referralLink = referralCode ? `${APP_URL}/ref/${referralCode}` : null;
```
- Si `referral_code` est null/vide : `referralLink = null` → message "en cours de génération" affiché (lignes 310-312)
- Aucune génération automatique du code : si la BDD n'a pas peuplé `referral_code` à la création du compte, le code ne sera jamais généré automatiquement côté client

---

## RÉSUMÉ EXÉCUTIF

| # | Côté | Point | Statut | Sévérité |
|---|------|-------|--------|----------|
| A4 | Agence | Réassignation créateur dans EditPostModal | ⚠️ Manquant | Moyenne |
| B2 | CM Pro | getOnboardingDestination sans localStorage pour solo | ⚠️ Douteux | Faible |
| B6 | CM Pro | `supabase` non importé dans Comptabilite.tsx | ❌ Bug runtime | **CRITIQUE** |
| B10 | CM Pro | referral_code sans génération auto si absent | ⚠️ Douteux | Faible |

### Bugs déjà corrigés (confirmés)
- ✅ E2E-A2 — OnboardingDM TOTAL_STEPS = 6
- ✅ E2E-A3 — PLAN_LABELS solo_standard dans OnboardingWizard
- ✅ E2E-A4 — getOnboardingDestination (partiellement)
- ✅ E2E-A1 — Bouton "Générer lien" câblé dans CalendarPage
- ✅ E2E-B1 — Écran verrouillé freemium gracieux
- ✅ E2E-B2 — TVA défaut depuis site_settings
- ✅ fix-E2E — handleRemoveMember user_id correct
