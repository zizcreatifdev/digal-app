# UX/UI Audit — Partie 1
_Pages publiques & authentification_
_Date : 2026-04-24 — Basé sur inspection complète du code source_

---

### Landing page (`LandingPage.tsx` + `src/components/landing/`)

✅ Responsive soigné (`text-4xl md:text-6xl lg:text-7xl`, breakpoints cohérents)
✅ Icônes 100 % Lucide, font-serif/font-sans correctement répartis dans les sections
✅ Countdown, CTA, MockupsSection, PricingSection intégrés — fonctionnalités complètes

⚠️ Aucune classe `dark:` dans les composants landing — la page ne s'adapte pas au mode sombre
⚠️ `<h1>` dans HeroSection n'a pas `font-serif` sur le tag lui-même (seulement sur un `<span>` interne)
⚠️ `usePageTitle` absent dans `LandingPage.tsx` → l'onglet du navigateur affiche le titre générique Vite

❌ `HeroSection` : le compteur uses `font-serif` dans un `<span>` au lieu de balise sémantique (`<time>`)
❌ Aucun `<meta name="description">` dynamique — SEO non géré côté composant

---

### Waitlist (`Waitlist.tsx`)

✅ `usePageTitle("Digal · Liste d'attente")` présent
✅ Loader2 sur le bouton de soumission, états de succès avec icône CheckCircle
✅ Mise en page split desktop/mobile identique à Login — cohérence visuelle

⚠️ Sélecteur Solo/Agence : `rounded-lg border-2` sur les cartes de choix — devrait être `rounded-xl` pour cohérence
⚠️ Formulaire géré avec `useState` direct, pas React Hook Form + Zod — inconsistant avec le reste de l'app
⚠️ Pas de message d'erreur en ligne sur les champs (uniquement `toast.error`) — accessibilité réduite

❌ Validation email uniquement côté Supabase — aucune validation front avant soumission
❌ Le lien "Se connecter" en bas de page (`text-primary hover:underline`) n'utilise pas `<Button variant="link">` — inconsistant

---

### Activation de compte (`/activate/:token` — `Activate.tsx`)

✅ Tous les états couverts : loading · lien invalide · expiré · déjà activé · succès · formulaire
✅ Icônes sémantiques cohérentes (XCircle / Clock / CheckCircle) pour chaque état
✅ `font-serif` sur tous les titres d'état, `font-sans` sur les paragraphes

⚠️ `ios-scroll-container` présent — cohérent avec Login, mais absent de Register et Waitlist
⚠️ `text-amber-500` et `text-emerald-500` hardcodés — devraient utiliser `text-warning` / `text-success` (tokens définis dans `index.css`)
⚠️ Aucun `usePageTitle` → l'onglet affiche le titre générique du layout

❌ Pas d'`aria-live="polite"` sur la zone d'état — les transitions d'états ne sont pas annoncées aux lecteurs d'écran
❌ Formulaire utilise React Hook Form mais sans message d'erreur visible sous chaque champ pour tous les cas

---

### Login (`Login.tsx`)

✅ `usePageTitle("Digal · Connexion")` présent, layout split desktop cohérent
✅ Loader2 sur le bouton de soumission, gestion des erreurs via `toast.error`
✅ Lien "Mot de passe oublié" intégré dans le formulaire sans navigation

⚠️ `ios-scroll-container` présent ici mais absent de Register — inconsistance entre pages d'auth
⚠️ "Mot de passe oublié" utilise `<button>` natif stylé manuellement (`text-xs text-primary hover:underline`) au lieu de `<Button variant="link">`
⚠️ Pas d'`autocomplete="current-password"` sur le champ mot de passe — mauvaise pratique UX/sécurité

❌ Le panneau gauche hero affiche "Digal" en `text-5xl font-bold font-serif text-primary-foreground` mais le panneau droit affiche aussi "Digal" en `text-4xl` — duplication du logo/nom sur la même page
❌ Aucune indication visuelle de la force du mot de passe lors de la saisie

---

### Page parrainage (`/ref/:code` — `ReferralLanding.tsx`)

✅ `usePageTitle("Digal · Invitation parrainage")` présent, Loader2 cohérent
✅ Progression 5 slides avec indicateur visuel (points `rounded-full`), `ArrowLeft/ArrowRight` clairs
✅ Formulaire complet (prénom, nom, email, mot de passe, plan) avec labels et champs bien structurés

⚠️ `console.error("[ReferralLanding] profile error:", profileError)` — log de debug laissé en production
⚠️ Slide "Lien invalide" : icône dans `bg-destructive/10` — cohérent, mais le texte `"Ce lien de parrainage est invalide."` sans suggestion d'action (contacter le parrain, retourner à l'accueil)
⚠️ Pas de validation de force du mot de passe ni d'indicateur visuel avant soumission

❌ `console.error` en production — doit être supprimé ou remplacé par un logger silencieux
❌ Formulaire sans React Hook Form / Zod — validation uniquement via `toast.error` après soumission Supabase, pas de feedback champ par champ

---

## Synthèse Partie 1

| Page | `usePageTitle` | `font-serif` h1 | Loading | Dark mode | Formulaire RHF+Zod |
|------|:-:|:-:|:-:|:-:|:-:|
| Landing | ❌ | ⚠️ (span) | n/a | ❌ | n/a |
| Waitlist | ✅ | ✅ | ✅ | ✅ (CSS vars) | ❌ |
| Activate | ❌ | ✅ | ✅ | ✅ (CSS vars) | ⚠️ partiel |
| Login | ✅ | ✅ | ✅ | ✅ (CSS vars) | ✅ |
| /ref/:code | ✅ | ✅ | ✅ | ✅ (CSS vars) | ❌ |

**Problèmes transversaux détectés :**
- `ios-scroll-container` incohérent (Login + Activate oui / Waitlist + Register non)
- Couleurs sémantiques hardcodées (`text-amber-500`, `text-emerald-500`) au lieu de tokens CSS (`text-warning`, `text-success`)
- `console.error`/`console.log` en production à nettoyer
- Boutons de type "lien" non stylés via `<Button variant="link">` dans plusieurs pages
