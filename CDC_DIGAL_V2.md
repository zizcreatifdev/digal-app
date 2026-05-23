# CDC DIGAL V2 -- Cahier des charges complet
## Plateforme SaaS de gestion editoriale pour Community Managers

**Version** : 2.0  
**Date** : Mai 2026  
**Type** : PWA (Progressive Web App)  
**Marche cible** : Senegal -- marche francophone africain  
**Domaine** : digal.sn  
**Statut** : Base sur l'implementation reelle v1.0.0

_Convention : [FUTUR] = prevu mais non encore implemente_

---

## TABLE DES MATIERES

1. Vision et Positionnement
2. Comptes et Pricing
3. Landing Page
4. Dashboard Owner
5. Authentification et Licences
6. Onboarding par profil
7. Roles et Permissions
8. Menu Clients
9. Calendrier editorial
10. Workflow Createur
11. Lien de previsualisation
12. Rapports KPI PDF
13. Facturation FCFA
14. Comptabilite
15. Journal d'activite et Notifications
16. Parametres
17. Systeme de licences Owner
18. Parrainages
19. Support et Boite a idees
20. Temoignages landing
21. Emails transactionnels (Brevo)
22. Infrastructure technique

---

## 1. VISION ET POSITIONNEMENT

### 1.1 Probleme resolu

Les Community Managers senegalais gèrent leur workflow de facon fragmentee : WhatsApp pour la communication client, Google Drive pour les fichiers, Excel pour le calendrier, et des outils disparates pour la facturation. Digal centralise tout en une seule plateforme pensee pour le contexte africain.

### 1.2 Ce que Digal n'est pas

Digal n'est pas un outil de publication automatique sur les reseaux sociaux. Il ne concurrence pas Hootsuite ou Buffer. La publication reste manuelle. Digal gere tout ce qui se passe avant la publication : planification, production, validation client, facturation.

### 1.3 Proposition de valeur

- Calendrier editorial par client avec filtres par reseau social
- Lien de previsualisation client avec aperçus natifs des reseaux sociaux
- Validation client integree avec historique horodate
- Facturation et comptabilite contextualisees (FCFA, Wave, Orange Money, BRS)
- Systeme de parrainage avec mois de licence offerts
- Pense pour le marche senegalais et africain

### 1.4 Reseaux sociaux supportes

- Instagram (image, video, reel, story, carrousel)
- Facebook (image, video, texte)
- LinkedIn (image, video, texte, carrousel PDF)
- X / Twitter (texte, image, video)
- TikTok (video verticale 9:16 uniquement)

---

## 2. COMPTES ET PRICING

### 2.1 Types de comptes

| Plan | Ancien nom | Description |
|------|------------|-------------|
| Decouverte | Freemium | CM solo, 2 clients actifs max, 1 utilisateur |
| CM Pro | Solo Standard | CM solo, clients illimites, 1 utilisateur |
| Studio | Agence Standard | 1 DM + membres CM + Createurs (quota configurable) |
| Elite | Agence Pro | 1 DM + membres CM + Createurs (quota superieur) |
| Elite Sur-mesure | -- | Au-dela du quota Elite, demande personnalisee |

### 2.2 Pricing

| Plan | Equivalant mensuel | Licence 6 mois |
|------|--------------------|----------------|
| Decouverte | 0 FCFA | -- |
| CM Pro | 15 000 FCFA | 75 000 FCFA |
| Studio | 35 000 FCFA | 175 000 FCFA |
| Elite | 55 000 FCFA | 275 000 FCFA |
| Elite Sur-mesure | Tarif sur mesure | Devis personnalise |

Les prix sont stockes dans la table `plan_configs` (durees et prix par plan, editables depuis AdminPlans). Une reduction peut etre appliquee via une cle promotionnelle generee par l'Owner.

### 2.3 Limites du plan Decouverte

- 2 clients actifs maximum
- 3 clients archives maximum
- 3 modeles de posts maximum
- 1 utilisateur uniquement (pas d'equipe)
- Modules Facturation, Comptabilite et Rapports KPI inaccessibles
- Filigrane "Cree avec Digal" sur les liens de previsualisation
- Toutes les fonctionnalites Pro visibles dans la sidebar avec cadenas et badge "Pro" -- au clic, modal d'upgrade avec apercu de la fonctionnalite

### 2.4 Membres par plan (Agence)

Le nombre maximum de membres (CM + Createurs) est configurable par plan depuis AdminPlans (`plans.max_membres`). L'affichage sur la landing page est dynamique et se met a jour automatiquement.

### 2.5 Methodes de paiement

Wave, YAS, Orange Money, virement bancaire, cash -- gestion manuelle par l'Owner depuis le dashboard.

### 2.6 Demande Elite Sur-mesure

Depuis la landing page, un formulaire dedie (`EliteContactModal`) permet de soumettre une demande pour le plan sur-mesure (6 champs : nom, entreprise, email, telephone, taille equipe, besoins). Les demandes sont enregistrees dans la table `elite_requests` et visibles dans AdminWaitlist (onglet "Demandes Elite").

### 2.7 Factures de licence

Chaque activation de licence genere une entree dans `owner_payments` et un PDF telerechargeable depuis les Parametres (onglet "Ma licence"). Le montant est 0 FCFA pour les licences offertes.

---

## 3. LANDING PAGE

### 3.1 Structure de la page

1. **Header** : Logo Digal + bouton "Se connecter" + bouton CTA "Rejoindre la liste d'attente"
2. **Hero section** : Accroche + countdown configurable + CTA
3. **Marquee banner** : defilement en boucle
4. **Section probleme** : ce que les CM vivent (WhatsApp, Excel, Drive)
5. **Section solution** : ce que Digal resout
6. **MockupsSection** : 4 cartes de fonctionnalites animees (Framer Motion)
7. **Section pricing** : tableau des 4 plans avec toggle Mensuel / 6 mois / Annuel
8. **CTA final**
9. **Footer** : liens CGU + Politique de confidentialite + contact

### 3.2 Countdown

- Affiche en hero section : "Lancement dans JJ:HH:MM:SS"
- Date de lancement parametrable depuis AdminPlateforme (`site_settings.launch_date`)
- Toggle show/hide depuis AdminPlateforme (`site_settings.show_countdown`)
- A zero : transformation automatique en "Digal est lance -- rejoignez-nous" + CTA "Creer mon compte"
- Aucune intervention manuelle necessaire

### 3.3 Liste d'attente

- Formulaire : Prenom, Nom, Email
- Confirmation automatique par email a l'inscription
- Validation manuelle par l'Owner depuis AdminWaitlist (bouton "Approuver")
- Email de bienvenue automatique envoye a l'approbation via Brevo
- Messages d'activation personnalisables avec variables [Prenom][Plan][Duree][Lien] (table `activation_messages`)

### 3.4 Pricing section

- Toggle 3 options : Mensuel / 6 mois / Annuel
- Badges de reduction (-X%) affiches sur les options non mensuelles
- Texte "au lieu de X FCFA" visible
- Taglines distinctes par plan
- Prix charges depuis Supabase (`plan_configs`) en temps reel
- Texte du nombre de membres dynamique depuis `plans.max_membres`
- Carte Elite Sur-mesure : bouton "Demander un devis" -> EliteContactModal

### 3.5 Pages legales

- `/cgu` : Conditions Generales d'Utilisation (droit senegalais)
- `/privacy` : Politique de Confidentialite (Loi n 2008-12)
- `/changelog` : historique public des mises a jour

### 3.6 URLs principales

```
digal.sn/                         -> Landing page
digal.sn/waitlist                 -> Formulaire liste d'attente
digal.sn/login                   -> Connexion
digal.sn/register                -> Inscription
digal.sn/dashboard               -> Application (acces restreint)
digal.sn/admin                   -> Dashboard Owner (2FA obligatoire)
digal.sn/preview/:slug           -> Liens validation clients (public)
digal.sn/ref/:code               -> Page de parrainage (public)
digal.sn/cgu                     -> CGU
digal.sn/privacy                 -> Politique de confidentialite
digal.sn/changelog               -> Changelog public
digal.sn/compte-suspendu         -> Page compte suspendu (public)
digal.sn/activate/:token         -> Activation de compte (public)
```

---

## 4. DASHBOARD OWNER

### 4.1 Acces et securite

- URL : digal.sn/admin
- Authentification : Email + mot de passe + TOTP 2FA obligatoire
- `AdminTotpGate` : enrollment QR code genere localement (lib `qrcode`) + verification code 6 chiffres + AAL2 Supabase
- Completement separe de l'application utilisateur

### 4.2 Navigation

```
Tableau de bord (KPIs globaux)
Utilisateurs
    Liste d'attente (+ Demandes Elite)
    Comptes
    Licences
    Parrainages
Plateforme
    Parametres generaux (countdown, parrainage)
Plans tarifaires
Emails marketing
Facturation Owner
Contrats
Guides
Documentation
Securite et Journal
```

### 4.3 Tableau de bord KPIs

Widgets affiches :

- MRR (revenu mensuel recurrent)
- Nombre de comptes actifs (Solo separe / Agence separe)
- Nombre de licences vendues ce mois
- Licences expirant dans les 30 prochains jours
- Comptes freemium vs comptes licencies
- Taux de conversion freemium vers licence
- Total parrainages / parrainages ce mois / a recompenser / demandes quota en attente

### 4.4 Gestion des comptes (AdminComptes)

**Liste :**
- Filtres par type et statut
- Export CSV de tous les comptes
- Badges statut (actif, expire, suspendu, suppression en cours)

**Fiche compte (modal au clic) :**
- En-tete : avatar avec initiales colorees, email, derniere connexion
- Onglet Apercu : clients actifs, posts, liens generes, factures du mois
- Onglet Actions :
  - Facturation plan en 3 etapes (type, duree depuis plan_configs, montant calcule automatiquement)
  - Toggle offrir la licence (montant -> 0 FCFA)
  - Section paiement (methode, reference)
  - Zone dangereuse : suspendre / restituer / supprimer avec confirmations
  - Input quota invitations de parrainage
- Onglet Financier : CA facture, CA encaisse, depenses saisies, masse salariale (lecture seule)

**Suspension et suppression :**
- Suspension : `users.statut = "suspendu"` -> deconnexion immediate -> page `/compte-suspendu`
- Suppression planifiee : flag `scheduled_deletion_at` -> cron pg_cron J+30 -> suppression definitive
- Annulation possible avant J+30
- Edge function `ban-user` pour les operations sensibles

### 4.5 Gestion des licences (AdminLicences)

- Generer une cle de licence (type, duree depuis plan_configs, promo -30%)
- Format des cles : `DIGAL-SOLO-XXXXXX` / `DIGAL-STD-XXXXXX` / `DIGAL-PRO-XXXXXX`
- Activer directement sur un compte (sans cle)
- Prolonger manuellement (ajout de mois cumulatifs)
- Generer une facture PDF professionnelle a l'envoi (logo Digal, couleurs de marque, tableau plan/duree/montant, cle encadree)
- Email de livraison automatique avec PDF en piece jointe (Brevo)
- Voir toutes les licences generees (utilisees ou disponibles)

### 4.6 Liste d'attente (AdminWaitlist)

- Onglet "Liste d'attente" : approbation individuelle ou groupee
- Onglet "Demandes Elite" : tableau avec statuts (en_attente / contacte / signe / refuse), select inline, copier contact, compteurs
- Messages d'activation personnalisables avec variables dynamiques
- Email d'approbation automatique envoye via Brevo a la validation

### 4.7 Emails marketing (AdminEmails)

Templates predefinies (editables) :
- Bienvenue, Expiration licence, Promotion, Nouveautes, Relance freemium, Email libre

Variables disponibles : prenom, nom, nom_entreprise, type_compte, date_expiration, nb_clients

Segmentation : tous, Freemium, licencies, expirant bientot, Solo, Agence, inactifs +30j

Workflow : Redaction -> segment -> previsualisation -> envoi immediat ou planifie.

### 4.8 Parametres plateforme (AdminPlateforme)

- Widget countdown : date + heure de lancement, toggle show/hide, apercu jours restants
- Section parrainage : toggle activation, editeur tiers (JSON cle/valeur), template message WhatsApp

### 4.9 Plans tarifaires (AdminPlans)

- Gestion des plans : nom, prix, features, toggle actif/populaire
- Configurations tarifaires (`plan_configs`) : durees/prix par plan, toggle actif/populaire, edition inline, ajout
- Membres max par plan : input `max_membres` + toggle Illimite

### 4.10 Securite et journal

- Journal activite : device, navigateur, ville et pays avec flag (geolocalisation via ip-api.com)
- Logs de securite : device + navigateur (parse depuis user_agent), tentatives de connexion
- Edge function `geolocate-ip` -> ip-api.com -> stockage dans `activity_logs.city/country`
- Edge function `keep-alive` (pg_cron toutes les 48h) pour maintenir les connexions actives

---

## 5. AUTHENTIFICATION ET LICENCES

### 5.1 Inscription

1. Formulaire avec React Hook Form + Zod : Prenom, Nom, Email, Mot de passe
2. Confirmation email obligatoire avant acces (Supabase Auth)
3. Acces immediat en mode Decouverte (Freemium) apres confirmation
4. Wizard onboarding au premier acces

### 5.2 Connexion

- Email + mot de passe (React Hook Form + Zod)
- Reinitialisation mot de passe par email (page `/reset-password`)
- [FUTUR] Option "Se souvenir de moi"

### 5.3 Activation d'une licence

- Depuis Parametres -> Ma licence -> bouton "Activer une licence"
- Saisie de la cle de licence (`DIGAL-TYPE-XXXXXX`)
- Validation par regex : `DIGAL-(SOLO|STD|PRO)-[A-Z0-9]{6}`
- RPC `activate_license_key` : messages distincts "Cle introuvable" / "deja utilisee"
- Acces etendu immediat a l'activation
- Mois de parrainage eventuellemet appliques automatiquement a la premiere activation

### 5.4 Extension de licence (cumulative)

- Nouvelle cle collee -> duree ajoutee a la date d'expiration actuelle
- Exemple : 2 mois restants + nouvelle licence 6 mois = 8 mois

### 5.5 Expiration de licence

- Notifications in-app + email : J-30, J-15, J-7 (cron pg_cron + edge function `expiry-reminders`)
- A expiration : retour automatique en mode Decouverte (donnees conservees, acces restreint)
- Pop-up d'expiration a chaque connexion avec bouton "Renouveler"

### 5.6 Suspension de compte

- Verification du statut `users.statut` a chaque connexion (AuthGuard)
- Compte suspendu -> deconnexion immediate -> redirect `/compte-suspendu`
- Page `/compte-suspendu` : message explicatif, lien de contact

### 5.7 PWA (Progressive Web App)

- Installable sur iOS, Android et desktop (icone sur ecran d'accueil)
- Service Worker Workbox (strategy injectManifest)
- Cache statique : assets JS, CSS, PNG (precache)
- Cache API Supabase : NetworkFirst (24h, timeout 5s)
- Cache Storage Supabase : CacheFirst (7 jours)
- Mise a jour automatique en arriere-plan
- Notifications push Web (VAPID) avec opt-in dans Parametres
- Fix clavier iOS : viewport-fit=cover, min-h-[100dvh], ios-scroll-container

---

## 6. ONBOARDING PAR PROFIL

### 6.1 Wizard initial

A la premiere connexion : wizard 4 etapes avec progression visuelle.

| Etape | Contenu |
|-------|---------|
| 1 | Bienvenue + presentation Digal |
| 2 | Profil (prenom, nom, avatar) |
| 3 | Agence / Marque (logo, couleur de marque) |
| 4 | Terminer |

Skip global possible. Progression sauvegardee en base (`site_settings`).

### 6.2 Checklist onboarding flottante

Apres le wizard, une checklist flottante et retractable accompagne l'utilisateur :

| Etape | Action requise | Badge |
|-------|----------------|-------|
| 1 | Configurer le profil | "Identite creee" |
| 2 | Ajouter le premier client | "Premier client" |
| 3 | Creer le premier post | "Calendrier lance" |
| 4 | Generer le premier lien preview | "Pret pour le client" |
| 5 | Creer le premier devis | "Pro complet" |

- Badges stockes en base de donnees
- Modal de felicitations quand les 5 etapes sont completees
- Slide parrainage propose a la fin de l'onboarding

### 6.3 Etape specifique Agence (DM)

Pour les roles DM / agence, une etape supplementaire "Configure ton equipe" est inseree en position 0 :
- Modal de configuration `nb_cm` / `nb_createurs`
- Sauvegarde dans `users.nb_cm` et `users.nb_createurs`

### 6.4 Profils et specificites

| Profil | Acces apres onboarding |
|--------|------------------------|
| Decouverte | Toutes les fonctionnalites de base, modules Pro verouilles |
| CM Pro | Toutes les fonctionnalites (Facturation, KPI, Comptabilite) |
| Studio / DM | Toutes les fonctionnalites + gestion equipe |
| Createur | Interface "Mes taches" uniquement (CreatorDashboard) |

---

## 7. ROLES ET PERMISSIONS

### 7.1 Tableau complet des permissions

| Fonctionnalite | Owner | Admin | DM | Solo | CM | Createur | Decouverte |
|----------------|-------|-------|----|------|----|----------|------------|
| Panel /admin/* | OUI | OUI | NON | NON | NON | NON | NON |
| Dashboard principal | NON | NON | OUI | OUI | OUI | OUI | OUI |
| Voir tous les clients | -- | -- | OUI | OUI | Non (ses clients) | NON | OUI (limite 2) |
| Ajouter / modifier clients | -- | -- | OUI | OUI | OUI | NON | OUI |
| Calendrier editorial | -- | -- | OUI | OUI | OUI (ses clients) | NON | OUI |
| Creer des posts | -- | -- | OUI | OUI | OUI | NON | OUI |
| Assigner taches createur | -- | -- | OUI | OUI | OUI | NON | NON |
| Vue "Mes missions" | -- | -- | NON | NON | NON | OUI | NON |
| Boite de depot (upload) | -- | -- | OUI | OUI | OUI | OUI | OUI |
| Valider / rejeter fichiers | -- | -- | OUI | OUI | OUI | NON | OUI |
| Generer lien previsualisation | -- | -- | OUI | OUI | OUI | NON | OUI |
| Rapports KPI PDF | -- | -- | OUI | OUI | NON | NON | NON |
| Facturation | -- | -- | OUI | OUI | NON | NON | NON |
| Comptabilite | -- | -- | OUI | OUI | NON | NON | NON |
| Journal activite | -- | -- | OUI | OUI | NON | NON | NON |
| Gestion equipe | -- | -- | OUI | NON | NON | NON | NON |
| Parametres agence | -- | -- | OUI | OUI | NON | NON | OUI (limite) |

### 7.2 Roles techniques (users.role)

| Valeur | Description |
|--------|-------------|
| `owner` | Super-admin proprietaire de la plateforme |
| `admin` | Admin plateforme (acces panel /admin/*) |
| `dm` | Directeur Marketing / Chef de projet agence |
| `solo` | Freelance solo (plan CM Pro) |
| `agence_standard` | Agence plan Studio |
| `agence_pro` | Agence plan Elite |
| `freemium` | Compte Decouverte gratuit |
| `cm` | Community Manager (membre equipe) |
| `createur` | Createur de contenu (acces restreint) |

### 7.3 Logique d'acces centralisee

`src/lib/account-access.ts` -> `getAccountAccess(role)` :
- `isPrivileged` = owner, admin, dm
- `isFreemium` = role "freemium" sans plan actif

### 7.4 Protection des routes

`AuthGuard` verifie la session et le role a chaque navigation. Routes `/admin/*` requierent `requiredRole="admin"` et passage de `AdminTotpGate` (AAL2).

---

## 8. MENU CLIENTS

### 8.1 Acces

- DM / Solo : tous les clients
- CM : uniquement ses clients assignes (`assigned_cm`)
- Createur : pas d'acces
- Decouverte : acces avec limite 2 actifs (FreemiumLimitModal au depassement)

### 8.2 Liste des clients

Chaque client affiche en carte :
- Logo (cercle couleur + initiale si pas de logo)
- Reseaux actifs (icones)
- Couleur de marque
- Bouton d'action rapide

Onglets : Actifs / Archives.
Recherche par nom.

### 8.3 Ajout d'un client

Modal `AddClientModal` :
- Nom, logo, reseaux actifs, couleurs de marque (principale + secondaire)
- Formats de contenu et frequence de publication
- Notes editoriales
- Contacts (nom, email, telephone du referent)
- Mode facturation

Pas de suppression : uniquement archivage. Limite freemium : 3 archives maximum.

### 8.4 Edition d'un client

`EditClientModal` disponible depuis `ClientDetail` (bouton "Modifier"). Toutes les informations sont modifiables post-creation.

### 8.5 Fiche client (ClientDetail)

- Slug modifiable (`clients.preview_slug`) -- utilise dans les liens preview
- Onglet Calendrier : calendrier editorial du client
- Onglet Fichiers : drop-box et historique fichiers
- Onglet Factures : factures liees au client
- Onglet Activite : actions recentes
- Barre de progression mensuelle : posts `programme_valide` + `publie` / total

### 8.6 Archivage

- Pas de suppression de client -- uniquement archivage
- Donnees conservees en lecture seule
- Reactivation possible a tout moment
- Freemium : limite 3 archives enforced (FreemiumLimitModal)

---

## 9. CALENDRIER EDITORIAL

### 9.1 Acces et navigation

- Un calendrier par client (accessible depuis ClientDetail ou menu principal)
- Vue mensuelle (mois courant par defaut)
- Filtres : par reseau social, par statut, par membre de l'equipe
- [FUTUR] Vue semaine

### 9.2 Types d'entrees

**Post :**
- Reseau social cible
- Texte / legende
- Fichiers media (image, video, PDF) -- carrousel jusqu'a 10 fichiers
- Date et heure de publication
- Statut
- Hashtags
- Note interne (non visible par le client)

**Periode de production :**
- Bloc colore sur plusieurs jours
- Types predefinies : Shooting photo/video, Montage/post-production, Livraison de contenu
- Type Personnalise : nom libre + color picker
- Createur assigne (optionnel)
- Description de la mission

### 9.3 Cycle de vie d'un post (statuts verrouilles)

```
brouillon
    -> en_attente_validation (CM soumet)
    -> programme_valide (client approuve)
    -> publie (CM marque manuellement)

brouillon (si refuse par le client)
```

Regles de transition (Regles 1-5) :
1. Seul le CM/DM peut soumettre un post (brouillon -> en_attente_validation)
2. Seuls les posts "en_attente_validation" apparaissent dans les liens preview
3. Approbation client -> statut "programme_valide"
4. Refus client -> retour "brouillon" + notification CM
5. Seul un post "programme_valide" peut etre marque "publie"

### 9.4 Couleurs par statut

Chaque statut a une couleur de bordure distinctive definie dans `POST_STATUT_HEX` (PostCard).

### 9.5 Boutons contextuels (PostCard)

Selon le statut : Soumettre / Generer lien / En attente / Publier.

### 9.6 Formats et validation par reseau

| Reseau | Formats acceptes | Specificite |
|--------|------------------|-------------|
| Instagram | JPG, PNG, MP4 | Standard |
| Facebook | JPG, PNG, MP4 | Standard |
| LinkedIn | JPG, PNG, MP4, PDF | Carrousel PDF accepte |
| X / Twitter | JPG, PNG, MP4 | Standard |
| TikTok | MP4 uniquement | 9:16 obligatoire -- avertissement si ratio incorrect |

### 9.7 Compression et limites

- Images : compression automatique -> 2 Mo maximum (browser-image-compression)
- Barre de progression visible pendant la compression
- Carrousel : jusqu'a 10 fichiers par post
- Drag & drop pour reordonner les medias (CreatePost + EditPost)

### 9.8 Templates de posts

- Creation de modeles (titre + texte + reseau + format)
- DM / Solo : modeles globaux disponibles pour toute l'agence
- Freemium : limite 3 modeles au total (FreemiumLimitModal)

---

## 10. WORKFLOW CREATEUR

### 10.1 Mode 1 -- Tache assignee

1. CM / DM cree un post et assigne une tache au createur (champ `assigne_a`)
2. Createur recoit une notification in-app
3. Createur uploade le fichier directement sur le post assigne (CompressingPostMedia)
4. CM / DM recoit une notification "Fichier uploade"
5. CM / DM valide ou rejette avec commentaire obligatoire
6. Si rejete : fichier supprime immediatement + email de rejet envoye au createur
7. Si valide : fichier lie au post, pret a l'emploi

### 10.2 Mode 2 -- Boite de depot (livraisons libres)

1. Createur uploade dans la boite de depot generale (`drop_box_files`)
2. CM / DM recoit une notification
3. CM / DM valide ou rejette avec commentaire obligatoire
4. Si valide : fichier disponible, le CM le lie a un post
5. Si rejete : fichier supprime immediatement

### 10.3 Interface Createur (CreatorDashboard)

- Vue "Mes missions" : taches assignees avec client, type, deadline, reseau, statut
- Statuts : En attente / Uploade / Valide / Rejete
- Boite de depot libre
- Commentaires du CM/DM sur les fichiers rejetes
- Pas d'acces au calendrier complet, aux clients, a la facturation

### 10.4 Regle stockage ephemere

Un fichier rejete est supprime immediatement et definitivement. Le commentaire de rejet est conserve dans le journal.

---

## 11. LIEN DE PREVISUALISATION

### 11.1 Generation du lien

- Accessible depuis le calendrier du client
- CM ou DM genere le lien
- Selection de la periode : semaine ou mois (configurable dans Parametres)
- Periode par defaut stockee dans `site_settings.preview_default_period` (par utilisateur)
- Seuls les posts "en_attente_validation" sont inclus
- [FUTUR] Selection manuelle des posts a inclure / exclure

### 11.2 Format du lien

```
digal.sn/preview/{slug}
```

Slug : `{clientSlug}-{random6}` ou `random12` si pas de slug client.
Slug client (`clients.preview_slug`) : modifiable depuis ClientDetail par le DM.
Duree de validite : configurable (7, 14 ou 30 jours par defaut selon parametres).

### 11.3 Page de previsualisation (vue client)

**En-tete :**
- Logo agence + logo client
- Message d'accueil personnalisable par le CM (champ dans le modal de generation)
- Periode concernee
- Countdown "Ce lien expire dans X heures"

**Navigation :**
- Onglets reseaux : uniquement les reseaux actifs du client
- Sur mobile : onglets scrollables horizontalement

**Previsualisation :**
- Chaque reseau : apercu mockup natif (`NetworkMockup`)
- Chaque post : visuel + texte + hashtags

**Actions du client par post :**
- Bouton "Approuver"
- Bouton "Refuser" (commentaire obligatoire)
- "Tout valider" / "Tout refuser" avec commentaire global
- [FUTUR] Edition inline du texte par le client

**Envoi des retours :**
- Bouton "Envoyer mes retours au CM" apres review de tous les posts

### 11.4 Apres la decision du client

**Posts approuves :** passage en statut "programme_valide", notification CM/DM in-app + push.

**Posts refuses :** retour en statut "brouillon" + notification CM avec commentaires.

### 11.5 Expiration du lien

- Apres la duree definie : lien inaccessible avec message "Ce lien a expire" + date d'expiration
- CM notifie si le lien expire sans reponse du client (`expiry_notified` flag)
- Nettoyage automatique par l'edge function `scheduled-cleanup`

### 11.6 Freemium

- Lien de previsualisation disponible en Decouverte
- Filigrane "Cree avec Digal" en bas de page

---

## 12. RAPPORTS KPI PDF

### 12.1 Qui peut generer

- CM Solo / plan CM Pro : ses propres rapports
- Digital Manager (agence) : rapports de tous les clients
- CM en agence : acces restreint -- ne peut pas generer de rapport KPI PDF
- Freemium : inaccessible (ProUpgradeModal)

### 12.2 Periodes disponibles

- Mensuelle (par defaut) -- selecteur mois/annee
- Trimestrielle -- selecteur T1 / T2 / T3 / T4 + annee
- Personnalisee -- 2 datepickers libres
- Depuis le debut -- cumul de toutes les periodes, tableaux mensuels inclus

### 12.3 KPIs par reseau

**Instagram :** Abonnes, Portee, Impressions, Engagement, Vues stories/reels, Likes, Commentaires, Partages

**Facebook :** Fans, Portee, Impressions, Engagement, Clics, Likes, Commentaires, Partages

**LinkedIn :** Abonnes, Impressions, Clics, Reactions, Commentaires, Partages

**X / Twitter :** Abonnes, Impressions, Likes, Retweets, Reponses, Clics

**TikTok :** Abonnes, Vues, Likes, Commentaires, Partages, Favoris, Portee

**Regle absolue :** un champ vide est invisible dans le PDF. Un reseau entier vide est absent du rapport.

### 12.4 Contenu du rapport PDF

- En-tete : logo client + logo agence + periode
- KPIs par reseau (uniquement ceux renseignes, valeur 0 incluse)
- Points forts / axes d'amelioration
- Periode "Depuis le debut" : tableaux mensuels cumules
- Labels de periode adaptes a chaque mode (mensuel, trimestriel, personnalise, cumulatif)
- Telechargeable directement depuis la liste des rapports

---

## 13. FACTURATION FCFA

### 13.1 Acces

- DM uniquement en agence
- CM Pro / Solo : acces complet
- Createur, CM en agence, Decouverte : inaccessible (ProUpgradeModal)

### 13.2 Structure

Deux types de documents dans la table `documents` :
- **Devis** : creation, envoi, validation, refus
- **Factures** : creation, enregistrement paiement, statuts

### 13.3 Personnalisation (Parametres -> Facturation)

Configure une fois, applique a tous les documents :
- Logo de l'agence / CM
- Nom, adresse, telephone, email
- Numero NINEA / RC (optionnel)
- Tampon (upload PNG transparent)
- Signature (upload PNG transparent)
- Pied de page personnalise (texte libre)

### 13.4 Numerotation automatique

Format configurable dans Parametres (sigle saisi librement) :
- Devis : `DEV-[SIGLE]-[ANNEE]-[0001]`
- Facture : `FAC-[SIGLE]-[ANNEE]-[0001]`
- Exemple : `DEV-LCS-2026-0001`, `FAC-LCS-2026-0001`
- Increment automatique. [FUTUR] Remise a zero au 1er janvier.

### 13.5 Creation d'un devis / facture

- Selection du client (depuis la base clients ou creation rapide nom + email)
- Lignes de prestation : description + quantite + prix unitaire
- Ligne boost publicitaire optionnelle (pre-remplie depuis les depenses Boost non facturees)
- Remise en % (appliquee au sous-total)
- BRS 5% : active par defaut, desactivable
- TVA 18% : desactivee par defaut, activable
- Conditions de paiement (texte libre)
- Methodes de paiement affichees : Wave, YAS, Orange Money, Virement, Cash

### 13.6 Statuts devis

Brouillon / Envoye / Valide / Refuse

Conversion devis -> facture en un clic (copie complete avec reference croisee).

### 13.7 Statuts facture

En attente / Payee / Partiellement payee / En retard / Irrécouvrable / Annulee / Archive

Enregistrement paiement : selection methode + reference de transaction.

### 13.8 PDF

- Generation jsPDF avec palette de marque (couleurs, logo, tampon, signature)
- Style epure : header branding, table description/qte/prix/montant, totaux aligne a droite, footer Digal
- Telechargeable a tout moment

### 13.9 Boost -> ligne facture automatique

Les depenses de type "Publicite / Boost" marquees avec un client affecte apparaissent automatiquement comme ligne facturable optionnelle sur la prochaine facture du client. Le DM choisit de l'inclure ou non (BRS non applicable sur les boosts).

---

## 14. COMPTABILITE

### 14.1 Acces

Memes restrictions que la Facturation (DM + CM Pro / Solo).

### 14.2 Depenses

Categories predefinies :
- Loyer bureau
- Abonnements logiciels
- Fournitures / materiel
- Publicite / Boost reseaux sociaux (avec affectation client + reseau obligatoires)
- Autres (categorie libre)

Saisie d'une depense Boost : selection du reseau (Facebook Ads, Instagram Ads...) + montant + client affecte. Cette depense devient une ligne facturable optionnelle dans la prochaine facture du client.

### 14.3 Masse salariale

- Liste des membres de l'equipe avec salaire mensuel
- Suivi par mois : Paye / Non paye par membre
- Historique des paiements salariaux

### 14.4 Tableau de bord financier

- Revenus : total factures emises / total encaisse
- Charges : masse salariale + depenses du mois
- Resultat : Revenus - Charges
- Graphiques Recharts (evolution mensuelle)
- Export CSV (papaparse) : colonnes depenses + salaires

---

## 15. JOURNAL D'ACTIVITE ET NOTIFICATIONS

### 15.1 Journal d'activite

Accessible : DM + CM Solo uniquement.

Actions tracees dans `activity_logs` :
- Connexions et deconnexions
- Creation / modification / suppression de posts
- Upload et validation / rejet de fichiers
- Generation de liens preview
- Decisions du client (approbation / refus + commentaires)
- Actions sur factures et devis
- Modifications des parametres

Informations affichees : device, navigateur, ville et pays (avec flag emoji), horodatage.
Filtres : par date, par type d'action.
Pagination integree.

### 15.2 Notifications in-app

- Cloche dans le header avec badge numerique
- Panneau lateral au clic listant les notifications avec horodatage
- Notifications cliquables (liens vers la page concernee)
- [FUTUR] Suppression automatique apres 30 jours

**Declencheurs par role :**

| Evenement | DM | CM | Createur |
|-----------|----|----|----------|
| Client valide le lien preview | OUI | OUI | NON |
| Client refuse le lien preview | OUI | OUI | NON |
| Createur uploade un fichier | OUI | OUI | NON |
| Tache assignee au createur | NON | NON | OUI |
| Fichier valide par CM / DM | NON | NON | OUI |
| Fichier rejete par CM / DM | NON | NON | OUI |
| Lien expire sans reponse | OUI | OUI | NON |
| Mois de parrainage gagnes | OUI | OUI | OUI |
| Licence prolongee (parrainage) | OUI | OUI | OUI |

### 15.3 Notifications push (Web Push)

- Opt-in dans Parametres -> toggle
- VAPID keys, table `push_subscriptions`, edge function `send-push`
- Memes evenements que les notifications in-app
- Necessite l'autorisation du navigateur

---

## 16. PARAMETRES

### 16.1 Profil et identite

- Prenom, nom, email, mot de passe
- Photo de profil (upload Supabase Storage)
- Nom de l'agence / marque personnelle
- Logo (upload)
- Couleur de marque

### 16.2 Facturation et comptabilite

- En-tete et pied de page des documents
- Tampon (upload PNG transparent)
- Signature (upload PNG transparent)
- Sigle personnalise pour la numerotation DEV / FAC
- BRS 5% : active par defaut (desactivable)
- TVA 18% : desactivee par defaut (activable)
- Methodes de paiement preconfigurables (Wave, YAS, Orange Money, Virement, Cash)
- Devise : FCFA (fixe)

### 16.3 Equipe (Agence uniquement)

- Inviter un membre (email + role : CM ou Createur)
- Token d'invitation unique + lien copiable
- Invitations en attente visibles + annulation possible
- Retirer un membre
- Definir la repartition equipe (`nb_cm` / `nb_createurs`) avec barre de progression vs quota

### 16.4 Modeles de posts

- Creation de modeles (titre + texte + reseau + format)
- Disponibles pour toute l'agence
- Freemium : limite 3 modeles (FreemiumLimitModal)

### 16.5 Periode preview par defaut

- Semaine courante / Mois courant (configurable par le DM)
- Stocke dans `site_settings.preview_default_period`

### 16.6 Ma licence et factures Digal

- Type de compte actuel
- Date d'expiration de la licence
- Historique des licences activees
- Telechargement des factures Digal (PDF)
- Bouton "Activer une licence" (champ cle DIGAL-TYPE-XXXXXX)

### 16.7 Notifications

- Toggle notifications push Web (opt-in / opt-out)
- [FUTUR] Configuration par type de notification

---

## 17. SYSTEME DE LICENCES OWNER

### 17.1 Generation de cles

Format : `DIGAL-[TYPE]-[6 chars alphanumeriques]`
- `DIGAL-SOLO-A3X9KL` (CM Pro)
- `DIGAL-STD-B7KQMR` (Studio)
- `DIGAL-PRO-C2NWPX` (Elite)

Options disponibles :
- Type de plan
- Duree (depuis `plan_configs` : durees actives par plan)
- Promotion : reduction % sur le prix
- Licence offerte (montant 0 FCFA)

### 17.2 Activation directe

L'Owner peut activer une licence directement sur un compte (sans cle) depuis AdminComptes -> onglet Actions (formulaire 3 etapes : type, duree/prix, paiement).

### 17.3 Prolongation manuelle

Ajout de mois cumulatifs sur la date d'expiration actuelle d'un compte, sans generer de nouvelle cle.

### 17.4 Email de livraison automatique

A la generation ou activation d'une licence, un email professionnel est envoye automatiquement via Brevo avec :
- Template HTML dark (header noir, accent orange #E8511A)
- Logo Digal
- Tableau recapitulatif : plan, duree, date d'expiration
- Cle de licence en evidence
- PDF facture en piece jointe

### 17.5 PDF facture licence

Genere avec jsPDF :
- Fond creme
- Header noir avec logo Digal (PNG base64)
- Ligne orange #E8511A
- Section "Facture a" (coordonnees utilisateur)
- Section "Prestation" (plan, duree, montant, remise eventuelle)
- Cle de licence encadree (fond orange clair, bordure orange)
- Footer noir

### 17.6 Rappels automatiques

Edge function `expiry-reminders` (cron pg_cron quotidien 08:00 UTC) :
- J-30, J-15, J-7 avant expiration : email + notification in-app
- Relance freemium inactif 30j (`relance_sent` flag)
- Auto-approbation des demandes de quota de parrainage apres 1h

---

## 18. PARRAINAGES

### 18.1 Principe

Chaque utilisateur dispose d'un lien de parrainage unique (`/ref/:code`). Quand un file invitee souscrit a un plan paye, le parrain recoit des mois de licence offerts selon un systeme de paliers configurable.

### 18.2 Page de parrainage (`/ref/:code`)

Page publique en 5 slides :
1. Accueil avec identite du parrain
2. Presentation du parrain
3. Avantages de Digal
4. Formulaire d'inscription avec `referred_by` pre-rempli
5. Page de succes

Redirect vers le dashboard si l'utilisateur est deja connecte.

### 18.3 Logique metier (src/lib/referrals.ts)

**`checkReferralQualification(userAuthId, newPlan)`**  
Declenche a chaque changement de plan. Si l'utilisateur a un parrain et souscrit a un plan paye, le statut du parrainage passe a "qualified" et le compteur `referral_count` du parrain est incremente.

**`rewardReferrer(referrerAuthId, monthsToAdd)`**  
Si le parrain a un plan paye : extension directe de sa licence. Si le parrain est en freemium : stockage des mois (`referral_months_earned`).

**`applyReferralMonths(userAuthId)`**  
Applique automatiquement les mois stockes lors de la premiere activation de licence du parrain.

**`requestQuota(userAuthId)`**  
Permet de demander 3 invitations supplementaires (quota actuel + 3, maximum 6). Auto-approbation apres 1 heure si l'Owner n'a pas repondu.

### 18.4 Paliers de recompense

Configures en JSON depuis AdminPlateforme (`site_settings.referral_tiers`) :
```json
{ "1": 1, "3": 2, "5": 3 }
```
Cle = nombre de filleuls qualifies, Valeur = mois de licence offerts.

### 18.5 Interfaces utilisateur

**Page `/dashboard/parrainages` :**
- Lien personnel de parrainage + bouton copier
- Progression vers le prochain palier
- Liste des filleuls avec statut
- Demande de quota supplementaire

**Sidebar :** item "Parrainages" visible pour tous les roles sauf agence_pro.

**OnboardingChecklist :** slide de parrainage propose a la fin de l'onboarding.

### 18.6 Interface admin (AdminParrainages)

Deux onglets :
- **Parrainages** : tableau complet (parrain, file, statut, plan file, date qualification) avec action "Recompenser"
- **Demandes quota** : tableau (utilisateur, quota demande, statut) avec actions "Approuver" / "Rejeter"

Statuts stockes dans la colonne `statut` (pas `status`) -- colonne native en base de donnees.

---

## 19. SUPPORT ET BOITE A IDEES

[FUTUR] -- Non implemente en v1.0.0.

Fonctionnalites prevues :
- Formulaire de contact in-app (bug, question, suggestion)
- Boite a idees : soumission de suggestions avec vote
- Base de connaissances / FAQ accessible depuis le header
- Chat support (optionnel)

---

## 20. TEMOIGNAGES LANDING

[FUTUR] -- Non implemente en v1.0.0.

Fonctionnalites prevues :
- Section temoignages sur la landing page (entre MockupsSection et Pricing)
- Gestion des temoignages depuis AdminPlateforme
- Format : photo, nom, poste, agence, texte, note etoiles
- [FUTUR] Badge "Verifie" pour les comptes Digal actifs

---

## 21. EMAILS TRANSACTIONNELS (BREVO)

### 21.1 Service

**Fournisseur : Brevo** (anciennement Sendinblue -- variable `BREVO_API_KEY`).
Expediteur : `noreply@digal.sn` (nom affiché : "Digal").
Note : ARCHITECTURE.md mentionne encore "Resend" par erreur -- le service actuel est Brevo.

### 21.2 Edge function `send-email`

Point d'entree unique pour tous les emails transactionnels. Appelee via `supabase.functions.invoke("send-email", { body: { type, to, ... } })`.

Types implementes :

| Type | Declencheur |
|------|-------------|
| `bienvenue` | Approbation waitlist |
| `expiration_licence` | Cron J-30, J-15, J-7 |
| `preview_expire` | Lien preview expire sans reponse |
| `rejet_createur` | Rejet d'un upload createur |
| `waitlist_approuve` | Approbation depuis AdminWaitlist |
| `relance_freemium` | Inactivite 30j (flag `relance_sent`) |
| `licence_livraison` | Generation / activation licence (avec PDF joint) |

### 21.3 Edge function `expiry-reminders`

Cron pg_cron quotidien 08:00 UTC :
- Licences expirant dans 30, 15 ou 7 jours -> email + notification in-app
- Freemium inactifs depuis 30j -> email de relance (une seule fois par compte, flag `relance_sent`)
- Demandes de quota parrainage en attente depuis + 1h -> auto-approbation

### 21.4 Edge function `scheduled-cleanup`

Cron quotidien :
- Expire les liens preview (`statut = "expire"`, `expires_at < now`)
- Notifie le CM si le lien expire sans reponse (`expiry_notified` flag)

### 21.5 Variables d'environnement requises

```bash
# Supabase secrets (edge functions)
BREVO_API_KEY=<cle_brevo>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
VAPID_PRIVATE_KEY=<vapid_private_key>
VAPID_PUBLIC_KEY=<vapid_public_key>
VAPID_SUBJECT=mailto:contact@digal.sn

# Frontend (.env)
VITE_SUPABASE_URL=https://quvtfhwcwxijizsiqzpd.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon_key>
VITE_VAPID_PUBLIC_KEY=<vapid_public_key>
```

---

## 22. INFRASTRUCTURE TECHNIQUE

### 22.1 Stack

| Couche | Technologie | Version |
|--------|-------------|---------|
| Framework UI | React | 18.3 |
| Build | Vite + SWC | 5.4 |
| Langage | TypeScript strict | 5.8 |
| Styles | Tailwind CSS | 3.4 |
| Composants UI | shadcn/ui (Radix) | latest |
| Backend / BDD | Supabase (PostgreSQL) | 2.101 |
| Auth | Supabase Auth + TOTP (MFA) | -- |
| State serveur | TanStack React Query | 5.83 |
| Routing | React Router DOM | 6.30 |
| Formulaires | React Hook Form + Zod | 7 / 3 |
| PDF | jsPDF + jsPDF-AutoTable | 4 / 5 |
| Animations | Framer Motion | 12 |
| Charts | Recharts | 2 |
| Tests unitaires | Vitest + Testing Library | 3.2 |
| Tests E2E | Playwright | 1.57 |
| PWA | vite-plugin-pwa + Workbox | 1.2 |

### 22.2 Base de donnees -- Tables principales

| Table | Description |
|-------|-------------|
| `users` | Profils utilisateurs (role, plan, licence_expiration, referral_*, statut) |
| `user_roles` | RBAC Supabase (enum: admin/user) |
| `clients` | Clients (+ `preview_slug` TEXT) |
| `client_networks` | Reseaux sociaux par client |
| `posts` | Posts calendrier editorial |
| `post_templates` | Templates de posts reutilisables |
| `preview_links` | Liens de validation (+ `welcome_message`, `expiry_notified`) |
| `preview_actions` | Decisions des clients (valide/refuse) |
| `documents` | Devis et factures |
| `document_lines` | Lignes de facturation |
| `payments` | Paiements reçus sur factures |
| `kpi_reports` | Rapports KPI mensuels par client |
| `depenses` | Depenses comptables (+ `inclure_facture` BOOLEAN pour boosts) |
| `salaires` | Masse salariale equipe |
| `notifications` | Notifications in-app |
| `activity_logs` | Journal activite (+ device, navigateur, city, country) |
| `security_logs` | Logs securite (connexions, tentatives) |
| `plans` | Plans tarifaires (nom, prix, features, max_membres) |
| `plan_configs` | Configurations durees/prix par plan |
| `license_keys` | Cles de licence generees |
| `owner_payments` | Paiements recus par l'Owner |
| `waitlist` | Liste d'attente inscription |
| `elite_requests` | Demandes plan Elite Sur-mesure |
| `contracts` | Contrats signes numeriquement |
| `contract_templates` | Templates de contrats par plan |
| `marketing_emails` | Campagnes email admin |
| `changelog` | Entrees changelog publique |
| `site_settings` | Parametres globaux cle/valeur |
| `drop_box_files` | Fichiers deposes par les createurs |
| `push_subscriptions` | Abonnements Web Push (VAPID) |
| `referrals` | Historique parrainages (colonne `statut`) |
| `referral_quota_requests` | Demandes quota invitations (colonne `statut`) |
| `activation_messages` | Messages activation personnalisables |

### 22.3 Edge Functions Supabase (Deno)

| Fonction | Role |
|----------|------|
| `send-email` | Emails transactionnels via Brevo |
| `expiry-reminders` | Cron J-30/15/7 + relance freemium + auto-approve quota |
| `scheduled-cleanup` | Expiration liens preview + notification CM |
| `send-push` | Notifications push Web (VAPID) |
| `setup-owner` | Initialisation compte Owner |
| `ban-user` | Suspension / suppression compte |
| `geolocate-ip` | Geolocalisation IP via ip-api.com |
| `keep-alive` | Cron pg_cron toutes les 48h |

### 22.4 Crons (pg_cron)

| Cron | Frequence | Action |
|------|-----------|--------|
| `digal-expiry-reminders` | Quotidien 08:00 UTC | Edge fn expiry-reminders |
| `keep-alive` | Toutes les 48h | Edge fn keep-alive |
| Suppression comptes | Quotidien | Suppression definitive J+30 |

### 22.5 Securite

- Row Level Security (RLS) sur toutes les tables
- JWT Supabase Auth
- TOTP 2FA obligatoire sur /admin/* (QR genere localement via lib `qrcode`)
- Verification `users.statut` a chaque connexion (AuthGuard)
- [FUTUR] Rate limiting sur les endpoints sensibles

### 22.6 Qualite du code

| Metrique | Etat |
|----------|------|
| Tests unitaires | 137/137 (Vitest) |
| Fichiers de test | 10 fichiers dans `src/test/` |
| ESLint | 0 erreur |
| TypeScript | 0 erreur (strict) |
| Build | Passe |

### 22.7 Conventions

- Composants : fonctions flechees, export default pour les pages
- Logique metier dans `src/lib/` (pas dans les composants)
- Client Supabase singleton : `import { supabase } from "@/integrations/supabase/client"`
- `cn()` pour les classes Tailwind conditionnelles
- Devise : toujours FCFA, formatte avec `formatFCFA()` de `src/lib/facturation.ts`
- Errors : `toast.error()` de sonner pour l'utilisateur, `logActivity()` pour les traces
- Commits : `prompt-XX : [description courte en français]`

### 22.8 Regles metier cles

1. Un client archive ne peut pas etre supprime -- donnees conservees indefiniment
2. Un fichier rejete est supprime immediatement et definitivement
3. [FUTUR] Un fichier media de post publie est supprime automatiquement J+1
4. Un lien preview expire apres la duree configuree
5. Un KPI vide dans le rapport est invisible dans le PDF (valeur 0 est affichee)
6. Un compte Decouverte : 1 utilisateur, 2 clients actifs max, 3 archives max, 3 templates max
7. L'extension de licence est cumulative (s'ajoute a la date d'expiration actuelle)
8. La colonne `statut` (pas `status`) est utilisee dans les tables `referrals` et `referral_quota_requests`
9. Toutes les transactions sont en FCFA uniquement
10. La suppression de compte : gel 30 jours -> suppression definitive (cron pg_cron)

---

_Document genere a partir de l'implementation reelle Digal v1.0.0_  
_Derniere mise a jour : Mai 2026_  
_Tous droits reserves -- Digal 2026_
