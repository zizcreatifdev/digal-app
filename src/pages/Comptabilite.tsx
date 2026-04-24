import { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Document, fetchDocuments } from "@/lib/facturation";
import { Depense, Salaire, fetchDepenses, fetchSalaires, exportComptabiliteCSV } from "@/lib/comptabilite";
import { RevenusSection } from "@/components/comptabilite/RevenusSection";
import { DepensesSection } from "@/components/comptabilite/DepensesSection";
import { MasseSalarialeSection } from "@/components/comptabilite/MasseSalarialeSection";
import { DashboardFinancier } from "@/components/comptabilite/DashboardFinancier";

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getPrevMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  if (m === 1) return `${y - 1}-12`;
  return `${y}-${String(m - 1).padStart(2, "0")}`;
}

function getMonthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1);
  return d.toLocaleString("fr-FR", { month: "long", year: "numeric" });
}

function generateMonthOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    options.push({ value: ym, label: getMonthLabel(ym) });
  }
  return options;
}

export default function Comptabilite() {
  const { user } = useAuth();
  const [tab, setTab] = useState("dashboard");
  const [mois, setMois] = useState(getCurrentMonth());
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentsPrev, setDocumentsPrev] = useState<Document[]>([]);
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [depensesPrev, setDepensesPrev] = useState<Depense[]>([]);
  const [salaires, setSalaires] = useState<Salaire[]>([]);
  const [salairesPrev, setSalairesPrev] = useState<Salaire[]>([]);
  const [loading, setLoading] = useState(true);

  const prevMois = getPrevMonth(mois);
  const monthOptions = generateMonthOptions();

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [docs, deps, sals, docsPrev, depsPrev, salsPrev] = await Promise.all([
        fetchDocuments(user.id),
        fetchDepenses(user.id, mois),
        fetchSalaires(user.id, mois),
        fetchDocuments(user.id),
        fetchDepenses(user.id, prevMois),
        fetchSalaires(user.id, prevMois),
      ]);
      setDocuments(docs);
      setDepenses(deps);
      setSalaires(sals);
      setDocumentsPrev(docsPrev);
      setDepensesPrev(depsPrev);
      setSalairesPrev(salsPrev);
    } finally {
      setLoading(false);
    }
  }, [user, mois, prevMois]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-serif font-bold">Comptabilité</h1>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportComptabiliteCSV(depenses, salaires, mois)}
              disabled={loading}
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter CSV
            </Button>
            <Select value={mois} onValueChange={setMois}>
              <SelectTrigger className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="revenus">Revenus</TabsTrigger>
              <TabsTrigger value="depenses">Dépenses</TabsTrigger>
              <TabsTrigger value="masse_salariale">Masse salariale</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <DashboardFinancier
                documents={documents}
                depenses={depenses}
                salaires={salaires}
                mois={mois}
                moisPrecedent={prevMois}
                depensesPrecedent={depensesPrev}
                salairesPrecedent={salairesPrev}
                documentsPrecedent={documentsPrev}
              />
            </TabsContent>

            <TabsContent value="revenus">
              <RevenusSection documents={documents} />
            </TabsContent>

            <TabsContent value="depenses">
              <DepensesSection depenses={depenses} onRefresh={load} />
            </TabsContent>

            <TabsContent value="masse_salariale">
              <MasseSalarialeSection salaires={salaires} mois={mois} onRefresh={load} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}
