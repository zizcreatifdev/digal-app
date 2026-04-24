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
