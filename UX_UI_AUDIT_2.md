# UX/UI Audit — Partie 2
_Dashboard CM, Clients, Calendrier, Preview, Facturation_
_Date : 2026-04-24_

---

### Dashboard CM (`Dashboard.tsx`)

✅ `isFreemium` calculé dynamiquement via `getAccountAccess(profile)` — correct
✅ GlassCard + spotlight, KPI grid `md:grid-cols-2 lg:grid-cols-4`, dark: variants sur les fonds d'icônes
✅ "À publier aujourd'hui" : empty state avec icône `<CheckCircle2>` — meilleure pratique de l'app

⚠️ H1 salutation : `font-semibold` au lieu de `font-bold` — incohérent avec toutes les autres pages
⚠️ Hero card : `style={{ background: "linear-gradient(135deg, #E8511A 0%, #C4522A 100%)" }}` — inline style hardcodé, non thématisable
⚠️ Couleurs d'activité (`text-emerald-600`, `text-violet-600`…) sans `dark:` — lisibilité dégradée en mode sombre

❌ "Activité récente" empty state : `<p>Aucune activité récente.</p>` sans icône — incohérent avec "À publier"
❌ KPI icon containers : `rounded-xl` (40×40px) mais les GlassCard sous-jacentes utilisent `rounded-2xl` — mélange de rayons

---

### Clients — liste (`Clients.tsx`)

✅ Grid `sm:grid-cols-2 lg:grid-cols-3`, Loader2 centré, limite freemium gérée proprement
✅ `ClientLogoButton` intégré dans `ClientCard` — logo éditable au survol, overlay Camera
✅ Onglets Actifs / Archivés avec compteurs clairs

⚠️ H1 "Clients" : `text-3xl font-bold tracking-tight` sans `font-serif` — incohérent avec Dashboard, Facturation, Calendrier
⚠️ Empty state actifs : texte seul, aucune icône (ex. `<Users>`) ni appel à l'action proéminent
⚠️ Empty state archivés : idem, texte seul

❌ Aucun tri ni filtre par réseau social sur la liste — pour les agences avec 10+ clients, navigation difficile
❌ Bouton "Ajouter un client" sans `size="sm"` sur mobile — déborde du layout sur petits écrans

---

### Clients — fiche (`ClientDetail.tsx`)

✅ Header responsive `flex-col sm:flex-row`, actions `flex-wrap gap-2` — solide sur mobile
✅ `ClientLogoButton size="lg"` — logo éditable au clic depuis la fiche, DB + état local mis à jour
✅ Tabs complets : Calendrier · Liens · Boîte dépôt · Factures · Rapport KPI

⚠️ H1 nom du client : `text-2xl font-bold tracking-tight truncate` sans `font-serif` — incohérent
⚠️ Barre de progression mensuelle : `bg-emerald-500` hardcodé — devrait utiliser `bg-success`
⚠️ Barre progress container : `rounded-lg` au lieu de `rounded-full` — incohérent avec l'UI

❌ Tab "Factures" visible pour tous y compris freemium, affiche `"La facturation sera bientôt disponible ici."` — crée une attente non satisfaite
❌ La couleur secondaire du client s'affiche via `title` tooltip uniquement — aucun label visible

---

### Calendrier éditorial (`CalendarPage.tsx`)

✅ H1 `font-serif` présent, délégation propre à `<EditorialCalendar>` — séparation des responsabilités
✅ Filtrage par client avec `<Select>` shadcn, gestion du rôle CM (clients assignés uniquement)
✅ Aucun `console.log` ni couleur hardcodée dans le wrapper de page

⚠️ État chargement : `<p className="text-muted-foreground text-sm">Chargement...</p>` sans `<Loader2>` — incohérent
⚠️ Quand aucun client sélectionné après chargement : retourne `null` sans aucun message d'état vide
⚠️ `<Select>` client sans `className` de largeur responsive — peut déborder sur petits écrans

❌ Pendant le chargement initial, la page entière retourne avant le layout → flash sans navigation visible
❌ Si l'utilisateur n'a aucun client, rien ne s'affiche et rien ne l'invite à en créer un

---

### Lien de prévisualisation (`PreviewPage.tsx`)

✅ Container `max-w-4xl mx-auto px-4`, onglets réseaux avec `overflow-x-auto` scroll mobile
✅ Empty state posts vides avec icône `<Inbox>`, états finaux (Merci / Expiré) avec icônes sémantiques
✅ `font-serif` sur les titres d'état, `font-sans` sur le corps — convention respectée

⚠️ Grille stats : `grid grid-cols-4` sans breakpoint responsive — 4 colonnes cramped < 380px
⚠️ Boutons Valider/Refuser : `bg-green-600`/`bg-red-600` hardcodés — contournent entièrement le système de variants
⚠️ Spinner de chargement : `<div className="border-[3px] border-gray-200 animate-spin">` au lieu de `<Loader2>` — incohérent

❌ `const isFreemium = true` **hardcodé ligne 56** — le watermark "Créé avec Digal" s'affiche toujours, même pour les comptes payants
❌ Zéro classe `dark:` sur toute la page — `bg-[#FAFAF8]`, `text-gray-*`, `bg-white` partout — page cassée en mode sombre

---

### Facturation (`Facturation.tsx`)

✅ `isFreemium` correctement calculé depuis le profil, `<ProUpgradeModal>` bien intégré
✅ `font-serif` sur le H1, structure onglets Devis / Factures / Récurrent claire
✅ Limitation freemium avec message d'explication et CTA upgrade visible

⚠️ Double padding : `DashboardLayout` (`p-6`) + wrapper interne `p-6 space-y-6` → `48px` d'indentation au lieu de `24px`
⚠️ États de chargement (×2) : `"Chargement..."` en texte seul, sans `<Loader2>` — incohérent avec Dashboard et Clients
⚠️ Onglet "Récurrent" navigable et visible mais contenu 100 % placeholder

❌ Onglet "Récurrent" cliquable pour tous les plans → frustration UX garantie pour les utilisateurs payants
❌ Aucun empty state iconé pour les listes de devis/factures vides (premier accès ou après suppression)

---

## Synthèse Partie 2

| Page | `font-serif` H1 | Loader2 | Empty state iconé | Dark mode | Problème bloquant |
|------|:-:|:-:|:-:|:-:|:--|
| Dashboard CM | ✅ | ✅ | ⚠️ partiel | ⚠️ partiel | — |
| Clients liste | ❌ | ✅ | ❌ | ✅ | — |
| Clients fiche | ❌ | ✅ | n/a | ✅ | Tab Factures placeholder |
| Calendrier | ✅ | ❌ | ❌ | ✅ | Retour `null` silencieux |
| Preview | ✅ | ❌ | ✅ | ❌ | `isFreemium = true` hardcodé |
| Facturation | ✅ | ❌ | ❌ | ✅ | Double padding, tab placeholder |

**Top 3 bugs prioritaires :**
1. 🔴 `PreviewPage.tsx` ligne 56 : `const isFreemium = true` — watermark affiché pour TOUS les utilisateurs
2. 🔴 `PreviewPage.tsx` — zéro `dark:` class — page cassée en mode sombre
3. 🟠 `Facturation.tsx` + `CalendarPage.tsx` — loading states sans spinner — mauvaise perception de performance
