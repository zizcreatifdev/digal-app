# E2E Rapport — Partie 2 : Parcours CM Pro (Solo Standard)
_2026-04-26 — lecture seule du code source_

---

## 1. Inscription / Activation CM Pro

✅ Waitlist identique au parcours Freemium (RHF + Zod + email confirmation) — `src/pages/Waitlist.tsx:16-80`
✅ AdminWaitlist : type `solo` → label "CM Pro" dans `TYPE_LABELS` — `src/pages/admin/AdminWaitlist.tsx:62-68`
✅ Activation `/activate/:token` : schéma identique (prenom/nom min(2), password min(8)) — `src/pages/Activate.tsx:15-24`
⚠️ Type `solo` / `solo_standard` non géré dans `getOnboardingDestination()` → redirect `/dashboard` sans `onboarding_role` localStorage — `src/pages/Activate.tsx:123-128`

---

## 2. Onboarding CM Pro — OnboardingWizard

⚠️ Pas d'onboarding "CM Solo 5 étapes" dédié — `OnboardingWizard.tsx` (4 étapes : Bienvenue / Profil / Marque / Terminé) s'applique aux solo/solo_standard comme aux freemium — `src/components/OnboardingWizard.tsx:39-42`
✅ Déclenché automatiquement si `onboarding_completed === false` à l'arrivée sur Dashboard — `src/pages/Dashboard.tsx:175-187`
✅ Sauvegarde profil + `onboarding_completed: true` en BDD à la fin — `src/components/OnboardingWizard.tsx:81-99`
⚠️ `solo_standard` absent du `PLAN_LABELS` local → affiche `"solo_standard"` brut dans la bannière de bienvenue — `src/components/OnboardingWizard.tsx:27-32`

---

## 3. Clients illimités

✅ `isFreemium = role === "freemium" && !plan` → un solo/solo_standard n'est jamais freemium → `maxClients = Infinity` — `src/lib/account-access.ts:12`
✅ `FreemiumLimitModal` non déclenchée, pas de badge "2 max" dans le sous-titre — `src/pages/Clients.tsx:76-105`

---

## 4. Calendrier complet

✅ Route `/dashboard/calendrier` accessible : `solo`, `solo_standard` dans `allowedProfileRoles` — `src/App.tsx:127-132`
✅ Tous les clients du CM affichés sans restriction de quota — `src/pages/CalendarPage.tsx:30-58`
✅ Création, modification, workflow statuts complets (brouillon→soumis→validé→publié) — `src/components/calendar/CreatePostModal.tsx:153`
⚠️ Bouton "Générer lien" dans PostCard non câblé depuis `/dashboard/calendrier` (fonctionne uniquement via `ClientDetail`) — `src/pages/CalendarPage.tsx:152-158`

---

## 5. Lien preview sans filigrane

✅ `isFreemium = false` pour solo → filigrane "Créé avec Digal" absent — `src/pages/PreviewPage.tsx:57,732-737`
✅ Page `/preview/:slug` accessible publiquement sans auth — `src/App.tsx:99`

---

## 6. Facturation FCFA

✅ Création devis : bouton "Nouveau devis" → `CreateDocumentModal` avec client, lignes, BRS, TVA — `src/pages/Facturation.tsx:22,103`
✅ Conversion devis → facture : bouton icône dans `DocumentList` → `convertDevisToFacture()` — `src/components/facturation/DocumentList.tsx:103,196`
✅ PDF téléchargeable : `generateFacturePdf()` via jsPDF — `src/lib/facturation-pdf.ts:94`
✅ Contact client dans PDF : nom, poste, email, téléphone imprimés si renseignés — `src/lib/facturation-pdf.ts:198-205`
✅ Logo CM chargé depuis `users.logo_url`, logo Digal en footer — `src/lib/facturation-pdf.ts:108-123`
✅ BRS par défaut 5% (modifiable), TVA par défaut 0% (modifiable), calculés par ligne — `src/components/facturation/CreateDocumentModal.tsx:67-68`
⚠️ TVA par défaut à **0%** et non 18% — l'utilisateur doit saisir 18 manuellement à chaque document — `src/components/facturation/CreateDocumentModal.tsx:68`

---

## 7. Comptabilité

✅ Route `/dashboard/comptabilite` accessible : `solo_standard` dans `allowedProfileRoles` — `src/App.tsx:160-164`
✅ Dépenses saisissables : onglet "Dépenses" avec CRUD via `fetchDepenses` — `src/pages/Comptabilite.tsx:66,130,151`
✅ Masse salariale : onglet dédié via `fetchSalaires` — `src/pages/Comptabilite.tsx:67,131`
✅ Tableau financier mensuel : chargement mois courant + mois précédent pour delta — `src/pages/Comptabilite.tsx:60-82`
✅ Export CSV disponible : `exportComptabiliteCSV(depenses, salaires, mois)` — `src/pages/Comptabilite.tsx:102,106`

---

## 8. Rapports KPI

✅ Route `/dashboard/rapports` accessible : `solo_standard` dans `allowedProfileRoles` — `src/App.tsx:136-140`
✅ Rapport mensuel : création + historique par client + delta mois précédent — `src/pages/KpiReportsPage.tsx:51-90`
✅ Rapport cumulatif "depuis le début" : `CumulativeStats` avec tableaux mensuels — `src/pages/KpiReportsPage.tsx:66-73`
✅ PDF avec logo client : `logo_url` chargé depuis `clients` + logo Digal en footer — `src/lib/kpi-pdf.ts:210,304`

---

## Anomalies prioritaires

| # | Sévérité | Fichier | Problème |
|---|----------|---------|---------|
| 1 | ⚠️ | `Activate.tsx:123-128` | `solo`/`solo_standard` → pas de `onboarding_role` → onboarding générique sans label plan correct |
| 2 | ⚠️ | `OnboardingWizard.tsx:27` | `solo_standard` absent de `PLAN_LABELS` → affiche le slug brut |
| 3 | ⚠️ | `CalendarPage.tsx:152` | Bouton "Générer lien" no-op hors `ClientDetail` |
| 4 | ⚠️ | `CreateDocumentModal.tsx:68` | TVA par défaut à 0% au lieu de 18% — saisie manuelle obligatoire |
