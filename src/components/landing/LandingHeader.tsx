import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <div className="flex items-center">
          <img
            src="/logos/Logo%20Digal_iconorange_ettext_ennoir.svg.svg"
            alt="Digal"
            className="h-11 w-auto"
          />
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#fonctionnalites" className="text-sm font-sans text-muted-foreground hover:text-foreground transition-colors">
            Fonctionnalités
          </a>
          <a href="#tarifs" className="text-sm font-sans text-muted-foreground hover:text-foreground transition-colors">
            Tarifs
          </a>
          <a href="#contact" className="text-sm font-sans text-muted-foreground hover:text-foreground transition-colors">
            Contact
          </a>
        </nav>

        <div className="hidden md:block">
          <Button size="sm" asChild><Link to="/waitlist">Rejoindre la liste</Link></Button>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-md">
          <nav className="flex flex-col p-4 gap-3">
            <a href="#fonctionnalites" className="text-sm font-sans text-muted-foreground hover:text-foreground" onClick={() => setMenuOpen(false)}>
              Fonctionnalités
            </a>
            <a href="#tarifs" className="text-sm font-sans text-muted-foreground hover:text-foreground" onClick={() => setMenuOpen(false)}>
              Tarifs
            </a>
            <a href="#contact" className="text-sm font-sans text-muted-foreground hover:text-foreground" onClick={() => setMenuOpen(false)}>
              Contact
            </a>
            <Button size="sm" className="mt-2 w-full" asChild><Link to="/waitlist">Rejoindre la liste</Link></Button>
          </nav>
        </div>
      )}
    </header>
  );
}
