# CLAUDE.md — Règles de travail pour Digal

## Protocole obligatoire pour chaque prompt

```bash
# 1. Snapshot avant toute modification
git add . && git commit -m "snapshot avant prompt-XX"

# 2. Lire les fichiers de mémoire
# ARCHITECTURE.md, CLAUDE.md, TEST_AGENT.md, PROJECT_STATE.md

# 3. Exécuter la tâche

# 4. Tests + rapport
npm run test          # Vitest unitaires
npm run lint          # ESLint

# 5. Mettre à jour PROJECT_STATE.md

# 6. Commit final
git add . && git commit -m "prompt-XX : [description courte]"

# En cas de problème grave :
git revert HEAD
```

---

## Stack — Ne jamais changer

- **React Router DOM** pour le routing (pas Next.js, pas TanStack Router)
- **Supabase** comme unique backend (pas de REST API custom, pas de Prisma)
- **TanStack React Query** pour le state serveur (pas SWR, pas Redux)
- **shadcn/ui** pour les composants UI (Radix primitives)
- **Tailwind CSS** pour les styles (pas de CSS Modules, pas de styled-components)
- **Zod** pour la validation des formulaires
- **React Hook Form** pour la gestion des formulaires
- **jsPDF** pour la génération de PDF
- **Vitest** pour les tests unitaires (pas Jest)
- **Playwright** pour les tests E2E

---

## Conventions de code

### TypeScript
- Toujours typer les props des composants avec une `interface` (pas `type`)
- Pas de `any` sauf si absolument nécessaire et justifié
- Utiliser les types générés dans `src/integrations/supabase/types.ts`
- Importer depuis `@/` (alias Vite configuré pour `src/`)

### Composants React
- Fonctions fléchées pour les composants : `const MyComponent = () => {...}`
- Export default pour les pages, export nommé pour les composants partagés
- Un fichier = un composant principal
- Placer la logique métier dans `src/lib/`, pas dans les composants

### Supabase
- Toujours utiliser le client singleton : `import { supabase } from "@/integrations/supabase/client"`
- Toujours vérifier `error` après chaque query Supabase
- Les fonctions lib retournent des données typées ou throw l'erreur
- Ne jamais exposer la `service_role_key` côté client

### Tailwind / UI
- Utiliser `cn()` de `src/lib/utils.ts` pour combiner les classes conditionnelles
- Utiliser les variables CSS de shadcn (ex: `text-primary`, `bg-muted`) plutôt que des couleurs hardcodées
- Police : `font-serif` pour les titres, `font-sans` pour le texte courant, `font-mono` pour le code
- Devise : toujours afficher en FCFA (franc CFA, contexte sénégalais)

### Gestion des erreurs
- Utiliser `toast.error()` de `sonner` pour les erreurs utilisateur
- `logActivity()` pour tracer les actions importantes
- Les erreurs de logging ne doivent jamais casser l'app (silent fail)

---

## Ce qu'il ne faut JAMAIS modifier

| Fichier / Dossier | Raison |
|-------------------|--------|
| `src/integrations/supabase/types.ts` | Auto-généré par Supabase CLI |
| `src/integrations/supabase/client.ts` | Singleton client, auto-généré |
| `supabase/migrations/*.sql` | Migrations appliquées en prod — ne jamais éditer |
| `.env` | Variables sensibles — ne pas committer de nouvelles clés |
| `components.json` | Config shadcn/ui — modifier via CLI shadcn seulement |
| `public/manifest.json` | Config PWA |

---

## Structure des commits

```
Format : "prompt-XX : [description courte en français]"

Exemples :
  snapshot avant prompt-03
  prompt-03 : ajout filtre par réseau sur le calendrier
  prompt-07 : fix bug pagination liste clients
  prompt-12 : feature export CSV comptabilité

Types de préfixes internes :
  feat:     nouvelle fonctionnalité
  fix:      correction de bug
  refactor: refactoring sans changement de comportement
  test:     ajout/modification de tests
  docs:     documentation uniquement
  style:    formatage, espaces (pas de logique)
```

---

## Ajout de composants shadcn/ui

```bash
# Toujours via CLI shadcn, ne jamais créer manuellement dans src/components/ui/
npx shadcn@latest add [component-name]
```

---

## Migrations Supabase

```bash
# Créer une nouvelle migration (ne jamais modifier les existantes)
supabase migration new <nom_migration>

# Appliquer localement
supabase db reset

# Générer les types TypeScript après migration
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

---

## Contexte métier important

- **Marché cible** : Agences de communication digitale et freelances au Sénégal
- **Devise** : FCFA (Franc CFA) — formatter avec `formatFCFA()` de `src/lib/facturation.ts`
- **Taxes** : TVA + BRS (Bordereau de Retenue à la Source) — spécifique Sénégal
- **Réseaux sociaux gérés** : Instagram, Facebook, LinkedIn, X (Twitter), TikTok
- **Plans tarifaires** : Freemium, Solo Standard, Solo Pro, Agence Starter, Agence Pro
- **Langue UI** : Français intégralement (labels, messages, toasts)

---

## Ports de développement

```bash
npm run dev      # http://localhost:8080 (Vite)
npm run build    # Build production
npm run preview  # Preview build
npm run lint     # ESLint check
npm run test     # Vitest (run once)
npm run test:watch  # Vitest (watch mode)
```
