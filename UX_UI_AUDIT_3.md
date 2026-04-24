# UX/UI Audit — Partie 3
_Comptabilité, KPI, Journal, Parrainages, Paramètres, Admin_
_Date : 2026-04-24_

---

### Comptabilité (`Comptabilite.tsx`)

✅ H1 `text-2xl font-serif font-bold` ligne 90 — convention respectée
✅ Aucun `console.log` ni couleur hardcodée, tokens CSS bien utilisés
✅ `isFreemium` correctement calculé depuis le profil

⚠️ État de chargement ligne 115 : `<p>Chargement...</p>` sans `<Loader2>` — incohérent
⚠️ Empty state : texte centré sans icône (`<Receipt>` ou `<FileText>`) — sous la norme app
⚠️ `usePageTitle` absent → titre générique dans l'onglet navigateur

❌ Résumé mois en cours : barre de progression avec `bg-emerald-500` hardcodé — incohérent avec le token `bg-success`

---

### Rapports KPI (`KpiReportsPage.tsx`)

✅ H1 `font-bold font-serif` ligne 107 — conforme
✅ Aucun `console.log` ni inline style détecté
✅ Empty state posts avec icône `<Inbox>` — bonne pratique

⚠️ Chargement initial clients : aucun indicateur visible (`<Loader2>`) — page silencieuse pendant le fetch
⚠️ Empty state "sélectionnez un client" sans icône sémantique (`<BarChart3>`)
⚠️ `usePageTitle` absent → onglet affiche titre générique

❌ Rapport PDF : couleurs générées via `jsPDF` hardcodées (`[220, 252, 231]`, `[254, 243, 199]`) — non thématisables

---

### Journal d'activité (`Journal.tsx`)

✅ H1 `text-2xl font-serif font-bold` ligne 71 — conforme
✅ Aucun `console.log`, code propre
✅ Pagination présente

⚠️ État de chargement ligne 100 : `<p>Chargement...</p>` sans `<Loader2>` — incohérent
⚠️ Empty state : texte seul sans icône (`<Activity>` ou `<FileSearch>`)
⚠️ `usePageTitle` absent

❌ Aucune classe `dark:` sur les badges de type d'activité — lisibilité dégradée en mode sombre

---

### Parrainages dashboard (`Parrainages.tsx`)

✅ `usePageTitle("Digal · Parrainages")` ligne 69 — présent
✅ H1 `font-bold font-serif` ligne 274, `<Loader2>` utilisé correctement
✅ `isFreemium` calculé depuis `profile.role` — correct

⚠️ `text-emerald-600`, `text-blue-600`, `text-amber-700`, `bg-emerald-100`, `bg-amber-50` hardcodés — tokens `text-success`/`text-warning` non utilisés
⚠️ Bouton WhatsApp : `text-emerald-600 border-emerald-300 hover:bg-emerald-50` — couleur sémantique inexistante
⚠️ Stats (qualifiés / mois gagnés) : labels sous les chiffres en `text-muted-foreground` sans `font-sans` explicite

❌ `console.log("Parrainages rendered", …)` ligne 75 — log de debug laissé en production

---

### Paramètres (`Settings.tsx`)

✅ `font-serif` sur tous les `CardTitle` (12 sections), `<Loader2>` utilisé dans la plupart des états
✅ Plan et rôle correctement récupérés depuis Supabase, logique freemium saine
✅ `ImageCropModal` intégré pour le logo agence — cohérent avec le reste de l'app

⚠️ Lignes 766 et 947 : `<p>Chargement...</p>` en texte seul (membres d'équipe + modèles) — `<Loader2>` manquant
⚠️ Fichier de 1 265 lignes — difficile à maintenir, candidat à un découpage en sous-composants
⚠️ `checkReferralQualification` / `applyReferralMonths` appelés `.catch(console.error)` lignes 1080-1081

❌ Ligne 712 : `bg-[#C4522A] text-white` hardcodé pour le badge rôle owner/DM — doit utiliser `bg-primary`

---

### Dashboard Admin (`AdminDashboard.tsx`)

✅ `<Loader2>` présent sur chaque widget KPI et dans le loader principal (lignes 343, 503, 590)
✅ `font-serif` sur les valeurs KPI et sous-titres de sections — cohérence interne
✅ Structure de page propre, pas de duplication de layout

⚠️ H1 principal : `text-3xl font-bold` sans `font-serif` — incohérent avec les pages admin/plans
⚠️ `checkReferralQualification` / `applyReferralMonths` appelés `.catch(console.error)` lignes 1080-1081 — idem Settings

❌ Aucun empty state iconé sur les widgets "0 utilisateurs" ou "aucune activité" — chiffre `0` affiché sans contexte visuel

---

### Admin — Comptes (`AdminComptes.tsx`)

✅ `<Loader2>` utilisé exhaustivement (8 occurrences) — excellent
✅ `font-serif` sur les titres de modales et valeurs KPI de la fiche utilisateur

⚠️ Badges de statut lignes 453-468 : `bg-emerald-100 text-emerald-700`, `bg-gray-100 text-gray-700` — tokens sémantiques non utilisés
⚠️ Valeurs financières lignes 1145-1163 : `text-emerald-700`, `text-blue-700`, `text-orange-700` hardcodées

❌ `console.error` en production aux lignes 623, 645, 666, 691 (`[suspendAccount]`, `[reactivateAccount]`, `[cancelDeletion]`, `[deleteAccount]`)
❌ Fichier de 1 507 lignes — maintenance très difficile, refactoring en sous-composants requis

---

### Admin — Parrainages (`AdminParrainages.tsx`)

✅ `<Loader2>` correct (lignes 188, 243, 270), code propre, aucun `console.error`
✅ `font-serif` sur les KPI MRR / total mois (lignes 441, 452, 463) — cohérent

⚠️ Badges de statut lignes 151-159 : `bg-emerald-100 text-emerald-700`, `bg-amber-100 text-amber-700` — tokens non utilisés
⚠️ `Chargement...` en texte seul dans la table `<TableCell>` ligne 501 — `<Loader2>` manquant

❌ Valeur diff MRR ligne 463 : `text-green-600` hardcodé au lieu de `text-success`

---

### Admin — Licences & Plans (`AdminLicences.tsx` / `AdminPlans.tsx`)

✅ `<Loader2>` utilisé correctement dans `AdminLicences.tsx` (lignes 215, 385, 416, 459)
✅ `font-serif` sur H1 et `CardTitle` dans `AdminPlans.tsx` — conforme
✅ Aucun `console.log` dans les deux fichiers

⚠️ `AdminPlans.tsx` ligne 274 : `Chargement...` texte seul — pas de `<Loader2>`
⚠️ `AdminLicences.tsx` : H1 sans `font-serif` — incohérent avec AdminPlans

❌ `AdminPlans.tsx` : empty states de configuration tarifaire sans icône ni CTA visible

---

## Synthèse Partie 3

| Page | `font-serif` H1 | Loader2 | Empty state iconé | `console.*` prod | Problème bloquant |
|------|:-:|:-:|:-:|:-:|:--|
| Comptabilité | ✅ | ❌ | ❌ | ✅ | — |
| Rapports KPI | ✅ | ❌ | ⚠️ partiel | ✅ | — |
| Journal | ✅ | ❌ | ❌ | ✅ | — |
| Parrainages | ✅ | ✅ | ⚠️ partiel | ❌ | `console.log` debug |
| Paramètres | ✅ | ⚠️ partiel | ❌ | ❌ | `bg-[#C4522A]` hardcodé |
| Admin Dashboard | ❌ | ✅ | ❌ | ❌ | `console.error` |
| Admin Comptes | ✅ (modal) | ✅ | n/a | ❌ | 4× `console.error` prod |
| Admin Parrainages | ✅ | ⚠️ partiel | n/a | ✅ | — |
| Admin Licences/Plans | ⚠️ partiel | ⚠️ partiel | ❌ | ✅ | — |

**Top 3 bugs prioritaires :**
1. 🔴 `Parrainages.tsx` ligne 75 + `Settings.tsx`/`AdminDashboard.tsx` lignes 1080-1081 : `console.log`/`console.error` en production — fuite de données internes dans les DevTools
2. 🔴 `Settings.tsx` ligne 712 : `bg-[#C4522A]` — couleur inline non thématisable, rompt le dark mode
3. 🟠 `AdminComptes.tsx` lignes 623–691 : 4 `console.error` exposant des actions admin sensibles (`[suspendAccount]`, `[deleteAccount]`)

**Problème transversal Partie 3 :**
- `<Loader2>` absent dans Comptabilité, Journal, KpiReportsPage, AdminPlans — les 4 pages affichent `Chargement...` texte seul
- Couleurs badge hardcodées (`bg-emerald-100 text-emerald-700`, `bg-amber-100 text-amber-700`) dans toutes les pages admin — le système de tokens sémantiques est systématiquement contourné
