# TEST_AGENT.md — Tests & Qualité

## Commandes

```bash
# Tests unitaires (run once)
npm run test

# Tests unitaires (watch mode)
npm run test:watch

# Linting ESLint
npm run lint

# Build (vérifie TypeScript)
npm run build

# Tests E2E Playwright (nécessite serveur lancé)
npx playwright test
npx playwright test --ui          # Mode UI interactif
npx playwright show-report        # Rapport HTML
```

---

## Framework de tests

| Type | Framework | Config |
|------|-----------|--------|
| Unitaires | Vitest 3.2 | `vitest.config.ts` (via Vite) |
| E2E | Playwright 1.57 | `playwright.config.ts` |
| DOM | jsdom | Environnement Vitest |
| Helpers | @testing-library/react 16 | — |
| Matchers | @testing-library/jest-dom | `src/test/setup.ts` |

---

## Tests existants

### Unitaires (`src/test/`)

| Fichier | Description | Statut |
|---------|-------------|--------|
| `src/test/example.test.ts` | Test placeholder trivial (`expect(true).toBe(true)`) | ✅ OK |
| `src/test/facturation.test.ts` | `calculateTotals` (8 cas) + `formatFCFA` (6 cas) | ✅ 14 tests |
| `src/test/account-access.test.ts` | `getAccountAccess` — tous rôles + null/undefined | ✅ 13 tests |
| `src/test/kpi-reports.test.ts` | `hasMetrics` (8 cas) + `getFilledMetrics` (10 cas) | ✅ 18 tests |
| `src/test/preview-links.test.ts` | `getPeriodDates` — 4 périodes avec fakeTimers | ✅ 15 tests |
| `src/test/setup.ts` | Configuration Testing Library (mock `matchMedia`) | Setup |

**Couverture actuelle : 61/61 tests passent** (était 1 test trivial).

### E2E (`playwright.config.ts`)

- Config via `lovable-agent-playwright-config/config`
- Aucun test E2E écrit pour l'instant

---

## Couverture par module

| Module | Tests unitaires | Tests E2E | Priorité |
|--------|----------------|-----------|----------|
| `useAuth` | ❌ | ❌ | HAUTE |
| `AuthGuard` | ❌ | ❌ | HAUTE |
| `lib/facturation.ts` (`calculateTotals`, `formatFCFA`) | ✅ 14 tests | ❌ | HAUTE |
| `lib/clients.ts` | ❌ | ❌ | MOYENNE |
| `lib/posts.ts` (statuts, couleurs) | ❌ | ❌ | MOYENNE |
| `lib/kpi-reports.ts` (`hasMetrics`, `getFilledMetrics`) | ✅ 18 tests | ❌ | MOYENNE |
| `lib/preview-links.ts` (`getPeriodDates`) | ✅ 15 tests | ❌ | MOYENNE |
| `lib/comptabilite.ts` | ❌ | ❌ | BASSE |
| `lib/account-access.ts` (`getAccountAccess`) | ✅ 13 tests | ❌ | HAUTE |
| `components/AuthGuard` | ❌ | ❌ | HAUTE |
| Flux login/register | ❌ | ❌ | HAUTE |
| Calendrier éditorial | ❌ | ❌ | MOYENNE |
| Facturation PDF | ❌ | ❌ | BASSE |

---

## Tests prioritaires à écrire (prochaines étapes)

### 1. Tests unitaires purs (lib/)

```typescript
// lib/facturation.ts
describe("calculateTotals", () => {
  it("calcule correctement sous-total, BRS, TVA, total")
  it("gère les lignes sans BRS")
  it("gère une liste vide")
})

describe("formatFCFA", () => {
  it("formate 150000 en '150 000 FCFA'")
})

// lib/account-access.ts
describe("getAccountAccess", () => {
  it("identifie correctement freemium")
  it("identifie correctement les rôles privilégiés")
})

// lib/preview-links.ts
describe("getPeriodDates", () => {
  it("retourne les bonnes dates pour semaine_courante")
})
```

### 2. Tests composants (Testing Library)

```typescript
// AuthGuard
it("redirige vers /login si pas de session")
it("redirige vers /dashboard si rôle insuffisant")
it("rend les enfants si session valide")
```

### 3. Tests E2E Playwright

```typescript
// Flux auth
test("login avec bonnes credentials → dashboard")
test("login avec mauvaises credentials → message erreur")
test("accès /admin sans rôle admin → redirect")

// Flux clients
test("créer un client → apparaît dans la liste")

// Flux facturation
test("créer un devis → PDF téléchargeable")
```

---

## Configuration Vitest

Vitest est configuré via Vite (pas de fichier vitest.config.ts séparé).
Le setup file est `src/test/setup.ts`.

Pour lancer avec couverture :
```bash
npx vitest run --coverage
```

---

## Mocks nécessaires

```typescript
// Supabase client → toujours mocker dans les tests unitaires
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
    auth: { getUser: vi.fn(), onAuthStateChange: vi.fn() },
  },
}));

// useAuth hook
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: mockUser, session: mockSession, ... }),
}));
```

---

## Rapport de couverture actuelle

```
Tests : 61 / 61 passent
Couverture code : ~40% sur lib/ (fonctions pures)
Couverture E2E : 0%
```

**Objectif cible : 60% de couverture sur lib/, 80% sur utils critiques.**
