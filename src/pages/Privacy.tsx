import { Link } from "react-router-dom";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { ArrowLeft } from "lucide-react";

const LAST_UPDATE = "Mars 2026";
const COMPANY = "Digal";
const EMAIL = "contact@digal.sn";
const COUNTRY = "Sénégal";

export default function Privacy() {
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

        <h1 className="text-3xl font-bold font-serif mb-2">Politique de Confidentialité</h1>
        <p className="text-sm text-muted-foreground font-sans mb-10">Dernière mise à jour : {LAST_UPDATE}</p>

        <div className="prose prose-sm max-w-none space-y-8 font-sans text-foreground">

          <section>
            <h2 className="text-xl font-bold font-serif mb-3">1. Responsable du traitement</h2>
            <p className="text-muted-foreground leading-relaxed">
              {COMPANY} est responsable du traitement de vos données personnelles. Pour toute question relative à vos données, contactez-nous à l'adresse : <a href={`mailto:${EMAIL}`} className="text-primary underline">{EMAIL}</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold font-serif mb-3">2. Données collectées</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Nous collectons les données suivantes lorsque vous utilisez {COMPANY} :
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
              <li>Données d'identification : prénom, nom, adresse email</li>
              <li>Données professionnelles : nom de l'agence/entreprise, type de compte</li>
              <li>Données d'utilisation : posts créés, clients gérés, liens de prévisualisation générés</li>
              <li>Données financières : factures, dépenses, informations comptables saisies</li>
              <li>Données de connexion : adresse IP, date et heure de connexion</li>
              <li>Fichiers uploadés : médias, logos, tampons, signatures</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold font-serif mb-3">3. Finalités du traitement</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">Vos données sont utilisées pour :</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
              <li>Fournir et améliorer les services de la plateforme</li>
              <li>Gérer votre compte et votre licence</li>
              <li>Vous envoyer des notifications liées à votre utilisation (expiration de licence, validations clients)</li>
              <li>Établir des statistiques d'usage agrégées et anonymisées</li>
              <li>Respecter nos obligations légales et fiscales</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold font-serif mb-3">4. Base légale du traitement</h2>
            <p className="text-muted-foreground leading-relaxed">
              Le traitement de vos données repose sur l'exécution du contrat (CGU) que vous acceptez à l'inscription, ainsi que sur notre intérêt légitime à améliorer nos services. Pour les communications marketing, nous nous basons sur votre consentement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold font-serif mb-3">5. Accès aux données · Dashboard Owner</h2>
            <p className="text-muted-foreground leading-relaxed">
              Conformément aux Conditions Générales d'Utilisation, l'administrateur de la plateforme (Owner) dispose d'un accès en <strong>lecture seule</strong> aux données financières agrégées des comptes (CA facturé, dépenses totales, masse salariale). Cet accès est nécessaire à la gestion de la plateforme et est clairement mentionné dans les CGU.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold font-serif mb-3">6. Conservation des données</h2>
            <p className="text-muted-foreground leading-relaxed">
              Vos données sont conservées pendant la durée de votre abonnement et 3 ans après la clôture de votre compte, conformément aux obligations légales sénégalaises. Les fichiers médias des posts publiés sont automatiquement supprimés 24 heures après leur publication.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold font-serif mb-3">7. Partage des données</h2>
            <p className="text-muted-foreground leading-relaxed">
              Vos données ne sont jamais vendues à des tiers. Elles peuvent être partagées avec :
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2 mt-3">
              <li><strong>Supabase</strong> : hébergement et base de données (serveurs en Europe)</li>
              <li><strong>Resend</strong> : envoi des emails transactionnels</li>
              <li>Les autorités compétentes en {COUNTRY}, sur demande légale</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold font-serif mb-3">8. Vos droits</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Conformément à la loi sénégalaise sur la protection des données personnelles (Loi n° 2008-12), vous disposez des droits suivants :
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
              <li>Droit d'accès à vos données personnelles</li>
              <li>Droit de rectification des données inexactes</li>
              <li>Droit à l'effacement (droit à l'oubli)</li>
              <li>Droit à la portabilité de vos données</li>
              <li>Droit d'opposition au traitement</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Pour exercer ces droits, contactez-nous à : <a href={`mailto:${EMAIL}`} className="text-primary underline">{EMAIL}</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold font-serif mb-3">9. Sécurité</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données : chiffrement en transit (HTTPS/TLS), authentification à deux facteurs pour les comptes administrateurs, accès restreint aux données sensibles, journalisation des accès.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold font-serif mb-3">10. Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              {COMPANY} utilise uniquement des cookies essentiels au fonctionnement de l'application (session d'authentification). Nous n'utilisons pas de cookies publicitaires ou de traçage tiers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold font-serif mb-3">11. Modifications</h2>
            <p className="text-muted-foreground leading-relaxed">
              Cette politique peut être mise à jour. Vous serez notifié par email en cas de modification substantielle. La date de dernière mise à jour est indiquée en haut de ce document.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold font-serif mb-3">12. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              Pour toute question relative à cette politique ou à vos données personnelles :<br />
              Email : <a href={`mailto:${EMAIL}`} className="text-primary underline">{EMAIL}</a><br />
              {COMPANY} · {COUNTRY}
            </p>
          </section>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
