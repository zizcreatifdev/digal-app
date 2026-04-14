# PROJECT_STATE.md — État du projet Digal

_Dernière mise à jour : 2026-04-14_
_Prompt courant : Initialisation mémoire_

---

## Vue d'ensemble

**Digal** est un SaaS B2B de gestion pour agences de communication digitale et freelances (marché sénégalais). Il couvre la gestion de clients, le calendrier éditorial, la facturation (FCFA), la comptabilité, les rapports KPI et la gestion d'équipe.

---

## État des modules

### Module AUTH — 90% ✅
| Fonctionnalité | État | Notes |
|----------------|------|-------|
| Login email/password | ✅ Complet | Via Supabase Auth |
| Register | ✅ Complet | Email redirect |
| Reset password | ✅ Complet | Page `/reset-password` |
| AuthGuard (protection routes) | ✅ Complet | Redirige vers /login |
| Rôles (admin/user) | ✅ Complet | Table `user_roles` |
| TOTP 2FA pour admin | ✅ Complet | `AdminTotpGate` |
| Onboarding wizard | ✅ Complet | 4 étapes, skip possible |
| Waitlist | ✅ Complet | Page publique |
| **Tests** | ❌ Aucun | Priorité haute |

---

### Module CLIENTS — 85% ✅
| Fonctionnalité | État | Notes |
|----------------|------|-------|
| Liste clients actifs | ✅ Complet | |
| Ajout client + réseaux | ✅ Complet | Modal AddClientModal |
| Détail client | ✅ Complet | Page ClientDetail |
| Réseaux sociaux par client | ✅ Complet | Table `client_networks` |
| Archive / restore client | ✅ Complet | |
| Couleur de marque | ✅ Complet | Color picker |
| Upload logo client | ✅ Complet | Supabase Storage |
| Freemium limit (2 clients) | ✅ Complet | Via `getAccountAccess` |
| Edition client | ⚠️ Partiel | Vérifier si édition post-création disponible |
| **Tests** | ❌ Aucun | |

---

### Module CALENDRIER ÉDITORIAL — 80% ✅
| Fonctionnalité | État | Notes |
|----------------|------|-------|
| Vue calendrier mensuelle | ✅ Complet | `EditorialCalendar` |
| Créer un post | ✅ Complet | `CreatePostModal` |
| Modifier un post | ✅ Complet | `EditPostModal` |
| Workflow statuts | ✅ Complet | idee→en_production→validation→publie |
| Upload média post | ✅ Complet | Supabase Storage `post-media` |
| Filtres par client/réseau | ⚠️ Partiel | À vérifier |
| Templates de posts | ⚠️ Partiel | Table existe, UI à confirmer |
| Assignation à créateur | ✅ Complet | `assigne_a` field |
| Review par CM | ✅ Complet | `ReviewPostModal` |
| **Tests** | ❌ Aucun | |

---

### Module PREVIEW LINKS (validation client) — 90% ✅
| Fonctionnalité | État | Notes |
|----------------|------|-------|
| Génération lien unique | ✅ Complet | Slug 12 chars |
| Page preview publique | ✅ Complet | `/preview/:slug` sans auth |
| Sélection période | ✅ Complet | Semaine/mois courant ou suivant |
| Validation/refus par client | ✅ Complet | `preview_actions` |
| Expiration liens | ✅ Complet | Edge function `scheduled-cleanup` |
| Maquette réseau (NetworkMockup) | ✅ Complet | |
| **Tests** | ❌ Aucun | |

---

### Module FACTURATION — 85% ✅
| Fonctionnalité | État | Notes |
|----------------|------|-------|
| Création devis | ✅ Complet | Type `devis` |
| Création facture | ✅ Complet | Type `facture` |
| Lignes de facturation | ✅ Complet | Avec BRS et TVA |
| Calcul taxes (BRS + TVA) | ✅ Complet | `calculateTotals()` |
| Conversion devis → facture | ✅ Complet | `convertDevisToFacture()` |
| Enregistrement paiements | ✅ Complet | `addPayment()` |
| Statuts (brouillon/envoyé/payé/...) | ✅ Complet | 7 statuts |
| Génération PDF | ✅ Complet | jsPDF + `facturation-pdf.ts` |
| Méthodes paiement (Wave, OM, etc.) | ✅ Complet | |
| Numérotation auto | ✅ Complet | `DEV-YYYY-NNN` / `FAC-YYYY-NNN` |
| Téléchargement PDF | ⚠️ À vérifier | Intégration UI |
| **Tests** | ❌ Aucun | `calculateTotals` à tester en priorité |

---

### Module COMPTABILITÉ — 75% ⚠️
| Fonctionnalité | État | Notes |
|----------------|------|-------|
| Dashboard financier | ✅ Complet | `DashboardFinancier` |
| Dépenses (CRUD) | ✅ Complet | 4 catégories |
| Upload pièce jointe dépense | ✅ Complet | |
| Masse salariale | ✅ Complet | `MasseSalarialeSection` |
| Revenus | ✅ Complet | `RevenusSection` |
| Export CSV/rapport | ❌ Manquant | Non implémenté |
| Graphiques | ✅ Complet | Recharts |
| **Tests** | ❌ Aucun | |

---

### Module RAPPORTS KPI — 80% ✅
| Fonctionnalité | État | Notes |
|----------------|------|-------|
| Création rapport KPI | ✅ Complet | Par client, par mois |
| Métriques par réseau | ✅ Complet | 5 réseaux, métriques configurées |
| Points forts / axes d'amélioration | ✅ Complet | |
| Prévisualisation rapport | ✅ Complet | `KpiReportPreview` |
| Export PDF | ✅ Complet | `kpi-pdf.ts` |
| Historique rapports | ✅ Complet | Trié par mois |
| **Tests** | ❌ Aucun | `hasMetrics`, `getFilledMetrics` à tester |

---

### Module CRÉATEUR (workflow) — 75% ⚠️
| Fonctionnalité | État | Notes |
|----------------|------|-------|
| Dashboard créateur | ✅ Complet | `CreatorDashboard` |
| Tâches assignées | ✅ Complet | `fetchAssignedTasks()` |
| Upload média créateur | ✅ Complet | → statut `en_attente_validation` |
| Validation CM | ✅ Complet | `validateCreatorUpload()` |
| Rejet CM + commentaire | ✅ Complet | Suppression média, notif créateur |
| Stats membre d'équipe | ✅ Complet | `getTeamMemberStats()` |
| Notifications push | ⚠️ In-app only | Pas de push browser |
| **Tests** | ❌ Aucun | |

---

### Module ÉQUIPE — 70% ⚠️
| Fonctionnalité | État | Notes |
|----------------|------|-------|
| Journal d'équipe | ✅ Complet | `TeamJournal` page |
| Liste membres | ✅ Complet | Via `fetchTeamMembers()` |
| Invitation collaborateurs | ⚠️ Partiel | Mentionné dans onboarding, UI à vérifier |
| Attribution de rôles d'équipe | ⚠️ Partiel | À confirmer |
| **Tests** | ❌ Aucun | |

---

### Module NOTIFICATIONS — 85% ✅
| Fonctionnalité | État | Notes |
|----------------|------|-------|
| Notifications in-app | ✅ Complet | `NotificationPanel` |
| Marquer comme lu | ✅ Complet | |
| Marquer tout comme lu | ✅ Complet | |
| Compteur non-lus | ✅ Complet | |
| Lien depuis notification | ✅ Complet | Champ `lien` |
| Notifications temps réel | ⚠️ Non confirmé | Pas de Realtime Supabase visible |
| **Tests** | ❌ Aucun | |

---

### Module JOURNAL D'ACTIVITÉ — 80% ✅
| Fonctionnalité | État | Notes |
|----------------|------|-------|
| Logs d'activité utilisateur | ✅ Complet | `activity_logs` table |
| Filtres par type/date | ✅ Complet | |
| Helpers de logging | ✅ Complet | `logAuth`, `logPostAction`, etc. |
| Silent fail | ✅ Complet | Les erreurs de log ne cassent pas l'app |
| **Tests** | ❌ Aucun | |

---

### Module PARAMÈTRES — 65% ⚠️
| Fonctionnalité | État | Notes |
|----------------|------|-------|
| Page Settings | ✅ Existe | À analyser en détail |
| Profil utilisateur | ✅ Complet | Via onboarding + settings |
| Invitation équipe | ⚠️ Partiel | |
| Gestion plan | ⚠️ Partiel | Lié à admin |
| **Tests** | ❌ Aucun | |

---

### Module ADMIN — 80% ✅
| Page admin | État | Notes |
|------------|------|-------|
| Dashboard KPIs (MRR, comptes) | ✅ Complet | |
| Gestion comptes | ✅ Complet | |
| Gestion licences | ✅ Complet | Expiration, renewal |
| Gestion waitlist | ✅ Complet | |
| Gestion plans tarifaires | ✅ Complet | Promo, prix, features |
| Gestion contrats | ✅ Complet | Templates + contrats signés |
| Campagnes emails | ✅ Complet | `marketing_emails` |
| Logs de sécurité | ✅ Complet | |
| Facturation owner | ✅ Complet | `owner_payments` |
| Guides / Documentation | ✅ Complet | |
| Profil admin | ✅ Complet | |
| Setup initial (owner) | ✅ Complet | `/admin/setup` + edge function |
| TOTP obligatoire | ✅ Complet | `AdminTotpGate` |
| **Tests** | ❌ Aucun | |

---

### Module LANDING PAGE — 95% ✅
| Composant | État |
|-----------|------|
| Hero Section | ✅ |
| Problem Section | ✅ |
| Solution Section | ✅ |
| Pricing Section | ✅ |
| CTA Section | ✅ |
| Header / Footer | ✅ |
| Marquee Banner | ✅ |

---

### MODULE CONTRATS (signature) — 70% ⚠️
| Fonctionnalité | État | Notes |
|----------------|------|-------|
| Signature canvas | ✅ Complet | `SignatureCanvas` |
| Modal signature | ✅ Complet | `ContractSigningModal` |
| Génération PDF contrat | ⚠️ Partiel | Lié admin |
| Upload PDF signé | ⚠️ Partiel | |
| **Tests** | ❌ Aucun | |

---

## Bugs connus

| # | Description | Sévérité | Module |
|---|-------------|----------|--------|
| 1 | ~~Dashboard stats sont des données statiques hardcodées~~ | ~~HAUTE~~ | ~~Dashboard~~ | → **Résolu prompt-02** |
| 2 | `AdminTotpGate` : l'image QR code charge depuis une API externe (api.qrserver.com) — dépendance externe | MOYENNE | Admin |
| 3 | `useAuth` : double fetch de session (onAuthStateChange + getSession) peut causer race condition au démarrage | BASSE | Auth |
| 4 | ~~Activité récente dans Dashboard = données mockées~~ | ~~HAUTE~~ | ~~Dashboard~~ | → **Résolu prompt-02** |

---

## Prochaines étapes recommandées

1. ~~**Connecter Dashboard aux vraies données**~~ → **Résolu prompt-02**
2. **Écrire les tests unitaires** sur `lib/facturation.ts` et `lib/account-access.ts`
3. **Finaliser l'invitation d'équipe** dans les Paramètres
4. **Ajouter export CSV** dans la Comptabilité
5. **Réaltime Supabase** pour les notifications
6. **Vérifier l'édition de client** post-création

---

## Qualité du code

| Métrique | État |
|----------|------|
| Erreurs ESLint | ✅ 0 erreur (était 66) |
| Warnings ESLint | 15 warnings (shadcn/ui + exhaustive-deps — non bloquants) |
| Tests unitaires | ✅ 61/61 passent (était 1/1 trivial) |
| Fichiers de tests | 5 fichiers (example + facturation + account-access + kpi-reports + preview-links) |
| TypeScript strict | Amélioré — `any` éliminés, types précis ajoutés |

---

## Historique des prompts

| Prompt | Description | Date |
|--------|-------------|------|
| init | Création des fichiers de mémoire (ARCHITECTURE, CLAUDE, TEST_AGENT, PROJECT_STATE) | 2026-04-14 |
| 01 | Correction 66 erreurs ESLint → 0 erreur | 2026-04-14 |
| 02 | Dashboard connecté Supabase — stats réelles + activité réelle via `activity_logs` | 2026-04-14 |
| 03 | Scan données hardcodées hors Dashboard — correction `cmName` KPI (email → prenom+nom DB) | 2026-04-14 |
| 04 | Tests critiques — 61 tests unitaires sur facturation, account-access, kpi-reports, preview-links + fix bug `hasMetrics` null | 2026-04-14 |
