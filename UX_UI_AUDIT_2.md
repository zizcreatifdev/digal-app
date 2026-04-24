# Audit UX/UI — Partie 2 : Dashboard CM · Clients · Calendrier · Preview · Facturation

---

### Dashboard CM (`src/pages/Dashboard.tsx`)
✅ Hero card contextuel (contenu adapté matin/après-midi/soir) avec valeur centrale chiffrée et CTA
✅ 4 KPI cards GlassCard avec DeltaBadge semaine précédente et spinners Loader2 inline
✅ Widget "À publier aujourd'hui" — marquage "Publié" actionnable sans quitter le dashboard

⚠️ Couleurs hardcodées dans `ACTIVITY_COLOR_MAP` / `ACTIVITY_BG_MAP` (`bg-blue-100`, `bg-violet-100`…) — non sémantiques, pas supportées en dark mode
⚠️ Hero card `style={{ background: "linear-gradient(135deg, #E8511A…)" }}` — couleurs hardcodées, non thémables
⚠️ `(supabase as any)` lignes 163 et 211 — contourne le typage généré, supprime la sécurité TS

❌ `fetchStats` silently catch sans feedback UI — si la requête échoue, les KPI restent à 0 sans toast ni message d'erreur
❌ Emoji `👋` hardcodé dans le JSX (ligne 350) — contrevient à la convention CLAUDE.md ("uniquement si demandé")

---

### Clients (`src/pages/Clients.tsx`)
✅ React Query (`useQuery` + invalidation) bien câblé — cache partagé avec ClientDetail
✅ États vides actionnables : empty state actifs → CTA "Ajouter votre premier client" affiché directement
✅ Tabs Actifs / Archivés avec badge count mis à jour en temps réel

⚠️ `networkMap` chargé via `useEffect` standalone (Supabase direct) — pas en React Query, pas de cache, refetch à chaque remontage
⚠️ Aucun filtre / recherche par nom — UX dégradée dès 10+ clients
⚠️ `h1` ligne 92 : `text-3xl font-bold tracking-tight` sans `font-serif` — incohérence avec toutes les autres pages

❌ Onglet "Archivés" n'affiche pas de spinner pendant le chargement (même `loading` que l'onglet actifs, mais le contenu archived s'affiche vide sans indicateur)
❌ Pas de pagination ni virtualisation — liste plate potentiellement illimitée

---

### Calendrier éditorial (`src/pages/CalendarPage.tsx`)
✅ Auto-sélection du premier client au chargement — zéro friction pour démarrer
✅ Support `assigned_cm` — CM externe voit les clients qui lui sont assignés
✅ Networks rechargés dynamiquement à chaque changement de client sélectionné

⚠️ État chargement : `<p className="text-muted-foreground text-sm">Chargement...</p>` (ligne 84) — devrait être Loader2
⚠️ Fallback couleur `"#C4522A"` hardcodé ligne 93 — devrait être `var(--primary)` ou token CSS
⚠️ `(supabase.from("clients") as any)` ligne 29 — contourne le typage généré

❌ Condition `profileRole === undefined` (ligne 27) incorrecte — initial state est `null`, pas `undefined`, le useEffect peut se déclencher avant que le rôle soit chargé
❌ Aucune gestion d'erreur si la query clients échoue — liste silencieusement vide

---

### Page Preview client (`src/pages/PreviewPage.tsx`)
✅ Timeout 15 s sur toutes les requêtes Supabase + `previewClient` sans auth — robuste en accès public
✅ Countdown temps réel vers expiration du lien — UX orientée client très utile
✅ `NetworkMockup` par réseau + `AnimatePresence` — expérience de validation premium

⚠️ Nombreuses couleurs hardcodées : `bg-[#FAFAF8]`, `from-[#C4522A]`, `bg-green-600`, `bg-amber-50` — page non thémable
⚠️ `isFreemium = true` (ligne 56) hardcodé — watermark Digal toujours affiché, logique conditionnelle absente
⚠️ Stats cards lignes 432-435 : `bg-gray-50`, `bg-green-50`, `bg-red-50`, `bg-amber-50` — couleurs hardcodées

❌ `handleValidateAll` / `handleRefuseAll` : boucle `for…of` séquentielle (lignes 213-219, 232-237) — N requêtes séquentielles au lieu d'un `Promise.all` — lent avec beaucoup de posts
❌ Bouton "Envoyer le commentaire" désactivé si commentaire vide mais `handleRefusePost` accepte un commentaire vide — incohérence UX/API

---

### Facturation (`src/pages/Facturation.tsx`)
✅ Gestion Freemium complète : rendu bloqué proprement avec Lock icon, message clair et CTA licence
✅ Navigation depuis ClientDetail via `location.state` — pré-remplit le client et ouvre le modal automatiquement
✅ Tabs devis / factures avec count dynamique en entête

⚠️ Chargement affiché avec `<p>Chargement...</p>` (lignes 121, 129) — devrait être Loader2 (incohérence avec les autres pages)
⚠️ Onglet "Récurrent" visible avec "Bientôt disponible" — frustrant UX, devrait être masqué ou `disabled`
⚠️ `profileRole` / `profilePlan` chargés via useState/useEffect — duplique le pattern `getAccountAccess` déjà utilisé ailleurs

❌ `isFreemium = profileRole === "freemium" && !profilePlan` (ligne 42) — logique dupliquée de `getAccountAccess()` — source de désynchronisation
❌ Aucune gestion d'erreur si `fetchDocuments` échoue — liste silencieusement vide
