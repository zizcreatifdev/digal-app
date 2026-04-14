import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles, FileText, BookOpen, BarChart3, TrendingUp } from "lucide-react";

interface ProUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName: string;
}

function FacturationMockup() {
  return (
    <div className="space-y-2 opacity-60 pointer-events-none select-none">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-primary/20 rounded w-24" />
        <div className="h-6 bg-primary/30 rounded w-20 text-[10px] flex items-center justify-center text-primary font-sans font-medium">+ Facture</div>
      </div>
      <div className="rounded border border-border divide-y divide-border text-[10px] font-sans">
        {[
          { num: "FAC-2026-0001", client: "Awa Diallo", montant: "150 000 FCFA", statut: "Payée" },
          { num: "FAC-2026-0002", client: "Mamadou Sow", montant: "85 000 FCFA", statut: "En attente" },
          { num: "DEV-2026-0001", client: "Aminata Ba", montant: "200 000 FCFA", statut: "Devis" },
        ].map((row, i) => (
          <div key={i} className="flex items-center justify-between px-2 py-1.5">
            <span className="text-muted-foreground">{row.num}</span>
            <span>{row.client}</span>
            <span className="font-medium">{row.montant}</span>
            <span className={`px-1.5 py-0.5 rounded-full ${row.statut === "Payée" ? "bg-emerald-100 text-emerald-700" : row.statut === "Devis" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>{row.statut}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComptabiliteMockup() {
  return (
    <div className="space-y-2 opacity-60 pointer-events-none select-none">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "CA facturé", value: "2 450 000", color: "text-emerald-700" },
          { label: "Dépenses", value: "380 000", color: "text-red-600" },
          { label: "Résultat net", value: "2 070 000", color: "text-primary" },
        ].map((kpi, i) => (
          <div key={i} className="rounded border border-border p-2 text-center">
            <p className={`text-sm font-bold font-serif ${kpi.color}`}>{kpi.value}</p>
            <p className="text-[9px] text-muted-foreground font-sans">{kpi.label}</p>
          </div>
        ))}
      </div>
      <div className="rounded border border-border divide-y divide-border text-[10px] font-sans">
        {["Abonnement Canva • 15 000 FCFA", "Boost Facebook • 25 000 FCFA", "Salaire CM • 120 000 FCFA"].map((item, i) => (
          <div key={i} className="flex items-center justify-between px-2 py-1.5">
            <span className="text-muted-foreground">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RapportsMockup() {
  const bars = [40, 65, 55, 80, 70, 90, 75];
  return (
    <div className="space-y-2 opacity-60 pointer-events-none select-none">
      <div className="flex items-end gap-1 h-16 px-2">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 bg-primary/30 rounded-t"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[9px] text-muted-foreground font-sans px-2">
        {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => <span key={i}>{d}</span>)}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Taux engagement", value: "4.8%", icon: TrendingUp },
          { label: "Posts publiés", value: "24", icon: BarChart3 },
        ].map((kpi, i) => (
          <div key={i} className="rounded border border-border p-2 flex items-center gap-2">
            <kpi.icon className="h-4 w-4 text-primary/50" />
            <div>
              <p className="text-sm font-bold font-serif">{kpi.value}</p>
              <p className="text-[9px] text-muted-foreground font-sans">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const FEATURE_CONFIG: Record<string, {
  icon: React.ElementType;
  description: string;
  benefits: string[];
  Mockup: React.FC;
}> = {
  "Facturation": {
    icon: FileText,
    description: "Créez des devis et factures professionnels avec numérotation automatique, tampon et signature.",
    benefits: ["Devis & factures en PDF", "Numérotation automatique", "Suivi des paiements", "Tampon & signature"],
    Mockup: FacturationMockup,
  },
  "Comptabilité": {
    icon: BookOpen,
    description: "Suivez vos revenus, dépenses et masse salariale. Tableau de bord financier complet.",
    benefits: ["CA facturé vs encaissé", "Suivi des dépenses", "Gestion des salaires", "Export CSV"],
    Mockup: ComptabiliteMockup,
  },
  "Rapports KPI": {
    icon: BarChart3,
    description: "Analysez les performances de vos campagnes et générez des rapports clients détaillés.",
    benefits: ["KPI par réseau social", "Graphiques de performance", "Rapports PDF clients", "Comparaisons périodiques"],
    Mockup: RapportsMockup,
  },
};

export function ProUpgradeModal({ open, onOpenChange, featureName }: ProUpgradeModalProps) {
  const config = FEATURE_CONFIG[featureName];
  const Icon = config?.icon ?? Lock;
  const Mockup = config?.Mockup;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Fonctionnalité Pro
          </DialogTitle>
          <DialogDescription>
            <span className="font-semibold text-foreground">{featureName}</span> est disponible avec une licence Pro.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-muted/30 p-4 my-1 relative overflow-hidden">
          {Mockup ? (
            <Mockup />
          ) : (
            <div className="flex items-center justify-center h-24 text-muted-foreground">
              <div className="text-center space-y-2">
                <Icon className="h-8 w-8 mx-auto text-primary/40" />
                <p className="text-sm font-sans">Aperçu de {featureName}</p>
              </div>
            </div>
          )}
          {/* Overlay blur */}
          <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-[2px] rounded-lg">
            <div className="text-center space-y-1">
              <Lock className="h-7 w-7 mx-auto text-primary" />
              <p className="text-xs font-sans font-medium text-foreground">Réservé aux abonnés Pro</p>
            </div>
          </div>
        </div>

        {config && (
          <ul className="space-y-1 text-sm font-sans text-muted-foreground">
            {config.benefits.map((b) => (
              <li key={b} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                {b}
              </li>
            ))}
          </ul>
        )}

        <div className="space-y-2 pt-1">
          <Button className="w-full" size="lg" onClick={() => onOpenChange(false)}>
            Débloquer avec une licence
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
            Plus tard
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
