import { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getAccountAccess } from "@/lib/account-access";
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
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ role?: string | null; plan?: string | null } | null>(null);
  const [tab, setTab] = useState("dashboard");
  const [mois, setMois] = useState(getCurrentMonth());
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentsPrev, setDocumentsPrev] = useState<Document[]>([]);
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [depensesPrev, setDepensesPrev] = useState<Depense[]>([]);
  const [salaires, setSalaires] = useState<Salaire[]>([]);
  const [salairesPrev, setSalairesPrev] = useState<Salaire[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("users").select("role, plan").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => { if (data) setProfile(data); });
  }, [user]);

  const { isFreemium } = getAccountAccess(profile);
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
    } catch (err) {
      toast.error("Erreur lors du chargement");
      if (import.meta.env.DEV) console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user, mois, prevMois]);

  useEffect(() => {
    load();
  }, [load]);

  if (isFreemium) return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-60 gap-4 text-center p-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold font-serif">Fonctionnalité Pro</h3>
        <p className="text-muted-foreground text-sm max-w-sm font-sans">
          La comptabilité est disponible à partir du plan CM Pro.
        </p>
        <Button onClick={() => navigate("/dashboard/parametres?tab=licence")}>
          Débloquer avec une licence →
        </Button>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold">Comptabilité</h1>
            <p className="text-muted-foreground text-sm font-sans">Suivez vos dépenses, salaires et résultats financiers.</p>
          </div>
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
