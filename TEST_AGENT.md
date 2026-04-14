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

# Couverture
npx vitest run --coverage
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

| Fichier | Description | Tests |
|---------|-------------|-------|
| `example.test.ts` | Test placeholder trivial | 1 |
| `facturation.test.ts` | `calculateTotals` (8 cas) + `formatFCFA` (6 cas) | 14 |
| `account-access.test.ts` | `getAccountAccess` — tous rôles + null/undefined | 13 |
| `kpi-reports.test.ts` | `hasMetrics` (8 cas) + `getFilledMetrics` (10 cas) | 18 |
| `preview-links.test.ts` | `getPeriodDates` — 4 périodes avec fakeTimers | 15 |
| `licences.test.ts` | Format clé DIGAL-TYPE-6chars + génération + extension cumulative | 18 |
| `routes.test.ts` | Protection routes par rôle (canAccessRoute) | 19 |
| `documents.test.ts` | `generateNumero` format/increment/reset + `slugifyClientName` | 13 |
| `freemium-limits.test.ts` | Limites 2 clients actifs / 3 archivés / 3 templates | 16 |
| `boost-facture.test.ts` | `fetchBoostDepenses` + `markBoostIncluded` + transformation ligne | 10 |
| **TOTAL** | | **137 / 137 ✅** |

### E2E (`playwright.config.ts`)

- Config via `lovable-agent-playwright-config/config`
- Aucun test E2E écrit pour l'instant

---

## Couverture par module

| Module | Tests unitaires | Statut |
|--------|----------------|--------|
| `lib/facturation.ts` (`calculateTotals`, `formatFCFA`, `generateNumero`) | ✅ 14 + 6 tests | HAUTE |
| `lib/account-access.ts` (`getAccountAccess`) | ✅ 13 tests | HAUTE |
| `lib/kpi-reports.ts` (`hasMetrics`, `getFilledMetrics`) | ✅ 18 tests | HAUTE |
| `lib/preview-links.ts` (`getPeriodDates`) | ✅ 15 tests | HAUTE |
| `lib/clients.ts` (`slugifyClientName`) | ✅ 6 tests | MOYENNE |
| `lib/comptabilite.ts` (`fetchBoostDepenses`, `markBoostIncluded`) | ✅ 6 tests | MOYENNE |
| Licences (format, génération, extension) | ✅ 18 tests | HAUTE |
| Limites Freemium (2/3/3) | ✅ 16 tests | HAUTE |
| Protection routes par rôle | ✅ 19 tests | HAUTE |
| `useAuth` | ❌ | HAUTE |
| `AuthGuard` | ❌ | HAUTE |
| `lib/posts.ts` (statuts, couleurs) | ❌ | MOYENNE |
| `lib/emails.ts` | ❌ | BASSE |
| `lib/push-notifications.ts` | ❌ | BASSE |

---

## Patterns de mock Supabase

### Mock simple (chaîne linéaire)

```typescript
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
    auth: { getUser: vi.fn(), onAuthStateChange: vi.fn() },
  },
}));

// Mock d'une requête .from().select().eq().order()
const chain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockResolvedValue({ data: [...], error: null }),
};
vi.mocked(supabase.from).mockReturnValue(chain as unknown as ReturnType<typeof supabase.from>);
```

### Mock multi-tables (generateNumero)

```typescript
vi.mocked(supabase.from).mockImplementation((table: string) => {
  if (table === "site_settings") {
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { value: "LCS" }, error: null }),
    } as unknown as ReturnType<typeof supabase.from>;
  }
  if (table === "documents") {
    const docChain: Record<string, unknown> = {};
    docChain.eq = vi.fn().mockReturnValue(docChain);
    docChain.like = vi.fn().mockResolvedValue({ count: 0, error: null });
    return { select: vi.fn().mockReturnValue(docChain) } as unknown as ReturnType<typeof supabase.from>;
  }
  return {} as ReturnType<typeof supabase.from>;
});
```

### Mock avec count exact

```typescript
// Pour les requêtes .select("*", { count: "exact", head: true })
const docChain: Record<string, unknown> = {};
docChain.eq = vi.fn().mockReturnValue(docChain);
docChain.like = vi.fn().mockResolvedValue({ count: 5, error: null });
return { select: vi.fn().mockReturnValue(docChain) };
```

---

## Tests prioritaires à écrire (prochaines étapes)

### 1. Tests composants (Testing Library)

```typescript
// AuthGuard
it("redirige vers /login si pas de session")
it("redirige vers /dashboard si rôle insuffisant")
it("rend les enfants si session valide")

// AdminTotpGate
it("affiche enrollment si pas de facteur TOTP")
it("affiche vérification si facteur existant")
it("rend les enfants si AAL2")
```

### 2. Tests E2E Playwright

```typescript
// Flux auth
test("login avec bonnes credentials → dashboard")
test("login avec mauvaises credentials → message erreur")
test("accès /admin sans rôle admin → redirect")
test("accès /admin avec rôle admin → TOTP gate")

// Flux clients
test("créer un client → apparaît dans la liste")
test("freemium: 3ème client → bloqué")

// Flux facturation
test("créer un devis → PDF téléchargeable")
test("convertir devis → facture")

// Flux preview
test("générer un lien preview → lien accessible")
test("lien expiré → page expirée")
```

### 3. Tests lib manquants

```typescript
// lib/posts.ts
describe("statuts et couleurs")
describe("filtres par réseau")

// lib/emails.ts
describe("sendCreatorRejectionEmail")
describe("sendWaitlistApprovalEmail")
```

---

## Configuration Vitest

Vitest est configuré via Vite (pas de fichier vitest.config.ts séparé).
Le setup file est `src/test/setup.ts`.

```typescript
// src/test/setup.ts
import "@testing-library/jest-dom";
// Mock matchMedia (jsdom ne l'implémente pas)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

---

## Rapport de couverture

```
Tests unitaires : 137 / 137 passent
Fichiers de test : 10
Couverture code lib/ : ~65% (fonctions pures + mocks Supabase)
Couverture E2E : 0%
ESLint : 0 erreurs (15 warnings pre-existants)
```

**Objectif cible : 75% de couverture sur lib/, 80% sur utils critiques.**
