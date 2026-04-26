# E2E Rapport — Partie 1 : Parcours Freemium (Découverte)
_2026-04-26 — lecture seule du code source_

---

## 1. Waitlist `/waitlist`
✅ Formulaire RHF + Zod (prenom/nom/email) — `src/pages/Waitlist.tsx:16-21`
✅ Email de confirmation envoyé via edge fn `send-transactional-email` — `src/pages/Waitlist.tsx:73-80`
✅ Vérification doublon email avant insert (suspendu, suppression planifiée, existant) — `src/pages/Waitlist.tsx:38-56`

## 2. AdminWaitlist — Approbation
✅ Bouton Approuver → insert `activation_tokens` avec email/prenom/plan — `src/pages/admin/AdminWaitlist.tsx:281-309`
✅ Message personnalisé avec `[Prénom][Plan][Durée][Lien]` copié presse-papier — `src/pages/admin/AdminWaitlist.tsx:326-387`
✅ Labels plan corrects : `freemium→Découverte` dans `TYPE_LABELS` — `src/pages/admin/AdminWaitlist.tsx:62-68`
⚠️ Lien hardcodé `https://digal.vercel.app/activate/...` au lieu de `window.location.origin` — `src/pages/admin/AdminWaitlist.tsx:340`

## 3. Activation `/activate/:token`
✅ Schéma Zod : prenom/nom min(2), password min(8), confirmPassword `.refine()` — `src/pages/Activate.tsx:15-24`
✅ Token vérifié (invalide / expiré / déjà utilisé) avec états visuels distincts — `src/pages/Activate.tsx:49-66`
✅ Edge fn `activate-account` → auto sign-in → log `login_success` → redirect `/dashboard` — `src/pages/Activate.tsx:73-109`
⚠️ Type `"freemium"` non géré dans `getOnboardingDestination()` → pas de `onboarding_role` en localStorage — `src/pages/Activate.tsx:123-128`

## 4. Onboarding — OnboardingWizard
✅ Déclenché si `onboarding_completed === false` dans Dashboard — `src/pages/Dashboard.tsx:175-187`
✅ 4 étapes : Bienvenue / Profil / Marque / Terminé — `src/components/OnboardingWizard.tsx:39-42`
✅ `onboarding_completed: true` sauvegardé en BDD à la fin — `src/components/OnboardingWizard.tsx:81-99`
⚠️ `solo_standard` absent du `PLAN_LABELS` local → affiche `"solo_standard"` brut (corrigé dans `plan-labels.ts` mais pas ici) — `src/components/OnboardingWizard.tsx:27-32`

## 5. Clients — Limite 2 max
✅ `FREEMIUM_CLIENT_LIMIT = 2` + `FreemiumLimitModal` si dépassé — `src/pages/Clients.tsx:17,76-93`
✅ Sous-titre affiche `· 2 max` en mode Découverte — `src/pages/Clients.tsx:103-105`

## 6. Calendrier — Création post
✅ Route accessible au freemium (createur exclu) — `src/App.tsx:127-132`
✅ Statut initial `"brouillon"` à la création — `src/components/calendar/CreatePostModal.tsx:153`
⚠️ Bouton "Générer lien" dans PostCard est no-op depuis `/dashboard/calendrier` (seulement câblé dans `ClientDetail.tsx:417`) — `src/pages/CalendarPage.tsx:152-158`

## 7. Preview Link — Lien & filigrane
✅ Vérifie existence de posts `en_attente_validation` avant génération (toast sinon) — `src/components/preview/GeneratePreviewLinkModal.tsx:60-74`
✅ Page `/preview/:slug` publique sans auth — `src/App.tsx:99`
✅ Filigrane "Créé avec Digal" affiché si profil CM = freemium — `src/pages/PreviewPage.tsx:732-737`

## 8. Limites — Sections verrouillées
✅ Sidebar : Facturation/Comptabilité/KPI grisés + icône `Lock` + badge "PRO" si freemium — `src/components/AppSidebar.tsx:105-128`
✅ Page Facturation : écran verrouillé gracieux avec message upgrade — `src/pages/Facturation.tsx:69-91`
✅ Widget "Factures impayées" masqué + `Lock` dans Dashboard — `src/pages/Dashboard.tsx:559-578`
⚠️ Routes `/rapports` et `/comptabilite` redirigent avec toast "Accès non autorisé" au lieu d'un écran verrouillé (incohérence UX vs Facturation) — `src/App.tsx:137,161`

---

## Anomalies prioritaires
| # | Sévérité | Fichier | Problème |
|---|----------|---------|---------|
| 1 | ⚠️ | `AdminWaitlist.tsx:340` | Domaine hardcodé `digal.vercel.app` |
| 2 | ⚠️ | `Activate.tsx:123-128` | Freemium → pas de `onboarding_role` → label plan manquant |
| 3 | ⚠️ | `OnboardingWizard.tsx:27` | `solo_standard` absent de `PLAN_LABELS` local |
| 4 | ⚠️ | `CalendarPage.tsx:152` | Bouton "Générer lien" non câblé hors ClientDetail |
| 5 | ⚠️ | `App.tsx:137,161` | KPI/Comptabilité → toast erreur au lieu d'écran verrouillé pour freemium |
