import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatFCFA } from "@/lib/facturation";
import type { Document } from "@/lib/facturation";
import type { Depense, Salaire } from "@/lib/comptabilite";

interface Props {
  documents: Document[];
  depenses: Depense[];
  salaires: Salaire[];
  mois: string;
  moisPrecedent: string;
  depensesPrecedent: Depense[];
  salairesPrecedent: Salaire[];
  documentsPrecedent: Document[];
}

function StatCard({
  label,
  value,
  prev,
  color = "text-foreground",
}: {
  label: string;
  value: number;
  prev?: number;
  color?: string;
}) {
  const diff = prev !== undefined ? value - prev : undefined;
  const pct = prev && prev !== 0 ? Math.round(((value - prev) / prev) * 100) : undefined;

  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <p className="text-xs text-muted-foreground font-sans uppercase tracking-wider">{label}</p>
        <p className={`text-xl font-bold font-serif mt-1 ${color}`}>{formatFCFA(value)}</p>
        {diff !== undefined && (
          <div className="flex items-center gap-1 mt-1 text-xs">
            {diff > 0 ? (
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
            ) : diff < 0 ? (
              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
            ) : (
              <Minus className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span className={diff > 0 ? "text-emerald-600" : diff < 0 ? "text-red-500" : "text-muted-foreground"}>
              {pct !== undefined ? `${pct > 0 ? "+" : ""}${pct}%` : "-"} vs mois précédent
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardFinancier({
  documents,
  depenses,
  salaires,
  mois,
  depensesPrecedent,
  salairesPrecedent,
  documentsPrecedent,
}: Props) {
  const factures = documents.filter((d) => d.type === "facture");
  const facturesPrev = documentsPrecedent.filter((d) => d.type === "facture");

  const totalFacture = factures.reduce((s, d) => s + d.total, 0);
  const totalEncaisse = factures
    .filter((d) => ["paye", "partiellement_paye"].includes(d.statut))
    .reduce((s, d) => s + d.total, 0);
  const soldeAttente = totalFacture - totalEncaisse;

  const totalFacturePrev = facturesPrev.reduce((s, d) => s + d.total, 0);
  const totalEncaissePrev = facturesPrev
    .filter((d) => ["paye", "partiellement_paye"].includes(d.statut))
    .reduce((s, d) => s + d.total, 0);

  const totalDepenses = depenses.reduce((s, d) => s + d.montant, 0);
  const totalDepensesPrev = depensesPrecedent.reduce((s, d) => s + d.montant, 0);

  const totalMasse = salaires.reduce((s, sal) => s + sal.salaire_mensuel, 0);
  const totalMassePrev = salairesPrecedent.reduce((s, sal) => s + sal.salaire_mensuel, 0);

  const totalCharges = totalDepenses + totalMasse;
  const totalChargesPrev = totalDepensesPrev + totalMassePrev;

  const resultat = totalEncaisse - totalCharges;
  const resultatPrev = totalEncaissePrev - totalChargesPrev;

  // Chart data for last 6 months
  const chartData = useMemo(() => {
    const now = new Date(mois + "-01");
    const months: { mois: string; revenus: number; charges: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = d.toLocaleString("fr-FR", { month: "short" });

      const mFactures = documents.filter(
        (doc) => doc.type === "facture" && doc.date_emission.startsWith(ym)
      );
      const mDepenses = depenses.filter((dep) => dep.date_depense.startsWith(ym));

      months.push({
        mois: monthLabel,
        revenus: mFactures.reduce((s, f) => s + f.total, 0),
        charges: mDepenses.reduce((s, dep) => s + dep.montant, 0),
      });
    }
    return months;
  }, [mois, documents, depenses]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total facturé" value={totalFacture} prev={totalFacturePrev} />
        <StatCard label="Total encaissé" value={totalEncaisse} prev={totalEncaissePrev} color="text-emerald-600" />
        <StatCard label="Charges totales" value={totalCharges} prev={totalChargesPrev} color="text-red-500" />
        <StatCard label="Résultat" value={resultat} prev={resultatPrev} color={resultat >= 0 ? "text-emerald-600" : "text-red-500"} />
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Solde en attente</p>
            <p className="text-lg font-bold font-serif text-amber-600 mt-1">{formatFCFA(soldeAttente)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Dépenses</p>
            <p className="text-lg font-bold font-serif mt-1">{formatFCFA(totalDepenses)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Masse salariale</p>
            <p className="text-lg font-bold font-serif mt-1">{formatFCFA(totalMasse)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Bar chart */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold font-serif mb-4">Revenus vs Charges · 6 derniers mois</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="mois" fontSize={12} />
              <YAxis fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value: number) => formatFCFA(value)}
                contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
              />
              <Legend />
              <Bar dataKey="revenus" name="Revenus" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="charges" name="Charges" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
