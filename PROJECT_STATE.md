# PROJECT_STATE.md — État du projet Digal

_Dernière mise à jour : 2026-04-14_
_Prompt courant : 09 — Phase 3A admin + emails + upgrade UI_

---

## Vue d'ensemble

**Digal** est un SaaS B2B de gestion pour agences de communication digitale et freelances (marché sénégalais). Il couvre la gestion de clients, le calendrier éditorial, la facturation (FCFA), la comptabilité, les rapports KPI et la gestion d'équipe.

---

## État des modules

### Module AUTH — 92% ✅
| Fonctionnalité | État | Notes |
|----------------|------|-------|
| Login email/password | ✅ Complet | Via Supabase Auth |
| Register | ✅ Complet | Email redirect |
| Reset password | ✅ Complet | Page `/reset-password` |
| AuthGuard (protection routes) | ✅ Complet | Redirige vers /login |
| Rôles (admin/user) | ✅ Complet | Table `user_roles` |
| **Protection routes par profileRole** | ✅ Complet (prompt-06) | `allowedProfileRoles` dans AuthGuard |
| TOTP 2FA pour admin | ✅ Complet | `AdminTotpGate` |
| Onboarding wizard | ✅ Complet | 4 étapes, skip possible |
| **Checklist onboarding 5 étapes** | ✅ Complet (prompt-07) | `OnboardingChecklist` floating, badges, localStorage |
| Waitlist | ✅ Complet | Page publique |
| **Tests** | ❌ Aucun | Priorité haute |

---

### Module CLIENTS — 95% ✅
| Fonctionnalité | État | Notes |
|----------------|------|-------|
| Liste clients actifs | ✅ Complet | |
| Ajout client + réseaux | ✅ Complet | Modal AddClientModal |
| **Édition client post-création** | ✅ Complet (prompt-06) | EditClientModal + updateClient() |
| Détail client | ✅ Complet | Page ClientDetail + bouton Modifier |
| Réseaux sociaux par client | ✅ Complet | Table `client_networks` |
| Archive / restore client | ✅ Complet | |
| Couleur de marque | ✅ Complet | Color picker |
| Upload logo client | ✅ Complet | Supabase Storage |
| Freemium limit (2 clients) | ✅ Complet | Via `getAccountAccess` |
| **Tests** | ❌ Aucun | |

---

### Module CALENDRIER ÉDITORIAL — 85% ✅
| Fonctionnalité | État | Notes |
|----------------|------|-------|
| Vue calendrier mensuelle | ✅ Complet | `EditorialCalendar` |
| Créer un post | ✅ Complet | `CreatePostModal` |
| Modifier un post | ✅ Complet | `EditPostModal` |
| Workflow statuts | ✅ Complet | idee→en_production→validation→publie |
| Upload média post | ✅ Complet | Supabase Storage `post-media` |
| **Blocs périodes de production** | ✅ Complet (prompt-07) | 4 types colorés, shooting/montage/livraison/custom |
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
| **Numérotation avec SIGLE** | ✅ Complet (prompt-08) | `DEV-LCS-2026-0001` / `FAC-LCS-2026-0001` — 4 chiffres |
| **Tampon + Signature PDF** | ✅ Complet (prompt-08) | Upload Settings → intégré en bas du PDF |
| **Protection route /facturation** | ✅ Complet (prompt-06) | DM + Solo uniquement |
| Téléchargement PDF | ✅ Complet | Via `DocumentList` + `generateDocumentPdf` |
| **Tests** | 14/14 ✅ | `calculateTotals` testé |

---

### Module COMPTABILITÉ — 80% ✅
| Fonctionnalité | État | Notes |
|----------------|------|-------|
| Dashboard financier | ✅ Complet | `DashboardFinancier` |
| Dépenses (CRUD) | ✅ Complet | 4 catégories |
| Upload pièce jointe dépense | ✅ Complet | |
| **Boost dépenses (client + réseau)** | ✅ Complet (prompt-08) | Client affecté + réseau pub (5 types) |
| **Boost → ligne facture** | ✅ Complet (prompt-08) | `fetchBoostDepenses` + checkbox dans CreateDocumentModal |
| Masse salariale | ✅ Complet | `MasseSalarialeSection` |
| Revenus | ✅ Complet | `RevenusSection` |
| Export CSV/rapport | ❌ Manquant | Non implémenté |
| Graphiques | ✅ Complet | Recharts |
| **Protection route /comptabilite** | ✅ Complet (prompt-06) | DM + Solo uniquement |
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
| **Protection route /rapports** | ✅ Complet (prompt-06) | DM + Solo uniquement |
| **Tests** | 18/18 ✅ | hasMetrics, getFilledMetrics, formatMonth |

---

### Module CRÉATEUR (workflow) — 85% ✅
| Fonctionnalité | État | Notes |
|----------------|------|-------|
| Dashboard créateur | ✅ Complet | `CreatorDashboard` (tabs: Tâches / Boîte de dépôt) |
| Tâches assignées | ✅ Complet | Mode 1 — `fetchAssignedTasks()` |
| Upload média créateur | ✅ Complet | → statut `en_attente_validation` |
| Validation CM | ✅ Complet | `validateCreatorUpload()` |
| Rejet CM + commentaire | ✅ Complet | Suppression média, notif créateur |
| Stats membre d'équipe | ✅ Complet | `getTeamMemberStats()` |
| **Route /createur restreinte** | ✅ Complet (prompt-06) | Rôle createur uniquement |
| **Mode 2 boîte de dépôt** | ✅ Complet (prompt-07) | `DropBoxUpload` + `DropBoxReview` + migration |
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
| Notifications temps réel | ✅ Complet | Realtime Supabase confirmé AUDIT_C |
| **Tests** | ❌ Aucun | |

---

### Module JOURNAL D'ACTIVITÉ — 80% ✅
| Fonctionnalité | État | Notes |
|----------------|------|-------|
| Logs d'activité utilisateur | ✅ Complet | `activity_logs` table |
| Filtres par type/date | ✅ Complet | |
| Helpers de logging | ✅ Complet | `logAuth`, `logPostAction`, etc. |
| Silent fail | ✅ Complet | Les erreurs de log ne cassent pas l'app |
| **Protection route /journal** | ✅ Complet (prompt-06) | DM + Solo uniquement |
| **Tests** | ❌ Aucun | |

---

### Module LICENCES — 90% ✅ → Prompt-09
| Fonctionnalité | État | Notes |
|----------------|------|-------|
| Table `license_keys` | ✅ Complet (prompt-06) | Migration 20260415000001 |
| Génération clé DIGAL-TYPE-XXXX | ✅ Complet (prompt-06) | `AdminLicences` — bouton "Générer clé" |
| Activation côté utilisateur | ✅ Complet (prompt-06) | Settings → Ma licence — saisie clé + RPC |
| Extension cumulative expiration | ✅ Complet (prompt-06) | RPC `activate_license_key` |
| Popup expiration J-30 | ✅ Complet (prompt-06) | Dashboard — Dialog sessionStorage |
| Historique activations | ✅ Complet (prompt-06) | Settings — table `license_keys.used_by` |
| Activation manuelle par admin | ✅ Complet | AdminLicences |
| **Clé promo (-30%)** | ✅ Complet (prompt-09) | Switch promo + discount dans dialog génération AdminLicences |
| **Prolongation manuelle (N mois)** | ✅ Complet (prompt-09) | Dialog CalendarPlus par utilisateur dans AdminLicences |
| **Tests** | ❌ Aucun | |

---

### Module EMAIL — 85% ✅ → Prompt-09
| Fonctionnalité | État | Notes |
|----------------|------|-------|
| Edge function `send-email` | ✅ Complet (prompt-06) | Deno + npm:resend@3 |
| `lib/emails.ts` | ✅ Complet (prompt-09) | +3 helpers : sendCreatorRejectionEmail, sendWaitlistApprovalEmail, sendPreviewExpiredEmail |
| Templates email | ✅ Complet (prompt-09) | +3 types : rejet_createur, waitlist_approuve, preview_expire |
| **Rejet créateur câblé** | ✅ Complet (prompt-09) | `rejectCreatorUpload()` + `rejectDropBoxFile()` |
| **Approbation waitlist câblée** | ✅ Complet (prompt-09) | `AdminWaitlist.tsx` updateStatus |
| **Cron J-30/15/7** | ✅ Complet (prompt-09) | Edge fn `expiry-reminders` + migration cron_expiry_reminders |
| Clé RESEND_API_KEY configurée | ❌ À configurer | Variable env Supabase à définir |

---

### Module PARAMÈTRES — 70% ⚠️
| Fonctionnalité | État | Notes |
|----------------|------|-------|
| Page Settings | ✅ Existe | |
| Profil utilisateur | ✅ Complet | |
| Invitation équipe | ⚠️ Partiel | |
| **Saisie clé licence réelle** | ✅ Complet (prompt-06) | Input + RPC activate_license_key |
| **Historique licences** | ✅ Complet (prompt-06) | Table depuis license_keys |
| **Tests** | ❌ Aucun | |

---

### Module ADMIN — 90% ✅ → Prompt-09
| Page admin | État | Notes |
|------------|------|-------|
| Dashboard KPIs (MRR, comptes) | ✅ Complet | |
| Gestion comptes | ✅ Complet | |
| **Export CSV comptes + KPIs** | ✅ Complet (prompt-09) | Bouton "Exporter CSV" + fichier daté |
| **Onglet Financier par compte** | ✅ Complet (prompt-09) | CA facturé, CA encaissé, dépenses, masse salariale (lecture seule) |
| **Génération clés DIGAL-TYPE-XXXX** | ✅ Complet (prompt-06) | Bouton "Générer clé" + table clés |
| **Clé promo + prolongation flexible** | ✅ Complet (prompt-09) | AdminLicences — Switch promo, dialog N mois |
| Gestion waitlist | ✅ Complet | Email d'approbation câblé (prompt-09) |
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
2. ~~**Écrire les tests unitaires**~~ → **Résolu prompt-04** (61 tests)
3. ~~**EditClientModal + updateClient**~~ → **Résolu prompt-06**
4. ~~**Route protection par profileRole**~~ → **Résolu prompt-06**
5. ~~**Système licences réel (clés DIGAL)**~~ → **Résolu prompt-06**
6. ~~**Service email (Resend + edge function)**~~ → **Résolu prompt-06**
7. ~~**Onboarding 5 étapes + badges**~~ → **Résolu prompt-07** (checklist floating)
8. ~~**Blocs périodes de production**~~ → **Résolu prompt-07**
9. ~~**Boîte de dépôt Mode 2**~~ → **Résolu prompt-07**
10. **Export CSV** comptabilité (§14)
11. ~~**Tampon + Signature** PDF (§13/§16)~~ → **Résolu prompt-08**
12. ~~**SIGLE dans generateNumero()** (§13)~~ → **Résolu prompt-08**
13. **Boost dépenses → facture** (§14) → **Résolu prompt-08**

---

## Qualité du code

| Métrique | État |
|----------|------|
| Erreurs ESLint | ✅ 0 erreur |
| Warnings ESLint | 16 warnings (shadcn/ui + exhaustive-deps — non bloquants) |
| Tests unitaires | ✅ 61/61 passent |
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
| 05A | Audit CDC sections 1-5 → AUDIT_A.md | 2026-04-14 |
| 05B | Audit CDC sections 6-10 → AUDIT_B.md | 2026-04-14 |
| 05C | Audit CDC sections 11-17 → AUDIT_C.md | 2026-04-14 |
| 06 | Phase 1 fondations critiques : licences DIGAL, service email Resend, routes par rôle, EditClientModal | 2026-04-14 |
| 07 | Phase 2A core : onboarding checklist 5 étapes, blocs périodes production, boîte dépôt Mode 2 | 2026-04-14 |
| 08 | Phase 2B core : numérotation SIGLE+4chiffres, tampon+signature PDF, boost dépenses→facture | 2026-04-14 |
| 09 | Phase 3A : dashboard owner (export CSV + onglet financier), clé promo + prolongation flexible, emails (rejet/waitlist/preview + cron J-30/15/7), ProUpgradeModal mockups, limites freemium (archive×3 + templates×3) | 2026-04-14 |
