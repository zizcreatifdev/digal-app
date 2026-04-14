import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign, Users, KeyRound, AlertTriangle, Briefcase,
  PieChart, TrendingUp, Loader2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePlans } from "@/hooks/usePlans";
import { useNavigate } from "react-router-dom";

interface KpiData {
  mrr: number;
  soloActive: number;
  agenceActive: number;
  licensesThisMonth: number;
  expiringIn30Days: number;
  totalComptes: number;
  freemiumCount: number;
  licensedCount: number;
  conversionRate: number;
}

/* Map user.role → plan slug for price lookup */
const roleToPlanSlug: Record<string, string> = {
  solo: "solo_standard",
  dm: "agence_standard",
  agence_standard: "agence_standard",
  agence_pro: "agence_pro",
};

async function fetchKpis(planPrices: Record<string, number>): Promise<KpiData> {
  const { data: users, error } = await supabase.from("users").select("*");
  if (error) throw error;

  const allUsers = (users ?? []).filter((u) => u.role !== "owner");
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Users with a paid role (not freemium)
  const paidUsers = allUsers.filter((u) => u.role !== "freemium");

  // Active = paid + (has licence not expired OR no licence_expiration set = just created)
  const activeUsers = paidUsers.filter(
    (u) => !u.licence_expiration || new Date(u.licence_expiration) > now
  );

  const mrr = activeUsers.reduce((sum, u) => {
    const slug = roleToPlanSlug[u.role] ?? u.role;
    return sum + (planPrices[slug] ?? 0);
  }, 0);

  const soloActive = activeUsers.filter((u) => u.role === "solo").length;
  const agenceActive = activeUsers.filter(
    (u) => u.role === "dm" || u.role === "agence_standard" || u.role === "agence_pro"
  ).length;

  const licensesThisMonth = paidUsers.filter(
    (u) => new Date(u.created_at) >= startOfMonth
  ).length;

  const expiringIn30Days = allUsers.filter(
    (u) =>
      u.licence_expiration &&
      new Date(u.licence_expiration) > now &&
      new Date(u.licence_expiration) <= thirtyDaysFromNow
  ).length;

  const freemiumCount = allUsers.filter((u) => u.role === "freemium").length;
  const licensedCount = paidUsers.length;
  const conversionRate = allUsers.length > 0
    ? Math.round((licensedCount / allUsers.length) * 100)
    : 0;

  return {
    mrr,
    soloActive,
    agenceActive,
    licensesThisMonth,
    expiringIn30Days,
    totalComptes: allUsers.length,
    freemiumCount,
    licensedCount,
    conversionRate,
  };
}

function formatFCFA(amount: number) {
  return amount.toLocaleString("fr-FR") + " FCFA";
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { data: dbPlans } = usePlans();
  const planPrices: Record<string, number> = {};
  (dbPlans ?? []).forEach(p => {
    planPrices[p.slug] = p.promo_active && p.promo_prix_mensuel != null ? p.promo_prix_mensuel : p.prix_mensuel;
  });

  const { data: kpi, isLoading, error } = useQuery({
    queryKey: ["admin-kpis", planPrices],
    queryFn: () => fetchKpis(planPrices),
    refetchInterval: 30000,
    enabled: (dbPlans ?? []).length > 0,
  });

  const widgets = kpi
    ? [
        { title: "MRR", value: formatFCFA(kpi.mrr), icon: DollarSign, href: "/admin/facturation" },
        { title: "Comptes Solo actifs", value: String(kpi.soloActive), icon: Users, href: "/admin/comptes" },
        { title: "Comptes Agence actifs", value: String(kpi.agenceActive), icon: Briefcase, href: "/admin/comptes" },
        { title: "Licences ce mois", value: String(kpi.licensesThisMonth), icon: KeyRound, href: "/admin/licences" },
        { title: "Expirent sous 30j", value: String(kpi.expiringIn30Days), icon: AlertTriangle, href: "/admin/licences" },
        { title: "Total comptes", value: String(kpi.totalComptes), icon: Users, href: "/admin/comptes" },
        {
          title: "Freemium vs Licenciés",
          value: `${kpi.freemiumCount} / ${kpi.licensedCount}`,
          icon: PieChart,
          href: "/admin/comptes",
        },
        { title: "Taux conversion", value: `${kpi.conversionRate}%`, icon: TrendingUp, href: "/admin/plans" },
      ]
    : [];

  return (
    <AdminLayout>
      <div className="animate-fade-in space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Administration</h1>
          <p className="text-muted-foreground font-sans mt-1">
            Vue d'ensemble de la plateforme Digal
          </p>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive text-sm font-sans">
                Erreur lors du chargement des données : {(error as Error).message}
              </p>
            </CardContent>
          </Card>
        )}

        {kpi && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {widgets.map((w) => (
              <Card
                key={w.title}
                className="group hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer"
                onClick={() => navigate(w.href)}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium font-sans text-muted-foreground">
                    {w.title}
                  </CardTitle>
                  <w.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-serif">{w.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
