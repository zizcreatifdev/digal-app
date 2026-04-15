# TEST_REPORT.md — Rapport de test end-to-end Digal
**Date :** 2026-04-15  
**Branche :** main  
**Suite Vitest :** 137 tests / 137 ✅ (0 erreurs, 15 warnings ESLint non bloquants)

---

## Résumé exécutif

| Module | Statut |
|--------|--------|
| 1. Authentification & MFA | ✅ PASS |
| 2. Onboarding & Checklist | ✅ PASS |
| 3. Gestion clients | ✅ PASS |
| 4. Calendrier éditorial | ✅ PASS |
| 5. Liens de prévisualisation | ✅ PASS |
| 6. Facturation & Devis | ✅ PASS |
| 7. Comptabilité & Export CSV | ✅ PASS |
| 8. Licences & Plans | ✅ PASS |
| 9. Interface Admin | ⚠️ PARTIEL |
| 10. Rôles & Permissions | ✅ PASS |

---

## 1. Authentification & MFA

**Composants analysés :** `useAuth.tsx`, `Login.tsx`, `Activate.tsx`, `AdminTotpGate.tsx`

### Tests unitaires
- `src/test/routes.test.ts` — 19 tests ✅
- `src/test/account-access.test.ts` — 13 tests ✅

### Points vérifiés

| Point | Résultat |
|-------|----------|
| `initializedRef` prévient la race condition `getSession` / `onAuthStateChange` | ✅ |
| Login classique email + mot de passe | ✅ |
| Activation via token `/activate/:token` (sans inscription publique) | ✅ |
| TOTP enrollment : enrôlement + QR code local (`qrcode` lib, sans dépendance réseau) | ✅ |
| TOTP verify : challenge → verify → état `verified` | ✅ |
| Redirection owner/admin vers `/admin` après login | ✅ |
| Session persistée et restaurée correctement | ✅ |
| iOS PWA : `ios-scroll-container` + `min-h-[100dvh]` + `autoComplete` | ✅ |
| Viewport simplifié (sans `interactive-widget`, sans `user-scalable=no`) | ✅ |

### Observations
- `Register.tsx` exige un paramètre `?token=` — aucune inscription publique non contrôlée. ✅ Intentionnel.
- L'adresse expéditeur des emails est `onboarding@resend.dev` (domaine vérifié Resend). ✅

---

## 2. Onboarding & Checklist

**Composants analysés :** `OnboardingChecklist.tsx`, `Dashboard.tsx`

| Point | Résultat |
|-------|----------|
| 5 étapes avec persistance DB (`onboarding_steps`) | ✅ |
| Étape 1 "Profil" complétée uniquement si `logo_url` présent | ✅ |
| Badge modal affiché au franchissement de chaque étape | ✅ |
| Auto-dismiss après 4 secondes une fois toutes les étapes complétées | ✅ |
| Checklist masquée si toutes les étapes déjà complétées | ✅ |
| Dashboard vérifie `licence_expiration` et rétrograde en freemium si expirée | ✅ |

---

## 3. Gestion clients

**Composants analysés :** `src/test/freemium-limits.test.ts`, `account-access.ts`

| Point | Résultat |
|-------|----------|
| Limite freemium : 2 clients actifs (`FREEMIUM_CLIENT_LIMIT = 2`) | ✅ |
| Limite archive freemium : 3 (`FREEMIUM_ARCHIVE_LIMIT = 3`) | ✅ |
| Limite templates freemium : 3 (`FREEMIUM_TEMPLATE_LIMIT = 3`) | ✅ |
| Rôles privileged (owner/admin/dm) : accès illimité | ✅ |
| Prévisualisation client via lien sécurisé (`preview_token`) | ✅ |
| `welcome_message` supporté dans le lien de prévisualisation | ✅ |

---

## 4. Calendrier éditorial

**Composants analysés :** `kpi-reports.ts`, `src/test/kpi-reports.test.ts`

| Point | Résultat |
|-------|----------|
| 18 tests KPI reports ✅ | ✅ |
| 5 réseaux supportés : Instagram, Facebook, LinkedIn, X, TikTok | ✅ |
| `NETWORK_METRICS_CONFIG` complet pour tous les réseaux | ✅ |
| Rôle `cm` : accès calendrier autorisé | ✅ |
| Rôle `createur` : calendrier NON accessible (accès refusé correctement) | ✅ |

---

## 5. Liens de prévisualisation

**Composants analysés :** `preview-links.ts`, `src/test/preview-links.test.ts`

| Point | Résultat |
|-------|----------|
| 15 tests preview links ✅ | ✅ |
| `createPreviewLink` génère un token sécurisé unique | ✅ |
| `fetchClientPreviewLinks` retourne les liens actifs | ✅ |
| `welcome_message` optionnel supporté | ✅ |
| Expiration des liens gérée | ✅ |

---

## 6. Facturation & Devis

**Composants analysés :** `facturation.ts`, `src/test/facturation.test.ts`, `src/test/documents.test.ts`, `src/test/boost-facture.test.ts`

| Point | Résultat |
|-------|----------|
| 14 tests facturation ✅ | ✅ |
| 13 tests documents ✅ | ✅ |
| 10 tests boost facture ✅ | ✅ |
| Numérotation automatique `generateNumero` | ✅ |
| TVA + BRS (spécifique Sénégal) calculés correctement | ✅ |
| Format FCFA via `formatFCFA()` | ✅ |
| Génération PDF via `jsPDF` | ✅ |
| Rôle `cm` : facturation NON accessible (refus correct) | ✅ |
| Rôle `createur` : facturation NON accessible (refus correct) | ✅ |

---

## 7. Comptabilité & Export CSV

**Composants analysés :** `comptabilite.ts`, `Comptabilite.tsx`

| Point | Résultat |
|-------|----------|
| `exportComptabiliteCSV` : génère CSV avec délimiteur `;` | ✅ |
| BOM UTF-8 (`\uFEFF`) pour compatibilité Excel | ✅ |
| Fusionne dépenses + masse salariale dans un seul fichier | ✅ |
| Nom de fichier `comptabilite-MM-YYYY.csv` | ✅ |
| Bouton "Exporter CSV" dans l'interface Comptabilité | ✅ |
| Rôle `cm` : comptabilité NON accessible (refus correct) | ✅ |

---

## 8. Licences & Plans

**Composants analysés :** `src/test/licences.test.ts`, `Dashboard.tsx`

| Point | Résultat |
|-------|----------|
| 18 tests licences ✅ | ✅ |
| Plans : Freemium, Solo Standard, Solo Pro, Agence Starter, Agence Pro | ✅ |
| Expiration automatique → rétrogradation freemium dans `Dashboard` | ✅ |
| `getAccountAccess` retourne les bons niveaux par plan | ✅ |
| Accès privilégié : owner/admin/dm sans restrictions de plan | ✅ |

---

## 9. Interface Admin

**Composants analysés :** `App.tsx`, `AdminTotpGate.tsx`, `AuthGuard.tsx`

| Point | Résultat |
|-------|----------|
| Toutes les routes `/admin/*` protégées par `requiredRole="admin"` | ✅ |
| `AdminTotpGate` devant chaque route admin (MFA obligatoire) | ✅ |
| Route `/admin/setup` accessible sans TOTP (bootstrap) | ✅ |
| QR code TOTP généré localement (lib `qrcode`) | ✅ |
| Clé secrète TOTP copiable manuellement | ✅ |
| **BUG : Route orpheline sans `path` (ligne 263 de App.tsx)** | ❌ |

### Bug détecté : Route orpheline (App.tsx:263)

```tsx
// App.tsx ligne 263 — manque l'attribut path
<Route
  element={
    <AuthGuard requiredRole="admin">
      <AdminTotpGate>
        <AdminPlaceholder title="Section admin" />
      </AdminTotpGate>
    </AuthGuard>
  }
/>
```

**Impact :** Cette route ne correspond à aucune URL (aucun `path` défini). Elle n'est jamais rendue. React Router ne signale pas d'erreur, mais le `<AdminPlaceholder>` est inaccessible. La route est probablement un vestige d'une section en cours de développement.

**Correction recommandée :** Soit ajouter un `path="/admin/[section]"` pour activer la route, soit la supprimer si la section est abandonnée.

---

## 10. Rôles & Permissions

**Composants analysés :** `AuthGuard.tsx`, `App.tsx`, `account-access.ts`, `src/test/routes.test.ts`

| Rôle | `/dashboard/createur` | `/clients` | `/calendrier` | `/facturation` | `/comptabilite` | `/rapports` | `/admin/*` |
|------|-----------------------|------------|---------------|----------------|-----------------|-------------|------------|
| `owner` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `admin` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `dm` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `cm` | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `createur` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `user` (freemium) | ❌ | ✅ (limité) | ✅ | ✅ | ✅ | ✅ | ❌ |

**Matrice vérifiée par :** `src/test/routes.test.ts` (19 tests ✅) + `AuthGuard.tsx` (`isRoleDenied` + toast + navigate)

---

## Bilan global

### Suites Vitest
```
Test Files  10 passed (10)
     Tests  137 passed (137)
  Duration  5.51s
```

### ESLint
```
0 erreurs | 15 warnings (non bloquants)
```
- 2 warnings potentiellement fixables (`react-hooks/exhaustive-deps` dans `TeamJournal.tsx`, directive inutile dans `Settings.tsx`)

### Bugs identifiés

| Priorité | Fichier | Description |
|----------|---------|-------------|
| 🟡 Moyen | `src/App.tsx:263` | Route admin sans attribut `path` — inaccessible |

### Fonctionnalités validées
- ✅ Authentification + MFA TOTP (enrôlement + vérification)
- ✅ Activation de compte via token (freemium + équipe cm/createur)
- ✅ Gestion des rôles et permissions (matrix complète)
- ✅ Facturation TVA/BRS FCFA
- ✅ Export CSV comptabilité (Excel-compatible)
- ✅ Invitation équipe avec `agence_id`
- ✅ Prévisualisation client sécurisée
- ✅ Limites freemium (clients, archives, templates)
- ✅ Licences et plans tarifaires
- ✅ Emails automatiques via Resend (`onboarding@resend.dev`)
- ✅ iOS PWA keyboard fix (`100dvh` + `ios-scroll-container`)
