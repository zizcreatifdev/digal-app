import { ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { usePageTitle } from "@/hooks/usePageTitle";

const CompteSuspendu = () => {
  usePageTitle("Digal · Compte suspendu");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <img
          src="/logos/Logo%20Digal_iconorange_ettext_ennoir.svg.svg"
          alt="Digal"
          className="w-32 mx-auto"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldOff className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold font-serif">Compte suspendu</h1>
          <p className="text-muted-foreground font-sans leading-relaxed">
            Votre compte a été suspendu.<br />
            Pour plus d'informations, contactez l'administrateur.
          </p>
          <p className="text-sm text-muted-foreground font-sans">
            Pour toute demande de réactivation, contactez-nous à :{" "}
            <a
              href="mailto:contact@digal.sn"
              className="font-semibold hover:underline"
              style={{ color: "#E8511A" }}
            >
              contact@digal.sn
            </a>
          </p>
        </div>
        <Link to="/">
          <Button variant="outline" className="mt-2">Retour à l'accueil</Button>
        </Link>
      </div>
    </div>
  );
};

export default CompteSuspendu;
