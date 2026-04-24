# Rapport d'analyse design — Inspiration Momentum UI

Source : 16 captures du produit **Momentum** (SaaS workspace management).
Palette orange/noir chaleureux, double mode clair/sombre, mobile-first.

---

## Section 1 — Typographie + Couleurs

**Ce qu'on voit :**
- Police unique : **Outfit** (Google Fonts) — Light, Regular, Medium, SemiBold
- Chiffres KPI affichés très grands (48–64px), SemiBold, quasi-display
- Labels de section : petits, uppercase, letter-spacing, gris clair
- Palette : `#130400` (noir chaud), `#1B0B03` (brun sombre), `#FF5300` (Signal Orange), crème `#FAF7F4`
- Teintes orange dégradées : de la pêche douce jusqu'à l'orange vif pour les états actifs
- Le texte secondaire utilise un gris chaud (jamais un gris pur)

**Adaptation Digal :**
- Ajouter `Outfit` comme `font-sans` dans `tailwind.config.ts` (remplace Inter/system-ui)
- Garder `#C4522A` comme primaire mais enrichir la palette : ajouter `#FF5300` pour hover/CTA forts
- Introduire `#FAF7F4` comme `bg-muted` en light mode (plus chaud que le gris actuel)
- Fichiers : `tailwind.config.ts`, `src/index.css`, `globals.css`

---

## Section 2 — Arrondis + Effets visuels

**Ce qu'on voit :**
- Cards : `rounded-2xl` (16–20px) systématiquement — jamais sharp, jamais trop rond
- Boutons/pills nav actifs : `rounded-full` — pill complet
- Cellules heatmap : `rounded-lg` (~8px) pour les carrés du calendrier
- Textures : **hachures diagonales** sur les zones de graphique (effet tissu/woven)
- Dark mode : fond `#130400`, cards `#1E1208`, border 1px orange foncé subtil
- Ombres light mode : `shadow-sm` très doux, diffus, warm (pas de noir pur)
- Glassmorphism discret en dark mode sur quelques cartes flottantes

**Adaptation Digal :**
- Standardiser toutes les cards sur `rounded-2xl` (actuellement mixte `xl`/`2xl`)
- Ajouter la texture hachures aux graphiques donut des KPI (`bg-[repeating-linear-gradient]`)
- Préparer les tokens dark mode dans `src/index.css` (variables CSS HSL)
- Fichiers : `src/components/ui/card.tsx`, `src/pages/KpiReportsPage.tsx`, `src/index.css`

---

## Section 3 — Cards + Layout

**Ce qu'on voit :**
- Cards KPI : icône colorée (pill icon) + titre + grand chiffre + `±X% vs semaine précédente`
- Bouton "View all" + icône refresh en top-right de chaque card
- Grille principale : 2–3 colonnes de cards KPI, 1 grande card hero à droite
- Séparation visuelle : pas de bordures dures entre sections, espacement généreux
- Card hero centrale : image/gradient plein + texte blanc overlay (pas de fond uni)
- Upgrade CTA : card pleine largeur orange en bas de sidebar

**Adaptation Digal :**
- Ajouter delta `±%` sur les KpiCards (comparaison semaine/mois précédent)
- Ajouter icône refresh individuelle par card KPI
- Card "Weekly Workload" heatmap pour le calendrier posts → voir Section 4
- Fichiers : `src/pages/KpiReportsPage.tsx`, `src/components/DashboardLayout.tsx`

---

## Section 4 — Calendrier + Navigation

**Ce qu'on voit :**
- **Heatmap "Weekly Workload"** : grille (lignes = ressources/réseaux, colonnes = jours)
  Couleurs : pêche (Low) → orange moyen (Medium) → orange vif (High) → orange foncé (Full)
- Mini-calendrier mensuel inline : date active = cercle orange `rounded-full`
- **Sidebar** : logo → sections GENERAL/MORE/INTERACTIONS en uppercase gris → items icon+label
- Item actif sidebar : fond orange pill full-width, texte blanc
- Avatars contacts en bas de sidebar, bouton "Upgrade to PRO" orange en tout dernier

**Adaptation Digal :**
- Ajouter une vue heatmap au calendrier éditorial (fréquence de posts par réseau/jour)
- Remplacer la mise en évidence `bg-primary/10` actuelle par pill orange `rounded-full`
- Ajouter groupes de sections dans la sidebar (CLIENTS, CONTENU, FACTURATION…)
- Fichiers : `src/components/DashboardLayout.tsx`, `src/pages/Calendrier.tsx`

---

## Section 5 — Mobile + Animations

**Ce qu'on voit :**
- **Bottom tab bar** (5 onglets) : icônes outline, onglet actif = carré orange `rounded-xl`
- Fond mobile light : crème `#FAF7F4`, pas de blanc pur
- Fond mobile dark : `#130400` profond, cards légèrement plus claires
- Contenu scrollable verticalement, cards empilées en colonne unique
- "Monthly" dropdown en top-left avec icône calendrier (sélecteur de période)
- Transitions : fade + légère translation Y (inférée des screenshots marketing)

**Adaptation Digal :**
- Améliorer la bottom bar mobile : ajouter indicateur actif avec fond orange `rounded-xl`
- Sélecteur de période (semaine/mois) en top de la vue mobile dashboard
- Assurer fond `#FAF7F4` / `bg-[#FAF7F4]` sur les pages mobiles au lieu de `bg-background` pur
- Fichiers : `src/components/DashboardLayout.tsx`, `src/pages/Dashboard.tsx`

---

## Section 6 — Recommandations prioritaires

Classées par impact visuel / effort d'implémentation :

| Priorité | Action | Effort | Impact |
|----------|--------|--------|--------|
| 🔴 1 | Ajouter **Outfit** comme font-sans (`tailwind.config.ts` + Google Fonts) | 30 min | Très fort |
| 🔴 2 | Fond crème `#FAF7F4` en light mode (`bg-muted`, `bg-background` dans `index.css`) | 15 min | Fort |
| 🔴 3 | Sidebar : pills actives `rounded-full` orange + groupes de sections | 1h | Fort |
| 🟠 4 | Cards KPI : delta `±%` + icône refresh + icon pill colorée | 1h30 | Fort |
| 🟠 5 | Heatmap calendrier (fréquence posts par réseau/jour) sur `Calendrier.tsx` | 3h | Fort |
| 🟡 6 | Standardiser `rounded-2xl` sur toutes les cards | 30 min | Moyen |
| 🟡 7 | Bottom bar mobile : indicateur actif fond orange `rounded-xl` | 30 min | Moyen |
| 🟡 8 | Texture hachures sur graphiques donut KPI | 1h | Moyen |
| 🟢 9 | Préparer tokens dark mode (variables HSL warm) dans `index.css` | 2h | Long terme |
| 🟢 10 | Greeting personnalisé "Bonjour [prénom]" en haut du dashboard | 20 min | Expérience |

**Note couleurs :** L'orange inspiration `#FF5300` est plus vif que le `#C4522A` actuel de Digal.
Conserver `#C4522A` comme brand color, utiliser `#FF5300` uniquement pour hover/états actifs forts.

---

## Section 7 — Glassmorphism (détail)

**Ce qu'on voit :**
- Utilisé sur : carte flottante "Development 1,302" (img03), hero card centrale (img11/14/15), top bar en dark mode
- Technique : fond semi-transparent `~rgba(20,10,5,0.82)` + `backdrop-blur` ~8–12px (`blur-sm` à `blur-md`)
- Bordure glass : `1px solid rgba(255,140,60,0.12)` — orange très désaturé, à peine visible
- En light mode : pas de vrai glassmorphism — les cards sont opaques blanc/crème
- En dark mode : la card hero laisse transparaître le fond lumineux orange derrière elle
- Opacité background : ~80–85 % — le contenu reste lisible, le fond filtre juste

**Adaptation Digal :**
- Appliquer aux modals en dark mode : `bg-[#1A0E08]/85 backdrop-blur-md border border-white/5`
- Appliquer à la topbar sticky des pages publiques (PreviewPage) : `bg-white/80 backdrop-blur-xl` (déjà partiellement fait)
- Ne pas abuser : réserver au dark mode et aux éléments flottants (tooltips, modals, popovers)
- Fichiers : `src/pages/PreviewPage.tsx`, `src/components/ui/dialog.tsx`, `src/index.css`

---

## Section 8 — Arrondis (border-radius détaillé)

**Relevé précis image par image :**
- **Cards** : `rounded-2xl` — ~16–20px, visible sur toutes les KPI cards (img05, img11, img12)
- **Boutons primaires** : `rounded-full` — pill complet, ex. "Upgrade to PRO", "Enregistrer" (img07)
- **Inputs / dropdowns** : `rounded-lg` (~8–10px) pour les champs texte ; `rounded-full` pour le sélecteur "Monthly" (img04/10)
- **Modals** : non visibles directement — par cohérence avec les cards : `rounded-2xl` ou `rounded-3xl`
- **Sidebar items actifs** : `rounded-full` pill pleine largeur (img11/16)
- **Sidebar items inactifs** : pas de background, pas de radius visible
- **Heatmap cells** : `rounded-lg` ~8px (img12), carrés avec coins légèrement arrondis
- **Badges / tags** : `rounded-full` — ex. point coloré légende heatmap, badge notification
- **Icônes dans cards** : conteneur `rounded-xl` ou `rounded-full` selon la forme
- **Bottom tab actif (mobile)** : `rounded-xl` ~12px — carré orange avec coins arrondis (img04/10)

**Adaptation Digal :**
- Audit et standardisation : cards → `rounded-2xl`, boutons → `rounded-full`, inputs → `rounded-lg`
- Sidebar active pill : passer de `rounded-md` à `rounded-full` dans `DashboardLayout.tsx`
- Fichiers : `src/components/DashboardLayout.tsx`, `src/components/ui/button.tsx`, `src/components/ui/input.tsx`

---

## Section 9 — Shadows (ombres)

**Ce qu'on voit :**
- **Light mode** : ombres très douces, presque imperceptibles — équivalent `shadow-sm` (`0 1px 4px rgba(0,0,0,0.06)`)
- Jamais d'ombre noire pure — toujours teintée chaud : `rgba(80,30,10,0.08)`
- Les cards ne "flottent" pas — elles reposent sur le fond, ombre rasante uniquement
- Les boutons CTA orange ont une ombre colorée : `0 4px 12px rgba(196,82,42,0.25)` (glow chaud)
- **Dark mode** : zéro box-shadow visible — l'élévation est rendue par la différence de couleur de fond
- Bordure `1px solid rgba(255,255,255,0.06)` remplace l'ombre en dark mode
- La sidebar n'a pas d'ombre — intégrée dans le layout, pas flottante

**Adaptation Digal :**
- Remplacer `shadow-md` générique par `shadow-[0_2px_8px_rgba(80,30,10,0.08)]` sur les cards
- Ajouter glow sur les boutons primaires : `shadow-[0_4px_14px_rgba(196,82,42,0.3)]`
- En dark mode : supprimer les shadows, ajouter `border border-white/5` sur les cards
- Fichiers : `src/components/ui/card.tsx`, `src/components/ui/button.tsx`, `src/index.css`

---

## Section 10 — Calendrier détaillé

**Ce qu'on voit (img12 — Weekly Workload) :**
- Widget card `rounded-2xl`, fond blanc/crème, padding généreux
- En-tête : icône orange + titre bold + "View all" lien gris + icône refresh
- Légende horizontale : 4 niveaux avec point coloré + label (`Low / Medium / High / Fully Occupied`)
- Grille : lignes = identifiants (FEB, FT1, FKG…), colonnes = numéros de jours (18 → 29)
- Cellules vides (Low) : **texture hachures diagonales** — lignes obliques orange très clair sur fond crème
- Cellules Medium : orange clair uni `~#EAAA88`
- Cellules High : orange soutenu `~#C4522A`
- Cellules Full : orange foncé `~#8B3010`
- Taille cellule : ~32px × 32px, `rounded-lg` ~8px, gap ~3–4px entre cellules
- Pas d'état hover visible dans les captures — probablement tooltip on hover

**Mini-calendrier mensuel (img04/10) :**
- Ligne de jours Mon–Sun, chiffres en texte gris clair
- Date active : cercle orange plein `rounded-full`, texte blanc
- Flèches `<` `>` pour naviguer entre mois, titre mois centré bold

**Adaptation Digal :**
- Calendrier éditorial : ajouter vue heatmap (lignes = réseaux, colonnes = jours du mois)
- Statut couleurs : `brouillon` = crème haché, `en_attente` = orange clair, `programmé` = orange, `publié` = orange foncé
- Tooltip on hover : afficher titre du post + statut + réseau
- Fichiers : `src/pages/Calendrier.tsx`, nouveau composant `src/components/calendar/HeatmapView.tsx`

---

## Section 11 — Responsive mobile

**Ce qu'on voit (img04 light, img09 dark, img10 light clean) :**
- **Sidebar** : complètement absente sur mobile — remplacée par bottom tab bar 5 onglets
- **Bottom bar** : icônes outline gris, actif = fond orange `rounded-xl` avec icône blanc
- **Cards** : empilées en colonne unique, pleine largeur, même `rounded-2xl`
- **Topbar mobile** : sélecteur période (pill "Monthly" + icône calendrier) à gauche + cloche + avatar à droite
- **Mini-calendrier** : inline dans le scroll, occupe toute la largeur, compact
- **Fond** : crème `#FAF7F4` (light) ou `#130400` (dark) — jamais blanc pur ni gris neutre
- Pas de hamburger menu, pas de drawer latéral — navigation 100 % bottom bar

**Adaptation Digal :**
- Masquer la sidebar sous `md:` — afficher bottom bar sur `< md`
- Bottom bar : 5 icônes (Dashboard, Clients, Calendrier, Facturation, Profil)
- Indicateur actif : `bg-primary rounded-xl p-2` autour de l'icône active
- Fichiers : `src/components/DashboardLayout.tsx` (breakpoint sidebar), nouveau `src/components/BottomNav.tsx`

---

## Section 12 — Animations et transitions

**Ce qu'on voit et ce qu'on infère :**
- **Cards à l'entrée** : fade-in + `translateY(10–16px)` → `translateY(0)`, durée ~300–400ms, `ease-out`
- **Compteurs KPI** : animation count-up de 0 vers la valeur finale (standard pour ce type de dashboard)
- **Heatmap cells** : apparition en stagger (délai progressif colonne par colonne), ~20ms par cellule
- **Graphique donut/bar** : fill progressif depuis 0 %, ~600ms
- **Theme toggle light↔dark** : transition CSS `color-scheme`, toutes les couleurs en `transition-colors 200ms`
- **Sidebar item hover** : léger fond `bg-primary/8`, transition ~150ms
- **Boutons hover** : légère élévation `scale(1.02)` + ombre légèrement renforcée, ~150ms
- **Bottom tab switch** : fond orange glisse / fade d'un onglet à l'autre, ~200ms
- **Loading** : pas de spinner visible — probablement skeleton screens en forme de cards

**Adaptation Digal (avec Framer Motion déjà présent) :**
- Cards dashboard : `initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3, delay: index*0.05 }}`
- KPI counters : utiliser `useSpring` ou `animate` de Framer pour count-up
- Heatmap cells : `staggerChildren: 0.015` dans le container
- Fichiers : `src/pages/Dashboard.tsx`, `src/pages/KpiReportsPage.tsx`, `src/components/calendar/HeatmapView.tsx`
