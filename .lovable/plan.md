

# Digal — SaaS Dashboard Application

## Design System
- **Fond principal** : #F5F0EB (beige chaud)
- **Accent** : #C4522A (orange-brique)
- **Texte** : #1A1A1A, blanc #FFFFFF, fond sombre #1A1A1A
- **Typographie** : titres en serif bold (Playfair Display), corps en sans-serif (Inter)
- **Icônes** : Lucide React exclusivement
- **Style** : moderne, professionnel, éditorial

## Configuration technique
- Mise à jour des variables CSS Tailwind avec la palette Digal
- Ajout des Google Fonts (Playfair Display + Inter)
- Manifest web pour l'installabilité (pas de service worker)
- Supabase prêt à connecter (auth + DB)

## Composants de base réutilisables
1. **Button** — variantes primary (#C4522A), secondary (outline), ghost
2. **Badge** — statuts colorés
3. **Card** — conteneur avec ombre subtile sur fond blanc
4. **Modal** — dialog accessible avec overlay
5. **Input** — champ texte stylé avec label et erreur
6. **Select** — dropdown stylé
7. **Toast/notification** — système de notifications (déjà en place via sonner, restyled)

## Pages initiales
1. **Landing / Login** — page d'authentification avec le branding Digal
2. **Dashboard** — vue d'ensemble avec cartes de stats et navigation latérale
3. **Page 404** — restyled avec le design system

## Structure de navigation
- Sidebar avec icônes Lucide pour la navigation du dashboard
- Header avec logo Digal et menu utilisateur

