import { X as XIcon, ArrowRight } from "lucide-react";

const problems = [
  "Validations perdues dans WhatsApp",
  "Fichiers éparpillés sur Drive",
  "Calendriers manuels sur Excel",
  "Factures créées sur Word",
  "Aucune traçabilité des approbations",
];

const beforeTools = [
  { name: "WhatsApp", color: "bg-green-500" },
  { name: "Google Drive", color: "bg-yellow-500" },
  { name: "Excel", color: "bg-emerald-600" },
  { name: "Word", color: "bg-blue-600" },
  { name: "Google Cal", color: "bg-red-500" },
];

export function ProblemSection() {
  return (
    <section className="py-20 md:py-28 bg-card" id="probleme">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Fini le chaos des outils éparpillés
          </h2>
          <p className="text-muted-foreground font-sans text-lg max-w-xl mx-auto">
            Les Community Managers jonglent entre trop d'outils. Digal met fin à cette fragmentation.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Problems list */}
          <div className="space-y-4">
            {problems.map((problem) => (
              <div
                key={problem}
                className="flex items-center gap-3 bg-destructive/5 border border-destructive/10 rounded-lg px-4 py-3"
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-destructive/10 shrink-0">
                  <XIcon className="h-3.5 w-3.5 text-destructive" />
                </div>
                <span className="text-sm font-sans font-medium text-foreground">{problem}</span>
              </div>
            ))}
          </div>

          {/* Before → After visual */}
          <div className="space-y-6">
            <div className="bg-background rounded-xl p-6 border border-border">
              <p className="text-xs font-sans uppercase tracking-widest text-muted-foreground mb-4">
                Avant Digal
              </p>
              <div className="grid grid-cols-3 gap-3">
                {beforeTools.map((tool) => (
                  <div
                    key={tool.name}
                    className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2"
                  >
                    <div className={`w-3 h-3 rounded-sm ${tool.color} shrink-0`} />
                    <span className="text-xs font-sans text-muted-foreground truncate">{tool.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="h-6 w-6 text-primary rotate-90" />
            </div>

            <div className="bg-primary/5 rounded-xl p-6 border-2 border-primary/20">
              <p className="text-xs font-sans uppercase tracking-widest text-primary mb-4">
                Avec Digal
              </p>
              <div className="flex items-center justify-center gap-2">
                <img
                  src="/logos/Logo%20Digal_iconorange_ettext_ennoir.svg.svg"
                  alt="Digal"
                  className="h-10 w-auto dark:content-[url('/logos/Logo%20Digal_iconorange_ettext_enblanc.svg')]"
                />
              </div>
              <p className="text-center text-xs text-muted-foreground font-sans mt-2">
                Tout en un seul outil
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
