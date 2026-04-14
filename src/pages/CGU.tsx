import { Link } from "react-router-dom";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { ArrowLeft } from "lucide-react";

const LAST_UPDATE = "Mars 2026";
const COMPANY = "Digal";
const EMAIL = "contact@digal.sn";

export default function CGU() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <LandingHeader />
      <main className="flex-1 container mx-auto px-4 max-w-3xl py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground font-sans mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Retour à l'accueil
        </Link>

        <h1 className="text-3xl font-bold font-serif mb-2">Conditions Générales d'Utilisation</h1>
        <p className="text-sm text-muted-foreground font-sans mb-10">Dernière mise à jour : {LAST_UPDATE}</p>

        <div className="prose prose-sm max-w-none space-y-8 font-sans text-foreground">

          <section>
            <h2 className="text-xl font-bold font-serif mb-3">1. Objet</h2>
            <p className="text-muted-foreground leading-relaxed">
              Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la plateforme <strong>{COMPANY}</strong>, outil SaaS de gestion éditoriale destiné aux Community Managers et agences de communication digitale. En accédant à la plateforme, vous acceptez sans réserve les présentes CGU.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold font-serif mb-3">2. Description du service</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              {COMPANY} est une plateforme de gestion éditoriale qui permet notamment de :
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
              <li>Planifier et organiser des calendriers éditoriaux par client</li>
              <li>Générer des liens de prévisualisation pour validation client</li>
              <li>Établir des devis et factures en FCFA</li>
              <li>Suivre la comptabilité et les dépenses</li>
              <li>Générer des rapports KPI mensuels</li>
              <li>Gérer une équipe de collaborateurs (CM, créateurs)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold font-serif mb-3">3. Comptes et licences</h2>
            <h3 className="font-semibold mb-2">3.1 Inscription</h3>
            <p className="text-muted-foreground leading-relaxed">
              L'inscription est ouverte aux professionnels (Community Managers, agences de communication). Vous devez fournir des informations exactes et maintenir leur exactitude. Un compte par personne physique ou morale.
            </p>
            <h3 className="font-semibold mb-2 mt-4">3.2 Compte Freemium</h3>
            <p className="text-muted-foreground leading-relaxed">
              Le compte Freemium est gratuit et soumis aux limitations suivantes : 2 clients actifs maximum, 1 utilisateur, pas d'accès aux modules Facturation, Comptabilité et Rapports KPI, maximum 3 modèles de posts, maximum 3 clients archivés.
            </p>
            <h3 className="font-semibold mb-2 mt-4">3.3 Licences payantes</h3>
            <p className="text-muted-foreground leading-relaxed">
              Les licences sont activées via une clé fournie par {COMPANY} après paiement. La durée standard est de 6 mois. Les licences sont non remboursables sauf erreur de notre part. L'extension d'une licence avant expiration est cumulative.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold font-serif mb-3">4. Obligations de l'utilisateur</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">L'utilisateur s'engage à :</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
              <li>Ne pas partager ses identifiants de connexion</li>
              <li>Ne pas utiliser la plateforme à des fins illégales ou contraires à l'éthique</li>
              <li>Ne pas tenter de contourner les restrictions du compte Freemium</li>
              <li>Ne pas uploader de contenu protégé par des droits d'auteur sans autorisation</li>
              <li>Maintenir la confidentialité des données de ses propres clients</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold font-serif mb-3">5. Données et confidentialité</h2>
            <p className="text-muted-foreground leading-relaxed">
              L'utilisation de la plateforme est soumise à notre <Link to="/privacy" className="text-primary underline">Politique de Confidentialité</Link>. L'utilisateur est informé et accepte que l'administrateur de la plateforme (Owner) dispose d'un accès en <strong>lecture seule</strong> aux données financières agrégées de son compte (CA facturé total, dépenses totales, masse salariale totale), à des fins de gestion et de support de la plateforme.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold font-serif mb-3">6. Propriété intellectuelle</h2>
            <p className="text-muted-foreground leading-relaxed">
              La plateforme {COMPANY}, son interface, son code source et ses marques restent la propriété exclusive de {COMPANY}. Les contenus produits par l'utilisateur (posts, fichiers, factures) restent sa propriété. L'utilisateur accorde à {COMPANY} une licence non exclusive pour héberger et traiter ses données dans le cadre du service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold font-serif mb-3">7. Disponibilité et responsabilité</h2>
            <p className="text-muted-foreground leading-relaxed">
              {COMPANY} s'efforce d'assurer une disponibilité maximale du service (objectif 99%). Des interruptions peuvent survenir pour maintenance. {COMPANY} ne saurait être tenu responsable de pertes de données résultant d'une utilisation non conforme aux CGU, d'une défaillance technique indépendante de sa volonté, ou de la perte d'accès internet de l'utilisateur.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold font-serif mb-3">8. Résiliation</h2>
            <p className="text-muted-foreground leading-relaxed">
              L'utilisateur peut supprimer son compte à tout moment depuis les Paramètres. {COMPANY} se réserve le droit de suspendre ou résilier un compte en cas de violation des CGU, sans préavis. Les données sont conservées 30 jours après suppression du compte avant effacement définitif.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold font-serif mb-3">9. Modifications des CGU</h2>
            <p className="text-muted-foreground leading-relaxed">
              {COMPANY} se réserve le droit de modifier les présentes CGU. Les utilisateurs seront informés par email 30 jours avant l'entrée en vigueur des modifications. La poursuite de l'utilisation du service après ce délai vaut acceptation des nouvelles CGU.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold font-serif mb-3">10. Droit applicable</h2>
            <p className="text-muted-foreground leading-relaxed">
              Les présentes CGU sont régies par le droit sénégalais. En cas de litige, les parties s'engagent à rechercher une solution amiable. À défaut, les tribunaux compétents de Dakar (Sénégal) seront saisis.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold font-serif mb-3">11. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              Pour toute question concernant les présentes CGU :<br />
              Email : <a href={`mailto:${EMAIL}`} className="text-primary underline">{EMAIL}</a><br />
              {COMPANY} — Dakar, Sénégal
            </p>
          </section>

        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
