# AUDIT_B.md — Sections 6 à 10
_Date : 2026-04-14 — Prompt 05-B — Lecture seule, aucune modification_

---

### Section 6 — Onboarding immersif gamifié
- **Statut :** ❌
- **%** : 35%
- **Fait :**
  - ✅ Wizard affiché à la première connexion (contrôlé par `site_settings.onboarding_done_{user_id}`)
  - ✅ Barre de progression dans le wizard
  - ✅ 4 étapes : Bienvenue → Profil (prénom/nom/avatar) → Agence/Marque (logo/couleur) → Terminé
  - ✅ Bouton "Passer et configurer plus tard" (skip global)
  - ✅ Upload avatar + logo dans Supabase Storage (`user-uploads`)
  - ✅ Complétion sauvegardée en DB (`site_settings`)
- **Manque :**
  - ❌ **5 étapes requises par le CDC** — seules 4 implémentées ; manquent : "Ajouter premier client", "Créer premier post", "Générer premier lien preview", "Créer premier devis"
  - ❌ Badges de validation par étape (Badge "Identité créée", "Premier client", "Calendrier lancé", "Prêt pour le client", "Pro complet 🎉")
  - ❌ Barre de progression persistante dans le header de l'app (après wizard)
  - ❌ Checklist flottante et rétractable pendant l'utilisation normale
  - ❌ Skip par étape individuelle (CDC §6.3) — seul "tout passer" disponible
  - ❌ Tooltips contextuels à la première visite
  - ❌ Bouton "?" permanent dans le header → guide selon type de compte

---

### Section 7 — Rôles & Permissions
- **Statut :** ⚠️
- **%** : 55%
- **Fait :**
  - ✅ Rôles définis : `owner`, `admin`, `dm`, `solo`, `agence_standard`, `agence_pro`, `freemium`
  - ✅ `AuthGuard` protège toutes les routes `/dashboard/*` (session obligatoire)
  - ✅ `AuthGuard(requiredRole="admin")` sur toutes les routes `/admin/*`
  - ✅ `getAccountAccess()` : `isPrivileged` (owner/admin/dm), `isFreemium`
  - ✅ `CreatorDashboard` isolé → accessible via `/dashboard/createur` (interface dédiée "Mes tâches")
  - ✅ Sidebar : Facturation / Comptabilité / KPI verrouillés visuellement pour freemium
- **Manque :**
  - ❌ **CM voit tous les clients** — `fetchClients()` filtre uniquement par `user_id`, sans restriction d'assignation agence
  - ❌ Facturation accessible à tous les rôles (`/dashboard/facturation` = pas de `requiredRole` dans `App.tsx`) — devrait être DM uniquement en agence
  - ❌ KPI PDF restreint au DM uniquement en agence — non enforced (tous y accèdent)
  - ❌ Journal d'activité DM + CM Solo uniquement — non enforced
  - ❌ Paramètres agence DM uniquement — non enforced
  - ❌ Créateur : routing vers `/dashboard/createur` non restreint par rôle côté `App.tsx`
  - ⚠️ CM en agence : accès calendrier filtré à ses clients assignés — absent

---

### Section 8 — Menu Clients
- **Statut :** ⚠️
- **%** : 55%
- **Fait :**
  - ✅ Liste clients avec onglets Actifs / Archivés
  - ✅ `ClientCard` : logo (cercle couleur + initiale), réseaux actifs (badges), nom contact, badge statut
  - ✅ `AddClientModal` : nom, logo, couleurs (marque + secondaire), réseaux, formats, fréquence, notes éditoriales, contacts, mode facturation
  - ✅ Archive / restauration fonctionnelles
  - ✅ Limite freemium 2 clients enforced (bannière avertissement + bouton désactivé)
  - ✅ `ClientDetail` : 4 onglets (Calendrier ✅, Fichiers ⚠️, Factures ⚠️, Activité ⚠️)
- **Manque :**
  - ❌ **ClientCard manque** : nb de posts ce mois, statut du dernier lien de validation, prochaine publication programmée
  - ❌ **Édition client post-création** — aucun `EditClientModal`, aucun `updateClient()` dans `lib/clients.ts`
  - ❌ Mode création rapide (nom + email uniquement, depuis Facturation) — absent
  - ❌ Lien d'onboarding brandé envoyé au client pour qu'il remplisse ses infos
  - ❌ Fiche client : champs secteur d'activité + description absents du schéma
  - ❌ Fiche client : bannière de couverture — non implémentée
  - ❌ Fiche client : CM assigné (en agence)
  - ❌ Onglet Fichiers = stub ("sera bientôt disponible")
  - ❌ Onglet Factures = stub ("sera bientôt disponible") — pas de liaison avec `documents`
  - ❌ Onglet Activité = stub ("sera bientôt disponible")
  - ❌ Historique de validation (tous les preview links avec horodatages)
  - ❌ Badge "Client archivé" sur factures impayées + option "Irrécouvrable"
  - ⚠️ CM : voit tous les clients (non filtré par assignation)

---

### Section 9 — Calendrier éditorial
- **Statut :** ⚠️
- **%** : 60%
- **Fait :**
  - ✅ Calendrier par client (sélecteur client + `EditorialCalendar` par client)
  - ✅ Vue Semaine / Mois (toggle Tabs, implémenté dans `EditorialCalendar.tsx`)
  - ✅ Navigation précédent / suivant (semaine ou mois selon vue)
  - ✅ Filtre par réseau social (dropdown)
  - ✅ Couleurs de marque client appliquées (`clientColor` prop)
  - ✅ Création post (`CreatePostModal`) : réseau, format, date/heure, texte, hashtags, média (image/vidéo)
  - ✅ Édition post (`EditPostModal`) avec changement de statut
  - ✅ Statuts : `idee`, `en_production`, `en_attente_validation`, `valide`, `publie`, `refuse`
  - ✅ `ReviewPostModal` : valider / rejeter upload créateur avec commentaire
  - ✅ Suppression immédiate du média rejeté (Supabase Storage)
- **Manque :**
  - ❌ Double logo en en-tête calendrier (logo client + logo agence/CM)
  - ❌ **Blocs "Périodes de production"** (type Google Calendar multi-jours : Shooting 🔵 / Montage 🟠 / Livraison 🟢 / Personnalisé 🟣)
  - ❌ Statuts CDC manquants : `lien_envoye` (après génération du preview) et `archive` (J+1 après publication) — absents de `POST_STATUTS` dans `lib/posts.ts`
  - ❌ Champ "Note interne" par post (non visible client) — absent de `CreatePostModal`
  - ❌ Avertissement ratio 9:16 TikTok à l'upload
  - ❌ Compression automatique (JPG 10MB→2MB, MP4 500MB→50MB, PDF 50MB→10MB)
  - ❌ Barre de progression compression visible
  - ❌ Max 10 fichiers par post (carrousel) — 1 seul fichier accepté actuellement
  - ❌ Upload PDF (LinkedIn carrousel) — `accept="image/*,video/*"` uniquement dans CreatePostModal
  - ❌ Drag-and-drop repositionnement de post
  - ❌ Notification automatique "Rappel J-1" avant publication
  - ❌ "Marquer comme publié" accessible depuis le Dashboard (section "À publier aujourd'hui")

---

### Section 10 — Workflow Créateur de contenu
- **Statut :** ⚠️
- **%** : 55%
- **Fait :**
  - ✅ **Mode 1 — Tâche assignée** : `fetchAssignedTasks()` filtre les posts avec `assigne_a = user.id`
  - ✅ Interface créateur : tâches "À faire" + "À refaire" (rejetées avec commentaire)
  - ✅ Upload fichier sur tâche assignée → statut `en_attente_validation` + notification in-app au CM
  - ✅ Validation CM (`validateCreatorUpload`) → notification in-app au créateur
  - ✅ Rejet CM (`rejectCreatorUpload`) : suppression immédiate du fichier Storage + notification in-app au créateur avec commentaire
  - ✅ `ReviewPostModal` côté CM : valider ✅ ou rejeter ❌ avec commentaire obligatoire
  - ✅ `getTeamMemberStats()` : stats total/complétés/rejetés par créateur
- **Manque :**
  - ❌ **Mode 2 — Boîte de dépôt** : complètement absent — aucune page, aucun composant, aucune table dédiée au dépôt libre par client
  - ❌ Si validé en Mode 2 : fichier disponible dans médiathèque client (médiathèque non implémentée)
  - ❌ Barre de progression upload + compression visible (upload direct sans feedback visuel de progression)
  - ❌ Notifications push (Web Push API) — uniquement in-app via `createNotification()`
  - ⚠️ Notification au créateur quand tâche assignée — `createNotification()` appelé, mais push absent

---

## Résumé sections 6–10

| Section | Statut | % |
|---------|--------|---|
| 6 — Onboarding gamifié | ❌ | 35% |
| 7 — Rôles & Permissions | ⚠️ | 55% |
| 8 — Menu Clients | ⚠️ | 55% |
| 9 — Calendrier éditorial | ⚠️ | 60% |
| 10 — Workflow Créateur | ⚠️ | 55% |

**Moyenne sections 6–10 : 52%**

### Points bloquants identifiés
1. **Mode 2 boîte de dépôt** (§10.2) — absent intégralement
2. **Édition client post-création** (§8) — absente (no `updateClient`, no `EditClientModal`)
3. **Blocs périodes de production** (§9.2) — absents
4. **5 étapes onboarding + badges** (§6.2/6.3) — non implémentés
5. **Role enforcement** (§7) — uniquement visuel (sidebar lock), pas de route-level guard pour DM/CM
