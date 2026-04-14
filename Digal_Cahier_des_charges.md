# CAHIER DES CHARGES — DIGAL
## Plateforme SaaS de gestion éditoriale pour Community Managers
**Version** : 1.0 MVP  
**Date** : Mars 2026  
**Type** : PWA (Progressive Web App)  
**Marché cible** : Sénégal (French)  
**Domaine** : digal.sn

---

## TABLE DES MATIÈRES

1. Vision & Positionnement
2. Structure des comptes & Pricing
3. Landing Page
4. Dashboard Owner (digal.sn/admin)
5. Authentification & Licences
6. Onboarding immersif gamifié
7. Rôles & Permissions
8. Menu Clients
9. Calendrier éditorial
10. Workflow Créateur de contenu
11. Lien de prévisualisation client
12. Rapports KPI mensuels PDF
13. Facturation
14. Comptabilité
15. Journal d'activité & Notifications
16. Paramètres
17. Architecture technique recommandée

---

## 1. VISION & POSITIONNEMENT

### 1.1 Problème résolu
Les Community Managers sénégalais gèrent aujourd'hui leur workflow de façon fragmentée : WhatsApp pour la communication client, Google Drive pour les fichiers, Excel pour le calendrier, et des outils disparates pour la facturation. Digal centralise tout en une seule plateforme pensée pour le contexte africain.

### 1.2 Ce que Digal n'est PAS
Digal n'est pas un outil de publication automatique sur les réseaux sociaux. Il ne concurrence pas Hootsuite ou Buffer. La publication reste manuelle — Digal gère tout ce qui se passe AVANT la publication : planification, production, validation client, facturation.

### 1.3 Proposition de valeur unique
- Calendrier éditorial brandé par client avec double logo
- Lien de prévisualisation client avec aperçus natifs des réseaux sociaux
- Validation client intégrée avec historique horodaté
- Facturation et comptabilité contextualisées (FCFA, Wave, Orange Money, BRS)
- Stockage éphémère intelligent (économie de stockage automatique)
- Pensé pour le marché sénégalais et africain

### 1.4 Réseaux sociaux supportés
- Instagram (image, vidéo, reel, story, carrousel)
- Facebook (image, vidéo, texte)
- LinkedIn (image, vidéo, texte, carrousel PDF)
- X / Twitter (texte, image, vidéo)
- TikTok (vidéo verticale 9:16 uniquement)

---

## 2. STRUCTURE DES COMPTES & PRICING

### 2.1 Types de comptes

| Type | Description |
|---|---|
| **Freemium** | CM solo, 2 clients actifs max, 1 utilisateur |
| **Solo Standard** | CM solo, clients illimités, 1 utilisateur |
| **Agence Standard** | 1 DM + 3 membres max (CM + Créateurs) |
| **Agence Pro** | 1 DM + 7 membres max (CM + Créateurs) |
| **Agence Sur-mesure** | Au-delà de 7 membres, demande personnalisée |

### 2.2 Pricing

| Offre | Équivalent mensuel | Licence 6 mois |
|---|---|---|
| Freemium | 0 FCFA | — |
| Solo Standard | 15 000 FCFA | 75 000 FCFA |
| Agence Standard | 35 000 FCFA | 175 000 FCFA |
| Agence Pro | 55 000 FCFA | 275 000 FCFA |

**Offre de lancement** : -30% pour les 20 premiers utilisateurs (clé promotionnelle générée depuis le dashboard Owner).

### 2.3 Limites du Freemium
- 2 clients actifs maximum (pas de suppression = archivage, tentative de contournement → blocage après 3 archives)
- 1 utilisateur uniquement (pas d'équipe)
- Pas de module Facturation
- Pas de module Comptabilité
- Pas de Rapports KPI PDF
- Pas de personnalisation du lien de prévisualisation
- Filigrane "Créé avec Digal" sur le lien de prévisualisation client
- Modèles de posts limités à 3
- Toutes les fonctionnalités Pro visibles dans la sidebar avec cadenas 🔒 + badge "Pro" — au clic, page d'aperçu avec mockup + bouton "Débloquer avec une licence"

### 2.4 Méthodes de paiement acceptées
Wave, YAS, Orange Money, virement bancaire, cash — gestion manuelle par l'Owner.

### 2.5 Upgrade Solo → Agence
Paiement du différentiel au prorata des mois restants sur la licence en cours. Géré manuellement par l'Owner depuis le dashboard.

### 2.6 Upgrade équipe Agence
Si une agence veut dépasser son quota de membres :
1. Soumission d'une demande in-app (nb de membres supplémentaires + message optionnel)
2. Notification in-app + email à l'Owner
3. Approbation en 1 clic depuis le dashboard Owner
4. Notification in-app + email à l'agence avec nouveau tarif
5. Confirmation après réception du paiement
6. Activation du nouveau quota en 1 clic par l'Owner

### 2.7 Factures de licence
Chaque compte reçoit une facture dans "Ma licence & factures" dans ses Paramètres :
- Freemium → Facture 0 FCFA mention "Offert"
- Licence payante → Facture montant réel
- Upgrade → Facture complémentaire différentiel
Toutes téléchargeables en PDF.

---

## 3. LANDING PAGE (digal.sn)

### 3.1 Structure de la page
1. **Header** : Logo Digal + bouton "Se connecter" + bouton CTA "Rejoindre la liste d'attente"
2. **Hero section** : Accroche principale + countdown + bouton "Rejoindre la liste d'attente"
3. **Section problème** : Ce que les CM vivent aujourd'hui (WhatsApp, Excel, Drive...)
4. **Section solution** : Ce que Digal résout, en 3-4 points clés
5. **Aperçu visuel** : Screenshots ou mockups de l'app
6. **Section pricing** : Tableau des 4 offres avec comparatif fonctionnalités
7. **Footer** : Contact, CGU, Politique de confidentialité

### 3.2 Countdown
- Affiché en hero section : "Lancement dans JJ:HH:MM:SS"
- Date de lancement paramétrable depuis le dashboard Owner
- À 0 : transformation automatique en "Digal est lancé — rejoignez-nous"
- Pas d'intervention manuelle nécessaire

### 3.3 Liste d'attente
- Formulaire : Prénom, Nom, Email, Type de compte souhaité (Solo / Agence)
- Confirmation automatique par email à l'inscription
- Validation manuelle par l'Owner depuis le dashboard (bouton "Approuver")
- Option d'acceptation automatique activable/désactivable dans les paramètres Owner
- Email de bienvenue automatique envoyé à l'approbation avec lien d'accès

### 3.4 URLs de la plateforme
```
digal.sn/                    → Landing page
digal.sn/waitlist            → Formulaire liste d'attente
digal.sn/login               → Connexion
digal.sn/dashboard           → App (accès restreint)
digal.sn/admin               → Dashboard Owner (2FA obligatoire)
digal.sn/preview/[slug]/[période] → Liens validation clients
digal.sn/docs                → Documentation technique publique
```

---

## 4. DASHBOARD OWNER (digal.sn/admin)

### 4.1 Accès & Sécurité
- URL dédiée : digal.sn/admin
- Authentification : Email + mot de passe + 2FA obligatoire
- Complètement séparé de l'app utilisateur
- L'Owner ne touche pas aux données clients des utilisateurs

### 4.2 Navigation
Menu latéral fixe + Dashboard principal avec widgets cliquables vers pages détaillées :
```
├── Tableau de bord (KPIs globaux)
├── Utilisateurs
│   ├── Liste d'attente
│   ├── Comptes
│   └── Licences
├── Emails marketing
├── Facturation & Comptabilité Owner
├── Guides plateforme
│   ├── Guide Solo
│   └── Guide Agence
├── Documentation technique
└── Sécurité & Journal global
```

### 4.3 Tableau de bord KPIs
Widgets visibles en un coup d'œil :
- MRR (revenu mensuel récurrent)
- Nombre de comptes actifs (Solo séparé / Agence séparé)
- Nombre de licences vendues ce mois
- Licences expirant dans les 30 prochains jours
- Nombre total de clients gérés sur toute la plateforme
- Comptes freemium vs comptes licenciés
- Taux de conversion freemium → licence

### 4.4 Gestion des utilisateurs
**Liste des comptes :**
- Filtres : type (Solo/Agence), statut (Freemium/Actif/Expiré/Suspendu)
- Tableau comparé classable par CA, activité, nb clients
- Export CSV de tous les comptes avec leurs KPIs

**Fiche compte (Vue détaillée au clic) :**
- Onglet Profil : nom, email, type, licence, date création, nb clients gérés
- Onglet Activité : journal d'activité du compte, nb posts créés, nb liens générés
- Onglet Financier (lecture seule) : CA facturé, CA encaissé, dépenses saisies, masse salariale

**Actions disponibles :**
- Suspendre / Réactiver un compte
- Réinitialiser le mot de passe
- Envoyer un message direct (envoyé par email à l'utilisateur)
- Approuver une demande d'upgrade équipe (1 clic)
- Activer un nouveau quota membres (1 clic)

*Note légale : les CGU doivent mentionner explicitement que l'Owner a accès en lecture aux données financières des comptes.*

### 4.5 Gestion des licences
- Générer une clé de licence (type : Solo / Agence Standard / Agence Pro + durée : 6 mois par défaut)
- Voir toutes les licences générées (utilisées ou disponibles)
- Voir quelle clé est assignée à quel compte
- Désactiver une clé (litige ou erreur)
- Prolonger manuellement une licence sans générer une nouvelle clé
- Historique complet des activations par compte
- Générer une clé promotionnelle avec réduction (ex : -30% lancement)

**Format des clés :** DIGAL-[TYPE]-[6 caractères alphanumériques] ex: DIGAL-SOLO-A3X9KL

### 4.6 Emails marketing
**Templates prédéfinis (éditables) :**
- Bienvenue (envoi automatique à l'approbation)
- Rappel expiration licence (automatique 30j, 15j, 7j avant)
- Promotion / offre spéciale
- Nouveauté / mise à jour fonctionnalité
- Relance freemium inactif (+30 jours sans activité)
- Mail libre (objet + contenu entièrement personnalisés)

**Variables dynamiques disponibles :** {{prénom}}, {{nom}}, {{nom_entreprise}}, {{type_compte}}, {{date_expiration}}, {{nb_clients}}

**Segmentation :** Tous les utilisateurs, Freemium uniquement, Licenciés uniquement, Licences expirant bientôt, Solo uniquement, Agences uniquement, Inactifs +30 jours

**Workflow d'envoi :** Rédaction → Sélection segment → Prévisualisation (rendu exact) → Planification (date + heure) → Envoi automatique. Annulation ou modification possible jusqu'à l'envoi.

### 4.7 Facturation & Comptabilité Owner
- Génération des factures de licence pour chaque utilisateur
- Suivi des paiements reçus (Wave, Orange Money, virement, cash)
- CA mensuel Digal (revenus licences)
- Historique complet des ventes

### 4.8 Guides plateforme
- Guide Solo : tutoriel complet fonctionnalités Solo, accessible aussi depuis l'app utilisateur
- Guide Agence : tutoriel complet par rôle (DM, CM, Créateur), accessible aussi depuis l'app

### 4.9 Documentation technique
- Architecture de la plateforme
- Endpoints API (pour futures intégrations)
- Structure base de données
- Notes de version (changelog)
- Documentation publique accessible sur digal.sn/docs

### 4.10 Sécurité & Journal global
- Journal de toutes les actions sur toute la plateforme
- Filtres : par utilisateur, par date, par type d'action
- Export CSV
- Tentatives de connexion échouées
- Alertes automatiques si comportement suspect (ex: 10 tentatives de connexion en 5 minutes)
- Countdown de lancement : paramétrage de la date depuis cette section

---

## 5. AUTHENTIFICATION & LICENCES

### 5.1 Inscription
1. Choix du type de compte : Solo ou Agence
2. Formulaire : Prénom, Nom, Email, Mot de passe, Nom de l'entreprise/agence
3. Confirmation email obligatoire avant accès
4. Accès immédiat en mode Freemium après confirmation

### 5.2 Connexion
- Email + mot de passe
- Option "Se souvenir de moi"
- Réinitialisation mot de passe par email

### 5.3 Activation d'une licence
- Déclenchement : tentative de dépasser la limite freemium → pop-up automatique
- Ou depuis Paramètres → Ma licence → "Activer une licence"
- Saisie de la clé de licence dans un champ dédié
- Validation instantanée → accès étendu immédiat
- Facture générée automatiquement

### 5.4 Extension de licence
- Depuis Paramètres → Ma licence → "Ajouter une licence"
- Nouvelle clé collée → durée ajoutée à la date d'expiration actuelle (cumul)
- Ex : 2 mois restants + nouvelle licence 6 mois = 8 mois

### 5.5 Expiration de licence
- Notifications in-app + email : J-30, J-15, J-7
- À expiration : retour automatique en mode Freemium (données conservées, accès restreint)
- Pop-up d'expiration à chaque connexion avec bouton "Renouveler"

### 5.6 PWA (Progressive Web App)
- Installable sur iOS et Android (icône sur l'écran d'accueil)
- Installable sur desktop (Windows, Mac)
- Notifications push natives (pas seulement in-app)
- Mode offline partiel : lecture du calendrier sans connexion
- Mise à jour automatique en arrière-plan

---

## 6. ONBOARDING IMMERSIF GAMIFIÉ

### 6.1 Principe
À la première connexion, l'utilisateur est guidé par une checklist de 5 étapes avec progression visuelle. Chaque étape complétée débloque la suivante et affiche un badge de validation. Toutes les étapes complétées = accès complet à toutes les fonctionnalités + message de félicitations.

### 6.2 Les 5 étapes

| Étape | Action | Récompense |
|---|---|---|
| 1 | Configure ton profil (logo, bannière, couleurs de marque) | Badge "Identité créée" |
| 2 | Ajoute ton premier client | Badge "Premier client" |
| 3 | Crée ton premier post sur le calendrier | Badge "Calendrier lancé" |
| 4 | Génère ton premier lien de prévisualisation | Badge "Prêt pour le client" |
| 5 | Découvre la facturation (crée ton premier devis) | Badge "Pro complet" 🎉 |

### 6.3 Interface
- Barre de progression en haut de l'app (0% → 100%)
- Checklist flottante rétractable (ne bloque pas l'interface)
- Chaque étape : icône + titre + description courte + bouton d'action direct
- Skip possible pour chaque étape (revenir plus tard)
- Progression sauvegardée automatiquement

### 6.4 Guides contextuels
- Tooltips au survol des fonctionnalités principales (première visite uniquement)
- Bouton "?" permanent dans le header → ouvre le guide correspondant au type de compte

---

## 7. RÔLES & PERMISSIONS

### 7.1 CM Solo
Le CM Solo est son propre DM, CM et Créateur. Il a accès à toutes les fonctionnalités de la plateforme sans restriction de rôle. Il génère ses rapports lui-même.

### 7.2 Rôles en Agence

| Fonctionnalité | Digital Manager | Community Manager | Créateur de contenu |
|---|---|---|---|
| Voir tous les clients | ✅ | ❌ (ses clients uniquement) | ❌ |
| Ajouter/modifier des clients | ✅ | ✅ | ❌ |
| Calendrier éditorial | ✅ (tous clients) | ✅ (ses clients) | ❌ |
| Créer des posts | ✅ | ✅ | ❌ |
| Créer périodes de production | ✅ | ✅ | ❌ |
| Assigner tâches au créateur | ✅ | ✅ | ❌ |
| Vue "Mes missions" | ❌ | ❌ | ✅ |
| Boîte de dépôt | ✅ | ✅ | ✅ (upload uniquement) |
| Valider/rejeter fichiers | ✅ | ✅ | ❌ |
| Générer lien de prévisualisation | ✅ | ✅ | ❌ |
| Générer rapports KPI PDF | ✅ | ❌ | ❌ |
| Facturation | ✅ | ❌ | ❌ |
| Comptabilité | ✅ | ❌ | ❌ |
| Journal d'activité | ✅ | ❌ | ❌ |
| Gestion équipe | ✅ | ❌ | ❌ |
| Paramètres agence | ✅ | ❌ | ❌ |

### 7.3 Vue Créateur de contenu
Interface simplifiée "Mes missions" :
- Liste des tâches assignées (client, type de contenu, deadline, réseau)
- Statut de chaque tâche : En attente / Uploadé / Validé / Rejeté
- Boîte de dépôt libre
- Commentaires du CM/DM sur les fichiers rejetés
- Barre de progression upload + compression visible
- Pas d'accès au calendrier complet, aux clients, à la facturation

---

## 8. MENU CLIENTS

### 8.1 Accès
- Accessible depuis la sidebar pour tous les rôles
- DM : voit tous les clients de l'agence
- CM : voit uniquement ses clients assignés
- Créateur : pas d'accès au menu Clients

### 8.2 Liste des clients
Chaque client affiché en carte avec :
- Logo du client
- Réseaux actifs (icônes)
- Nombre de posts ce mois
- Statut du dernier lien de validation (En attente / Validé / Expiré)
- Prochaine publication programmée
- Badge "Archivé" si client archivé

Bouton "Ajouter un client" (Solo + DM + CM).

### 8.3 Ajout d'un client — deux modes

**Mode rapide (facturation uniquement) :**
- Nom du client + Email uniquement
- Disponible directement depuis le module Facturation
- Pas de fiche complète, pas de calendrier

**Mode complet :**
1. CM/DM crée la fiche partielle (nom, logo, réseaux actifs, couleurs de marque)
2. Génération d'un lien d'onboarding brandé (bannière de couverture CM/agence visible)
3. Envoi du lien au client
4. Client remplit ses informations (nom entreprise, description, contacts)
5. CM/DM complète et finalise la fiche
6. Évolutif : le client peut demander l'ajout d'un nouveau réseau après l'onboarding initial

### 8.4 Fiche client complète
- Logo + bannière de couverture
- Nom, secteur d'activité, description
- Réseaux actifs sélectionnés (parmi Instagram, Facebook, LinkedIn, X, TikTok)
- Couleurs de marque (palette)
- Contacts (nom, email, téléphone du référent client)
- CM assigné (en agence)
- Historique de validation (tous les liens générés avec statuts et horodatages)
- Factures liées

### 8.5 Archivage
- Pas de suppression de client — uniquement archivage
- Client archivé : invisible dans la liste active, données conservées en lecture seule
- Factures impayées d'un client archivé : restent visibles dans la comptabilité avec badge "Client archivé" en rouge
- Possibilité de marquer une facture comme "Irrécouvrable" pour la sortir de la vue active
- Réactivation possible à tout moment (réintègre le quota actif)

---

## 9. CALENDRIER ÉDITORIAL

### 9.1 Accès et personnalisation
- Un calendrier par client
- Double logo en en-tête : logo client + logo agence (ou CM solo)
- Couleurs de marque du client appliquées
- Vue semaine ou vue mois (basculement libre par le CM/DM)
- Filtres par réseau social (Instagram / Facebook / LinkedIn / X / TikTok)

### 9.2 Types d'entrées

**Entrée Post :**
- Réseau social cible
- Texte / légende
- Fichier(s) média (image, vidéo, PDF)
- Date et heure de publication
- Statut (voir 9.3)
- Hashtags
- Note interne (non visible par le client)

**Entrée Période de production :**
- Bloc coloré sur plusieurs jours (comme Google Calendar)
- Types avec code couleur :
  - 🔵 Shooting photo/vidéo
  - 🟠 Montage / post-production
  - 🟢 Livraison de contenu
  - 🟣 Personnalisé (nom libre)
- Créateur assigné (optionnel)
- Description de la mission

### 9.3 Cycle de vie d'un post (statuts)
```
Brouillon
    ↓ (CM soumet pour validation client)
En attente de validation
    ↓ (lien de prévisualisation généré et envoyé)
Lien envoyé
    ↓ (client approuve)
Programmé validé ←──── (CM corrige après refus)
    ↓                        ↑
Rappel J-1            Brouillon (refus client)
    ↓
Publié (CM marque manuellement)
    ↓
Archivé (fichier supprimé J+1, métadonnées conservées)
```

### 9.4 Marquer un post comme publié
Deux points d'accès :
1. Depuis le calendrier : clic sur le post → bouton "Marquer comme publié"
2. Depuis le tableau de bord : section "À publier aujourd'hui" → bouton "Marquer comme publié" par post

### 9.5 Formats et validation par réseau

| Réseau | Formats acceptés | Spécificité |
|---|---|---|
| Instagram | JPG, PNG, MP4 | Carré, portrait, paysage, story verticale |
| Facebook | JPG, PNG, MP4 | Standard |
| LinkedIn | JPG, PNG, MP4, PDF | Carrousel PDF accepté |
| X / Twitter | JPG, PNG, MP4 | Standard |
| TikTok | MP4 uniquement | 9:16 obligatoire — avertissement si ratio incorrect |

### 9.6 Limites fichiers et compression

| Format | Limite upload | Après compression | Compression |
|---|---|---|---|
| JPG / PNG | 10 MB | 2 MB max | Automatique |
| MP4 | 500 MB | 50 MB max | Automatique |
| PDF | 50 MB | 10 MB max | Automatique |

- Barre de progression visible pendant la compression
- Alerte si vidéo TikTok dépasse 3 minutes
- Alerte si ratio vidéo TikTok n'est pas 9:16 (avertissement, pas de blocage)
- Maximum 10 fichiers par post (carrousel)

---

## 10. WORKFLOW CRÉATEUR DE CONTENU

### 10.1 Mode 1 — Tâche assignée (urgences et briefs précis)
1. CM/DM crée un post dans le calendrier
2. CM/DM assigne une tâche au créateur sur ce post (deadline + instructions)
3. Créateur reçoit une notification in-app + push
4. Créateur uploade le fichier directement sur le post assigné
5. Barre de progression de compression visible
6. CM/DM reçoit notification "Fichier uploadé"
7. CM/DM valide ✅ ou rejette ❌ avec commentaire obligatoire
8. Si rejeté : fichier supprimé immédiatement + créateur notifié avec commentaire
9. Si validé : fichier lié au post, prêt à l'emploi

### 10.2 Mode 2 — Boîte de dépôt (livraisons libres)
1. Créateur uploade dans la boîte de dépôt générale (par client)
2. CM/DM reçoit notification "Nouveau fichier en attente"
3. CM/DM valide ✅ ou rejette ❌ avec commentaire obligatoire
4. Si validé : fichier disponible dans la médiathèque du client, le CM le lie à un post
5. Si rejeté : fichier supprimé immédiatement

### 10.3 Règle de stockage éphémère des fichiers rejetés
Un fichier rejeté est supprimé immédiatement et définitivement. Aucune récupération possible. Le commentaire de rejet est conservé dans le journal.

---

## 11. LIEN DE PRÉVISUALISATION CLIENT

### 11.1 Génération du lien
- Accessible depuis le calendrier du client
- CM ou DM génère le lien
- Sélection de la période : semaine précise (ex: 7 au 14 avril) ou mois entier
- Le DM peut configurer si la période par défaut est semaine ou mois (dans les paramètres agence)
- Seuls les posts en statut "En attente de validation" sont inclus
- Le CM peut sélectionner manuellement les posts à inclure ou exclure

### 11.2 Format du lien
```
digal.sn/preview/[slug-client]/[période]
Exemples :
digal.sn/preview/orange-senegal/semaine-07-14-avril-2026
digal.sn/preview/wave-dakar/avril-2026
```
- Slug client : généré automatiquement depuis le nom du client, modifiable par le DM
- Période : générée automatiquement à la création du lien
- Durée de validité : 48 heures

### 11.3 Page de prévisualisation (vue client)
**En-tête :**
- Bannière de couverture de l'agence/CM solo
- Logo agence + logo client
- Message d'accueil personnalisable par le CM
- Nom du client + période concernée
- Countdown "Ce lien expire dans X heures"

**Navigation :**
- Onglets réseaux en haut : Instagram | Facebook | LinkedIn | X | TikTok (uniquement les réseaux actifs du client)
- Sur mobile : onglets scrollables horizontalement

**Prévisualisation :**
- Chaque réseau affiche une réplique exacte de son interface native :
  - Instagram : fond blanc, avatar, nom, image/vidéo, boutons like/commentaire/partage
  - Facebook : interface fil d'actualité fidèle
  - LinkedIn : interface post professionnel fidèle
  - X / Twitter : interface tweet fidèle
  - TikTok : aperçu vertical plein écran fidèle
- Chaque post affiche : visuel + texte + hashtags

**Actions du client par post :**
- Modifier le texte directement (inline editing)
- Laisser un commentaire
- Bouton "Approuver" ✅
- Bouton "Refuser" ❌ (commentaire obligatoire avant de refuser)
- Bouton "Terminer" en bas de page (soumet toutes les décisions)

### 11.4 Après la décision du client

**Si tous les posts sont approuvés :**
- CM reçoit notification in-app + push
- Posts passent en statut "Programmé validé"
- CM clique "Programmer validé" pour confirmer

**Si certains posts sont refusés :**
- CM reçoit notification in-app + push avec les commentaires
- Posts refusés repassent en statut "Brouillon"
- CM corrige et génère un nouveau lien de prévisualisation

### 11.5 Historique des versions
- Chaque version d'un post (correction après refus) est conservée
- Horodatage de chaque décision (approuvé/refusé + commentaire + date/heure)
- Protection juridique : preuve que le client a approuvé le contenu

### 11.6 Expiration du lien
- Après 48 heures : page inaccessible avec message "Ce lien a expiré"
- CM reçoit notification si le lien expire sans réponse du client
- Un nouveau lien doit être généré

### 11.7 Freemium
- Lien de prévisualisation disponible en freemium
- Filigrane "Créé avec Digal" en bas de page cliquable → renvoie vers digal.sn

---

## 12. RAPPORTS KPI MENSUELS PDF

### 12.1 Qui peut générer
- CM Solo : génère ses propres rapports
- Digital Manager (agence) : génère les rapports de tous les clients
- CM en agence : ne peut pas générer de rapport

### 12.2 Périodes disponibles
- Mensuel (par défaut)
- Trimestriel
- Personnalisé (date de début + date de fin libres)

### 12.3 Saisie des KPIs
Saisie manuelle par le DM/CM Solo après la fin de la période. KPIs disponibles par réseau :

**Instagram :** Abonnés, Likes, Commentaires, Partages, Impressions, Portée, Vues stories/reels

**Facebook :** Abonnés, Likes, Commentaires, Partages, Portée, Impressions, Clics

**LinkedIn :** Abonnés, Impressions, Clics, Réactions, Commentaires, Partages

**X / Twitter :** Abonnés, Impressions, Likes, Retweets, Réponses, Clics

**TikTok :** Abonnés, Vues, Likes, Commentaires, Partages, Favoris, Portée

**Règle absolue :** Un champ KPI vide = invisible dans le rapport PDF. Seuls les KPIs renseignés apparaissent. Un réseau entier vide = le réseau n'apparaît pas dans le rapport.

### 12.4 Contenu du rapport PDF
- En-tête : logo client + logo agence/CM + période
- Nombre total de posts publiés ce mois (par réseau)
- KPIs par réseau (uniquement ceux renseignés)
- Pied de page : coordonnées agence/CM
- Téléchargeable et partageable directement

---

## 13. FACTURATION

### 13.1 Structure
Deux sous-menus distincts :
- **Devis** : liste des devis, création, statuts
- **Factures** : liste des factures, statuts, paiements

### 13.2 Accès
- DM uniquement en agence
- CM Solo : accès complet

### 13.3 Personnalisation de l'en-tête et pied de page
Configuré une fois dans les Paramètres, appliqué à tous les devis et factures :
- Logo de l'agence/CM
- Nom, adresse, téléphone, email
- Numéro NINEA / RC (optionnel)
- Bannière ou couleur de fond de l'en-tête
- Couleur principale (appliquée aux titres et bordures)
- Tampon (upload image PNG transparent)
- Signature (upload image PNG transparent)
- Pied de page personnalisé (texte libre)

### 13.4 Numérotation automatique
Format configurable dans les Paramètres :
- **Devis :** DEV-[SIGLE]-[ANNÉE]-[0001]
- **Facture :** FAC-[SIGLE]-[ANNÉE]-[0001]
- Exemple : DEV-LCS-2026-0001
- Le sigle est saisi librement par le DM/CM Solo
- Remise à zéro automatique au 1er janvier de chaque année
- Incrément automatique à chaque nouveau document

### 13.5 Création d'un devis
- Sélection du client (depuis la base clients existante ou création rapide : nom + email)
- Lignes de prestation : description + quantité + prix unitaire
- Ligne budget boost (optionnelle) : réseau + montant (pré-rempli depuis la comptabilité si boost affecté)
- Remise (% ou montant fixe, optionnel)
- BRS 5% (activé par défaut, désactivable)
- TVA 18% (désactivée par défaut, activable)
- Conditions de paiement (texte libre)
- Méthodes de paiement acceptées (Wave, YAS, Orange Money, Virement, Cash — préconfigurées dans les paramètres)
- Tampon et signature appliqués automatiquement

### 13.6 Validation d'un devis
- Bouton "Valider le devis" → le devis se transforme automatiquement en facture
- Le numéro de devis est conservé dans la facture (référence)
- Statut devis : Brouillon / Envoyé / Validé / Refusé

### 13.7 Facturation
- Tous les champs du devis + champ "Référence commande" optionnel
- Statut facture : En attente / Payée / Partiellement payée / En retard / Irrécouvrable
- Bouton "Marquer comme payée" → sélection méthode de paiement + référence de transaction
- Méthodes : Wave (+ ref), YAS (+ ref), Orange Money (+ ref), Virement (+ ref), Cash

### 13.8 Téléchargement PDF
- Devis et factures téléchargeables en PDF à tout moment
- Mise en page professionnelle avec tous les éléments personnalisés
- Tampon et signature intégrés

---

## 14. COMPTABILITÉ

### 14.1 Accès
- DM uniquement en agence
- CM Solo : accès complet

### 14.2 Structure (3 sous-sections)

**A. Masse salariale**
- Liste des membres de l'équipe avec leur salaire mensuel défini
- Pour chaque mois : statut Payé ✅ / Non payé ❌ par membre
- Historique des paiements salariaux

**B. Dépenses fixes**
Catégories prédéfinies + catégorie libre :
- Loyer bureau
- Abonnements logiciels (Canva, Adobe, etc.)
- Fournitures / matériel
- Publicité / Boost réseaux sociaux ← avec affectation client obligatoire
- Autres (catégorie libre à nommer)

**Dépenses Boost :**
- Lors de la saisie d'une dépense Boost : sélection du réseau (Facebook Ads, Instagram Ads, LinkedIn Ads, TikTok Ads, X Ads) + montant + client affecté
- Cette dépense apparaît automatiquement comme ligne facturable optionnelle sur la prochaine facture du client concerné
- Le DM choisit de l'inclure ou non dans la facture

**C. Tableau de bord financier mensuel**
- Revenus : total factures émises / total encaissé
- Charges : masse salariale + dépenses fixes du mois
- Résultat : Revenus - Charges
- Graphique visuel mensuel
- Comparaison mois précédent

---

## 15. JOURNAL D'ACTIVITÉ & NOTIFICATIONS

### 15.1 Journal d'activité (DM + CM Solo uniquement)
Actions tracées :
- Connexions et déconnexions (utilisateur + horodatage)
- Création / modification / suppression de posts
- Upload et validation/rejet de fichiers
- Génération de liens de prévisualisation
- Décisions du client (approbation/refus + commentaires)
- Actions sur les factures et devis
- Modifications des paramètres

Filtres disponibles : par membre de l'équipe, par date, par type d'action.

### 15.2 Notifications in-app
**Interface :** Cloche dans le header avec badge numérique + panneau latéral au clic listant les notifications avec horodatage. Notifications lues supprimées après 30 jours.

**Déclencheurs par rôle :**

| Événement | DM | CM | Créateur |
|---|---|---|---|
| Client valide le lien de prévisualisation | ✅ | ✅ | ❌ |
| Client refuse le lien de prévisualisation | ✅ | ✅ | ❌ |
| Créateur uploade un fichier | ✅ | ✅ | ❌ |
| Tâche assignée au créateur | ❌ | ❌ | ✅ |
| Fichier validé par CM/DM | ❌ | ❌ | ✅ |
| Fichier rejeté par CM/DM (avec commentaire) | ❌ | ❌ | ✅ |
| Lien de validation expiré sans réponse | ✅ | ✅ | ❌ |
| Membre non payé en fin de mois | ✅ | ❌ | ❌ |
| Rappel publication J-1 | ✅ | ✅ | ❌ |
| Demande upgrade équipe approuvée | ✅ | ❌ | ❌ |

### 15.3 Notifications email
- Expiration licence : J-30, J-15, J-7 (automatique)
- Email de bienvenue à l'approbation de la liste d'attente (automatique)
- Messages directs de l'Owner (email uniquement)
- Emails marketing planifiés par l'Owner

---

## 16. PARAMÈTRES

### 16.1 Profil & Identité
- Nom, prénom, email, mot de passe
- Photo de profil
- Nom de l'agence / marque personnelle
- Logo (upload)
- Bannière de couverture (upload image — visible sur le lien d'onboarding client et le lien de prévisualisation)
- Couleurs de marque

### 16.2 Facturation & Comptabilité
- En-tête et pied de page des documents
- Tampon (upload PNG transparent)
- Signature (upload PNG transparent)
- Numérotation : sigle personnalisé pour DEV et FAC
- BRS 5% : activé par défaut (désactivable)
- TVA 18% : désactivée par défaut (activable)
- Méthodes de paiement préconfigurées (Wave, YAS, Orange Money, Virement, Cash — activer/désactiver)
- Devise : FCFA (fixe, non modifiable en MVP)

### 16.3 Équipe (Agence uniquement)
- Inviter un membre (email + rôle : CM ou Créateur)
- Voir les membres actifs et leur rôle
- Modifier le rôle d'un membre
- Retirer un membre
- Définir le salaire de chaque membre (visible uniquement par le DM)
- Demande d'upgrade membres (formulaire → envoi à l'Owner)

### 16.4 Clients
- Configuration de la période par défaut pour les liens de prévisualisation (semaine ou mois) — DM uniquement

### 16.5 Modèles de posts
- Créer un modèle (titre + texte + réseau + format)
- Modèles globaux (DM crée, disponibles pour toute l'agence)
- Modèles spécifiques client (CM crée, disponibles pour ce client uniquement)
- CM Solo : les deux niveaux disponibles
- Freemium : limité à 3 modèles au total

### 16.6 Ma licence & Factures Digal
- Type de compte actuel
- Date d'expiration de la licence
- Historique des licences activées
- Téléchargement des factures Digal (PDF)
- Bouton "Ajouter une licence" (extension)
- Bouton "Passer en mode Agence" (Solo uniquement) → demande envoyée à l'Owner

### 16.7 Notifications
- Activer/désactiver chaque type de notification in-app
- Activer/désactiver les notifications push (PWA)

---

## 17. ARCHITECTURE TECHNIQUE RECOMMANDÉE

### 17.0 Design & Icônes
- **Bibliothèque d'icônes** : Lucide Icons exclusivement (SVG, open source, style moderne et uniforme)
- Aucune icône emoji, aucune icône bitmap, aucun mélange de styles visuels
- Toutes les icônes en SVG via le package `lucide-react`

### 17.1 Stack recommandée
- **Frontend** : Next.js 14+ (App Router) + Tailwind CSS
- **Backend** : Supabase (PostgreSQL + Auth + Storage + Realtime)
- **PWA** : next-pwa ou configuration manuelle Service Worker
- **PDF** : React-PDF ou Puppeteer pour la génération des documents
- **Email** : Resend ou Brevo (anciennement Sendinblue) pour les emails transactionnels et marketing
- **Compression vidéo** : FFmpeg (côté serveur via API route)
- **Compression image** : Sharp (Node.js)
- **Hébergement** : Vercel (frontend) + Supabase (backend)

### 17.2 Structure des URLs
```
digal.sn/                          → Landing page
digal.sn/waitlist                  → Liste d'attente
digal.sn/login                     → Connexion
digal.sn/register                  → Inscription
digal.sn/dashboard                 → Tableau de bord app
digal.sn/clients                   → Menu clients
digal.sn/clients/[id]              → Fiche client
digal.sn/clients/[id]/calendrier   → Calendrier éditorial
digal.sn/facturation               → Module facturation
digal.sn/comptabilite              → Module comptabilité
digal.sn/journal                   → Journal d'activité
digal.sn/parametres                → Paramètres
digal.sn/preview/[slug]/[periode]  → Lien prévisualisation client
digal.sn/admin                     → Dashboard Owner (2FA)
digal.sn/docs                      → Documentation publique
```

### 17.3 Logique de stockage éphémère
- Fichiers médias uploadés : stockés dans Supabase Storage
- Fichier rejeté : suppression immédiate via webhook
- Post publié : fichier supprimé automatiquement J+1 via cron job (minuit)
- Lien de prévisualisation : désactivé automatiquement après 48h via cron job
- Métadonnées (texte, dates, statuts) : conservées indéfiniment dans la base de données
- Factures et devis PDF : conservés 5 ans (obligation légale)

### 17.4 Sécurité
- Authentification JWT via Supabase Auth
- Row Level Security (RLS) sur toutes les tables (isolation des données par compte)
- 2FA Owner via TOTP (Google Authenticator compatible)
- Rate limiting sur les endpoints sensibles
- Logs de sécurité centralisés

### 17.5 Performance PWA
- Service Worker pour cache des assets statiques
- Lecture offline du calendrier (données mises en cache)
- Notifications push via Web Push API
- Mise à jour automatique en arrière-plan (background sync)

### 17.6 Versioning de l'application
Convention **Semantic Versioning (SemVer)** : `MAJOR.MINOR.PATCH`

| Type | Exemple | Quand |
|---|---|---|
| PATCH | v1.0.1 | Correction de bug |
| MINOR | v1.1.0 | Nouvelle fonctionnalité mineure |
| MAJOR | v2.0.0 | Refonte ou changement majeur |

**Lancement MVP :** v1.0.0

**Changelog :**
- Section dans le Dashboard Owner : l'Owner documente chaque version
- Page publique `digal.sn/changelog` : visible par tous les utilisateurs
- Notification in-app à chaque nouvelle version (MINOR et MAJOR uniquement)

---

## ANNEXE — RÉCAPITULATIF DES RÈGLES MÉTIER CLÉS

1. Un client archivé ne peut pas être supprimé — les données sont conservées indéfiniment
2. Un fichier rejeté est supprimé immédiatement et définitivement
3. Un fichier média de post publié est supprimé automatiquement J+1
4. Un lien de prévisualisation expire après 48 heures exactement
5. Un KPI vide dans le rapport = invisible dans le PDF
6. Un compte freemium ne peut avoir qu'1 utilisateur et 2 clients actifs max
7. Une agence standard = 1 DM + 3 membres max (CM + Créateurs)
8. L'extension de licence est cumulative (s'ajoute à la date d'expiration actuelle)
9. La numérotation des devis/factures se remet à zéro au 1er janvier
10. Le BRS 5% est activé par défaut, la TVA 18% est désactivée par défaut
11. Toutes les transactions sont en FCFA uniquement
12. Le CM en agence ne peut pas générer de rapport KPI PDF
13. Le créateur de contenu ne voit jamais le calendrier complet
14. Chaque compte (même freemium) reçoit une facture Digal (0 FCFA si offert)
15. La suppression de compte = gel 30 jours → suppression définitive des fichiers, conservation des factures 5 ans

---

*Document préparé pour le développement de Digal avec Claude Code*  
*Tous droits réservés — Digal 2026*
