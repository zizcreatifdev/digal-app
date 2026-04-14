import { Link } from "react-router-dom";

export function LandingFooter() {
  return (
    <footer className="border-t border-border py-10 bg-card">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center">
            <img
              src="/logos/Logo%20Digal_iconorange_ettext_enblanc.svg"
              alt="Digal"
              className="h-7 w-auto"
              loading="lazy"
            />
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <a href="#fonctionnalites" className="text-xs font-sans text-muted-foreground hover:text-foreground transition-colors">
              Fonctionnalités
            </a>
            <a href="#tarifs" className="text-xs font-sans text-muted-foreground hover:text-foreground transition-colors">
              Tarifs
            </a>
            <Link to="/cgu" className="text-xs font-sans text-muted-foreground hover:text-foreground transition-colors">
              CGU
            </Link>
            <Link to="/privacy" className="text-xs font-sans text-muted-foreground hover:text-foreground transition-colors">
              Confidentialité
            </Link>
            <a href={`mailto:contact@digal.sn`} className="text-xs font-sans text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </a>
          </nav>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground font-sans">
            © {new Date().getFullYear()} Digal. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
