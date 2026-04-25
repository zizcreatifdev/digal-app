# DIAGNOSTIC — Phase 1 : Pages publiques + Auth

> Date : 2026-04-25  
> Périmètre : toutes les pages accessibles sans authentification  
> Mode : lecture seule — aucune modification

---

## Légende

| Symbole | Sens |
|---------|------|
| ✅ | Conforme / OK |
| ⚠️ | Problème mineur / amélioration suggérée |
| ❌ | Bug ou incohérence à corriger |

---

## 1. Landing (`/`) — `LandingPage.tsx` + sections

### Composants impliqués
`LandingPage.tsx`, `LandingHeader.tsx`, `HeroSection.tsx`, `MarqueeBanner.tsx`, `useCountdown.ts`

### Constats

| Point | Statut | Détail |
|-------|--------|--------|
| CTA principal | ✅ | Si `isLaunched` → "Créer mon compte" → `/waitlist` ; sinon "Rejoindre la liste" + "Découvrir Digal" (`#fonctionnalites`) |
| Compte à rebours | ⚠️ | Dépend d'une row dans `site_settings` (`show_countdown` + `launch_date`). Si la table est vide, le countdown n'apparaît jamais — pas d'erreur silencieuse mais comportement implicite |
| Logo header | ⚠️ | `LandingHeader.tsx` n'a pas de swap dark/light — logo noir uniquement (`_ennoir.svg.svg`). La landing n'a pas de ThemeToggle donc le mode clair est forcé : cohérent pour l'instant, à surveiller si dark mode est activé sur la landing |
| ThemeToggle landing | ⚠️ | Absent de `LandingHeader`. Normal aujourd'hui, mais à ajouter si le dark mode est exposé aux visiteurs |
| `MarqueeBanner` | ✅ | Animation via `requestAnimationFrame`, items triplés pour boucle infinie, `will-change-transform` présent |
| Ancres internes | ✅ | `#fonctionnalites` et `#tarifs` présents dans la nav desktop |

---

## 2. Waitlist (`/waitlist`) — `Waitlist.tsx`

### Constats

| Point | Statut | Détail |
|-------|--------|--------|
| Formulaire | ✅ | React Hook Form + Zod, validation correcte |
| Doublons email | ✅ | Erreur Supabase code `23505` interceptée, message "Email déjà inscrit" affiché |
| Logo desktop | ✅ | Logo blanc sur panneau gauche foncé (`_enblanc.svg`) — visuellement correct |
| Logo mobile | ⚠️ | Affiche du texte brut `Digal` (pas l'image logo) au lieu de l'image SVG |
| Vérification compte existant | ✅ | Appel à `users` + check statut avant insertion |
| Email transactionnel | ✅ | Appel non-bloquant à `send-transactional-email` edge function |

---

## 3. Login (`/login`) — `Login.tsx`

### Constats

| Point | Statut | Détail |
|-------|--------|--------|
| Formulaire | ✅ | React Hook Form + Zod |
| Logo | ✅ | Swap dark/light via `dark:content-[url(...)]` |
| `ios-scroll-container` | ✅ | Présent |
| Rate limiting | ✅ | 5 tentatives, verrouillage 15 min via refs (côté client) |
| Mot de passe min | ❌ | Min **8** caractères dans le schéma Zod — incohérent avec Register (voir §4) |
| Dialog "Mot de passe oublié" | ✅ | Email de reset envoyé via `supabase.auth.resetPasswordForEmail` |
| Gestion erreurs | ✅ | `toast.error()` pour toutes les erreurs Supabase |

---

## 4. Register (`/register`) — `Register.tsx`

### Constats

| Point | Statut | Détail |
|-------|--------|--------|
| Formulaire | ✅ | React Hook Form + Zod |
| Logo | ✅ | Swap dark/light |
| `ios-scroll-container` | ✅ | Présent |
| Accès par invitation uniquement | ✅ | Paramètre `?token` requis — `ShieldAlert` affiché si absent |
| Mot de passe min | ❌ | Min **6** caractères dans le schéma Zod — incohérent avec Login (min 8). À harmoniser à 8 |

---

## 5. Activation (`/activate/:token`) — `Activate.tsx`

### Constats

| Point | Statut | Détail |
|-------|--------|--------|
| États de la page | ✅ | 7 états couverts : `loading`, `invalid`, `expired`, `used`, `form`, `activating`, `success` |
| `typeLabel` | ✅ | Complet : `dm`, `cm`, `createur`, `solo`, `agence*`, `freemium` |
| Email conditionnel | ✅ | Affiché uniquement si `tokenRow.email` non vide (cas DM/onboarding sans email) |
| Redirect post-activation | ✅ | `getOnboardingDestination()` route vers `?onboarding=cm/createur/dm` selon `type_compte` + `localStorage.setItem("onboarding_role")` |
| Logo | ⚠️ | Mode clair uniquement — pas de swap dark (`_ennoir.svg.svg` sans `dark:content-[...]`) |
| `ios-scroll-container` | ✅ | Présent |
| Auto sign-in après activation | ✅ | `signInWithPassword` immédiatement après activation |

---

## 6. Compte Suspendu (`/compte-suspendu`) — `CompteSuspendu.tsx`

### Constats

| Point | Statut | Détail |
|-------|--------|--------|
| Logo | ✅ | `onError` fallback présent |
| Email de contact | ✅ | `contact@digal.sn` affiché |
| Icône | ✅ | `ShieldOff` — sémantiquement correct |
| Dark mode logo | ⚠️ | Pas de swap dark/light sur le logo |
| Navigation | ✅ | Bouton "Retour à l'accueil" → `/` |

---

## 7. Parrainage (`/ref/:code`) — `ReferralLanding.tsx`

### Constats

| Point | Statut | Détail |
|-------|--------|--------|
| Navigation entre slides | ✅ | 5 slides, progression cohérente |
| Code invalide | ❌ | Affiche `<h1>Digal</h1>` en texte brut au lieu de l'image logo |
| État chargement | ⚠️ | Uniquement un spinner sans logo ni texte de contexte |
| Formulaire d'inscription | ⚠️ | State contrôlé manuellement (pas React Hook Form + Zod) — validation basique, aucun feedback d'erreur structuré |
| `PricingSection` intégré | ✅ | Prop `onSelectPlan` câblée, saute à slide 4 (formulaire) |
| Logo slide principal | ✅ | Logo image présent sur les slides normaux |

---

## 8. Preview (`/preview/:slug`) — `PreviewPage.tsx`

### Constats

| Point | Statut | Détail |
|-------|--------|--------|
| Client Supabase Safari-safe | ✅ | `persistSession: false`, `autoRefreshToken: false`, `Accept: application/json` header |
| Timeout 15s | ✅ | `Promise.race([query, timeout])` sur tous les appels critiques |
| Compte à rebours expiration | ✅ | `setInterval` toutes les minutes, affichage en heures/minutes |
| Valider / Refuser par post | ✅ | Boutons inline, formulaire de commentaire animé (Framer Motion) |
| "Tout valider" / "Tout refuser" | ✅ | Batch sur `pendingPosts`, notifications CM créées |
| Notification CM | ✅ | Insert dans `notifications` sur refus (individuel + global) |
| Progression visuelle | ✅ | Barre en sticky header, `% reviewed` calculé sur `actions` |
| Filtre par réseau | ✅ | Visible si `availableNetworks.length > 1` |
| Watermark Freemium | ✅ | Badge Digal affiché si `isFreemium` |
| Logo | ⚠️ | Utilise `digal-logo.png` (asset importé) — pas de SVG ni dark mode, mais page publique sans thème |
| `ios-scroll-container` | ⚠️ | Absent — peut affecter le scroll sous iOS PWA avec clavier ouvert |
| État "lien expiré" | ✅ | `AlertTriangle` + date d'expiration formatée |
| État "déjà soumis" | ✅ | `PartyPopper` + message configurable depuis `site_settings.preview_thanks_message` |
| Empty state posts | ✅ | `Inbox` icon + message différencié (période vide vs filtre vide) |

---

## Synthèse des points à corriger (priorité)

### ❌ Bugs à corriger

| # | Fichier | Description |
|---|---------|-------------|
| B1 | `Register.tsx` | Mot de passe min 6 — harmoniser à 8 (identique à `Login.tsx`) |
| B2 | `ReferralLanding.tsx` | Écran "code invalide" affiche du texte brut au lieu du logo image |

### ⚠️ Améliorations mineures

| # | Fichier | Description |
|---|---------|-------------|
| A1 | `Waitlist.tsx` | Logo mobile : remplacer le texte "Digal" par l'image logo |
| A2 | `Activate.tsx` | Ajouter swap dark/light sur le logo (`dark:content-[url(...)]`) |
| A3 | `CompteSuspendu.tsx` | Ajouter swap dark/light sur le logo |
| A4 | `ReferralLanding.tsx` | Migrer le formulaire vers React Hook Form + Zod pour une validation structurée |
| A5 | `PreviewPage.tsx` | Ajouter `ios-scroll-container` (ou équivalent) pour le comportement iOS PWA |
| A6 | `LandingHeader.tsx` | Préparer le swap dark/light si le ThemeToggle est ajouté à la landing |

---

*Rapport généré automatiquement — aucun fichier modifié.*
