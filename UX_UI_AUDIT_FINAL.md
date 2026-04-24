# UX/UI Audit — Rapport final
_Date : 2026-04-24 — Synthèse des 4 audits + correctifs appliqués_

---

## 1. Scores globaux par page

### Pages publiques & authentification

| Page | Score /10 | Fixes appliqués |
|------|:---------:|-----------------|
| Landing page | 5.5 | — |
| Waitlist | 5.5 | — |
| Activate (`/activate/:token`) | 5.5 | — |
| Login | 5.5 | — |
| ReferralLanding (`/ref/:code`) | 7.5 | ✅ console.error supprimé |

### Application CM

| Page | Score /10 | Fixes appliqués |
|------|:---------:|-----------------|
| Dashboard CM | 7.0 | ✅ Erreur fetchStats + retry |
| Clients | 7.0 | ✅ Loader2 onglet Archivés |
| Calendrier éditorial | 7.5 | ✅ profileRole race condition, logo, Loader2 |
| Preview client | 7.0 | ✅ Promise.all validate/refuse |
| Facturation | 8.5 | ✅ Loader2, isFreemium centralisé, onglet Récurrent supprimé |
| Comptabilité | 5.5 | ✅ Loader2 |
| Rapports KPI | 7.0 | ✅ Loader2, erreur chargement clients |
| Journal d'activité | 5.5 | ✅ Loader2 |
| Parrainages | 7.5 | ✅ console.log, couleurs tokens, clipboard fallback |
| Paramètres | 5.5 | ✅ bg-primary, console.error |

### Application Admin

| Page | Score /10 | Fixes appliqués |
|------|:---------:|-----------------|
| AdminDashboard | 5.5 | ✅ console.error |
| AdminComptes | 7.0 | ✅ console.error, badges couleurs |
| AdminWaitlist | 9.0 | ✅ console.warn DEV-only, clipboard, overflow-x-auto |
| AdminPlans | 6.5 | ✅ text-success, AlertDialog suppression config |
| AdminLicences | 7.0 | ✅ clipboard, erreur users query |
| AdminSecurity | 7.0 | ✅ isError + AlertCircle + refetch |
| AdminEmails | 6.0 | ✅ AlertDialog suppression email |
| AdminParrainages | 5.5 | ✅ badges couleurs |
| AdminContrats | 7.0 | ✅ AlertDialog suppression template |
| AdminFacturation | 7.5 | ✅ erreur paiements, overflow-x-auto |
| AdminPlateforme | 6.0 | ✅ text-success |

**Score moyen global : 6.7 / 10**

---

## 2. Problèmes restants non corrigés

### Pages publiques & auth

**Landing page**
- 🟡 Aucune classe `dark:` dans les composants landing — mode sombre non supporté.
- 🟡 `usePageTitle` absent — onglet navigateur affiche le titre générique Vite.
- 🟡 Aucun `<meta name="description">` dynamique — SEO non géré.

**Waitlist / Activate / Login**
- 🟠 Formulaires sans React Hook Form + Zod — validation côté client absente, feedback uniquement via toast.
- 🟡 `text-amber-500` / `text-emerald-500` hardcodés dans `Activate.tsx` — tokens `text-warning`/`text-success` non utilisés.
- 🟡 `usePageTitle` absent dans `Activate.tsx` — onglet affiche le titre générique.
- 🟡 Aucun `autocomplete="current-password"` dans `Login.tsx` — mauvaise pratique UX/sécurité.

**ReferralLanding**
- 🟠 Formulaire sans React Hook Form / Zod — validation uniquement via toast après soumission Supabase.

---

### Dashboard CM

- 🟡 `ACTIVITY_COLOR_MAP` / `ACTIVITY_BG_MAP` : `bg-blue-100`, `bg-violet-100`… hardcodés — pas supportés en dark mode.
- 🟡 Hero card `style={{ background: "linear-gradient(135deg, #E8511A…)" }}` — couleur inline non thémable.
- 🟡 Emoji `👋` hardcodé ligne 350 — contrevient à la convention CLAUDE.md.

### Clients

- 🟠 `networkMap` chargé via `useEffect` Supabase direct — pas en React Query, pas de cache, refetch à chaque remontage.
- 🟡 H1 sans `font-serif` — incohérence avec toutes les autres pages de l'app.
- 🟡 Aucun filtre / recherche par nom — UX dégradée dès 10+ clients.

### Calendrier éditorial

- 🟠 Aucune gestion d'erreur si la query clients échoue — liste silencieusement vide.
- 🟡 Fallback couleur `"#C4522A"` hardcodé — devrait être `hsl(var(--primary))`.

### Preview client

- 🟠 `isFreemium = true` hardcodé ligne 56 — watermark toujours affiché, logique conditionnelle absente.
- 🟡 `bg-[#FAFAF8]`, `from-[#C4522A]`, `bg-green-600`, `bg-amber-50`… — page non thémable.
- 🟡 `handleRefusePost` accepte un commentaire vide malgré le bouton désactivé si vide — incohérence UX.

### Facturation

- 🟠 Aucune gestion d'erreur si `fetchDocuments` échoue — liste silencieusement vide.

### Comptabilité

- 🔴 `Promise.all` sans gestion d'erreur UI — si un appel échoue, tout le dashboard reste vide sans feedback.
- 🟠 Comparaison mois précédent utilise les mêmes données non filtrées — valeurs incorrectes.
- 🟡 `fetchDocuments(user.id)` appelé 2× à l'identique — requête redondante.

### Rapports KPI

- 🟠 `refreshReports` sans gestion d'erreur — liste de rapports silencieusement vide si Supabase échoue.
- 🟡 `activeNetworks={[]}` passé vide à `CreateKpiReportModal` — réseaux actifs non transmis au formulaire.
- 🟡 `refreshReports` hors `useCallback` — warning ESLint persistant `react-hooks/exhaustive-deps`.

### Journal d'activité

- 🔴 Aucune gestion d'erreur si `fetchActivityLogs` échoue — liste silencieusement vide sans toast.
- 🟠 Tous les logs chargés en une seule requête, sans pagination — lent et potentiellement bloquant.
- 🟡 Colonne IP affichée en clair — donnée sensible sans masquage partiel ni avertissement RGPD.

### Parrainages

- 🟠 `onError` de `requestQuota.mutate` silencieux — l'utilisateur ne sait pas si sa demande a échoué.
- 🟡 Pas de skeleton loader — les cartes apparaissent brusquement après le spinner.

### Paramètres

- 🔴 `void handleInvite()` ligne 752 — anti-pattern, les erreurs async sont ignorées sans catch.
- 🟠 Chargement initial de `users` sans gestion d'erreur — formulaire profil vide silencieusement si la query échoue.
- 🟡 `bg-purple-100 text-purple-700` pour badges rôles équipe — hardcodé, non thémable.

---

### AdminDashboard

- 🟠 Aucun état d'erreur pour le widget "santé" — silencieusement vide si la requête échoue.
- 🟡 Clé React composite `${userId}-${priority}-${i}` — fragile, peut causer des problèmes de réconciliation.
- 🟡 Dots de priorité `bg-red-500`, `bg-orange-500`… — couleurs hardcodées non sémantiques.

### AdminComptes

- 🟠 `Promise.all` sans gestion d'erreur individuelle — un échec partiel vide tout le panneau de fiche utilisateur.
- 🟡 `bg-purple-100 text-purple-700` pour rôles `agence_standard`/`agence_pro` — hardcodé.
- 🟡 Recherche par email uniquement — pas de recherche par nom ou plan.

### AdminPlans

- 🟠 Features du plan stockées comme JSON mais affichées sans parsing — expérience de lecture dégradée.
- 🟠 Toggles `actif`/`populaire` sans feedback d'erreur réseau — état UI et DB peuvent diverger.
- 🟡 Prix et durée sans validation min/max dans l'UI — accepte 0 ou valeur négative.

### AdminLicences

- 🟠 Clé de licence générée côté client (timestamp + random) — non cryptographiquement sûr.
- 🟠 Query `license_keys` sans état d'erreur — table silencieusement vide si Supabase échoue.
- 🟡 Badge "Utilisée" en `bg-slate-100 text-slate-700` — incohérent avec les tokens `bg-muted`.

### AdminSecurity

- 🟠 Filtre appliqué côté client uniquement — tous les logs chargés en mémoire.
- 🟡 Pas de filtre par date ni par succès/échec — granularité insuffisante pour une investigation.
- 🟡 IP affichée en clair — donnée sensible sans masquage.

### AdminEmails

- 🔴 Comptage destinataires (`computeDestinataires`) non affiché pendant la création — l'admin ne sait pas combien seront touchés avant d'enregistrer.
- 🟠 Champ `corps` non validé — email envoyable sans contenu.
- 🟡 Textarea brut sans prévisualisation — rendu final non vérifiable avant envoi.

### AdminParrainages

- 🔴 `onError` des mutations approve/reject sans toast — si Supabase échoue, aucun retour visuel pour l'admin.
- 🟠 `navigator.clipboard` sans fallback — copie silencieusement ratée sur HTTP ou anciens navigateurs.
- 🟡 `text-amber-700` hardcodé pour le countdown auto-approve.

### AdminContrats

- 🟠 `<label>` wrappant `<Button asChild>` — éléments interactifs imbriqués, problème d'accessibilité clavier.
- 🟠 Upload signature peut échouer silencieusement si CORS bloque le `fetch`.
- 🟡 Aucune pagination des contrats signés — liste plate potentiellement longue.

### AdminFacturation

- 🟠 Conversion SVG → PNG pour logo peut échouer silencieusement — PDF généré sans logo sans alerte.
- 🟡 `bg-green-100` / `bg-red-100` pour indicateurs de tendance — hardcodés, non thémables.
- 🟡 Reset formulaire avec valeurs hardcodées — fragile si le schéma évolue.

### AdminPlateforme

- 🔴 Aucun feedback si le format des tiers de parrainage est invalide lors de la sauvegarde — JSON parse silencieux.
- 🟠 Pas de confirmation avant écrasement du template WhatsApp — perte possible de contenu personnalisé.
- 🟡 Valeurs des tiers sans validation (accepte 0, négatif, non-entier).

---

## 3. Récapitulatif priorités

| Priorité | Nombre | Exemples clés |
|----------|:------:|---------------|
| 🔴 Critique | 6 | Comptabilité Promise.all sans erreur, Journal sans erreur, Settings void handleInvite, AdminEmails comptage invisible, AdminParrainages mutations muettes, AdminPlateforme JSON silencieux |
| 🟠 Important | 21 | Formulaires sans RHF/Zod, Preview isFreemium hardcodé, Journal pagination, AdminLicences clé non sûre, AdminContrats accessibilité label/button… |
| 🟡 Mineur | 25 | Couleurs hardcodées résiduelles, usePageTitle manquants, dark mode landing, typo conventions… |

**Top 5 fixes recommandés en priorité :**
1. 🔴 `Comptabilité` — entourer le `Promise.all` d'un `try/catch` avec toast + état d'erreur UI.
2. 🔴 `Journal` — ajouter `try/catch` dans `fetchActivityLogs` + toast.error.
3. 🔴 `AdminParrainages` — ajouter `onError: () => toast.error(...)` aux mutations approve/reject.
4. 🔴 `Settings` — remplacer `void handleInvite()` par `handleInvite().catch(e => toast.error(e.message))`.
5. 🔴 `AdminPlateforme` — valider les tiers JSON avant sauvegarde + toast.error si invalide.
