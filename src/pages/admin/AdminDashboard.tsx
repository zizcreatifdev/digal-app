import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DollarSign, Users, KeyRound, AlertTriangle, Briefcase,
  PieChart, TrendingUp, Loader2,
  UserX, UserMinus, UserCheck, Wallet, FileText, Link as LinkIcon,
  Copy,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePlans } from "@/hooks/usePlans";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

/* ─── Types ─────────────────────────────────────────────── */

interface UserRow {
  id: string;
  user_id: string;
  email: string;
  prenom: string;
  nom: string;
  role: string;
  created_at: string;
  licence_expiration: string | null;
}

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

interface HealthKpis {
  inactive7: number;
  inactive30: number;
  neverConnected: number;
  hotProspects: number;
}

interface AlertEntry {
  priority: "urgent" | "attention" | "opportunite" | "info";
  userId: string;
  prenom: string;
  nom: string;
  email: string;
  alerte: string;
  daysSince: number;
}

interface HealthAndAlerts {
  kpis: HealthKpis;
  alerts: AlertEntry[];
}

interface EngagementKpis {
  totalClients: number;
  postsThisWeek: number;
  previewLinksThisMonth: number;
  revenueThisMonth: number;
}

/* ─── Constants ──────────────────────────────────────────── */

const roleToPlanSlug: Record<string, string> = {
  solo: "solo_standard",
  dm: "agence_standard",
  agence_standard: "agence_standard",
  agence_pro: "agence_pro",
};

const PRIORITY_CONFIG = {
  urgent: { label: "URGENT", dot: "bg-red-500", badge: "bg-red-100 text-red-700", actionLabel: "Contacter" },
  attention: { label: "ATTENTION", dot: "bg-orange-500", badge: "bg-orange-100 text-orange-700", actionLabel: "Contacter" },
  opportunite: { label: "OPPORTUNITÉ", dot: "bg-yellow-500", badge: "bg-yellow-100 text-yellow-700", actionLabel: "Envoyer offre" },
  info: { label: "INFO", dot: "bg-blue-500", badge: "bg-blue-100 text-blue-700", actionLabel: "Relancer" },
} as const;

/* ─── Data fetchers ──────────────────────────────────────── */

async function fetchKpis(planPrices: Record<string, number>): Promise<KpiData> {
  const { data: users, error } = await supabase.from("users").select("*");
  if (error) throw error;

  const allUsers = (users ?? []).filter((u) => u.role !== "owner");
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const paidUsers = allUsers.filter((u) => u.role !== "freemium");
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
    mrr, soloActive, agenceActive, licensesThisMonth, expiringIn30Days,
    totalComptes: allUsers.length, freemiumCount, licensedCount, conversionRate,
  };
}

async function fetchHealthData(users: UserRow[]): Promise<HealthAndAlerts> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const { data: loginLogs } = await supabase
    .from("activity_logs")
    .select("user_id, created_at")
    .eq("type_action", "auth")
    .eq("action", "login_success")
    .order("created_at", { ascending: false })
    .limit(5000);

  const lastLoginMap = new Map<string, Date>();
  for (const log of loginLogs ?? []) {
    if (!lastLoginMap.has(log.user_id)) {
      lastLoginMap.set(log.user_id, new Date(log.created_at));
    }
  }

  const nonOwnerUsers = users.filter((u) => u.role !== "owner");
  let inactive7 = 0;
  let inactive30 = 0;
  let neverConnected = 0;
  let hotProspects = 0;
  const alerts: AlertEntry[] = [];

  for (const user of nonOwnerUsers) {
    const lastLogin = lastLoginMap.get(user.user_id);
    const activationDate = new Date(user.created_at);
    const licenceExp = user.licence_expiration ? new Date(user.licence_expiration) : null;

    // Health widgets
    if (!lastLogin && activationDate < oneHourAgo) {
      neverConnected++;
    } else if (lastLogin) {
      if (lastLogin < sevenDaysAgo) inactive7++;
      if (lastLogin < thirtyDaysAgo) inactive30++;
    }
    if (user.role === "freemium" && activationDate < thirtyDaysAgo && lastLogin) {
      hotProspects++;
    }

    // Alerts — URGENT: Licence expires in ≤7 days
    if (licenceExp && licenceExp > now && licenceExp <= sevenDaysFromNow && user.role !== "freemium") {
      const daysLeft = Math.ceil((licenceExp.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      alerts.push({
        priority: "urgent",
        userId: user.user_id,
        prenom: user.prenom, nom: user.nom, email: user.email,
        alerte: `Licence expire dans ${daysLeft} jour(s)`,
        daysSince: daysLeft,
      });
    }

    // ATTENTION: Inactive 14+ days
    if (lastLogin && lastLogin < fourteenDaysAgo) {
      const days = Math.floor((now.getTime() - lastLogin.getTime()) / (24 * 60 * 60 * 1000));
      alerts.push({
        priority: "attention",
        userId: user.user_id,
        prenom: user.prenom, nom: user.nom, email: user.email,
        alerte: `Inactif depuis ${days} jours`,
        daysSince: days,
      });
    }

    // OPPORTUNITE: Freemium 30+ days without upgrade
    if (user.role === "freemium" && activationDate < thirtyDaysAgo && lastLogin) {
      const days = Math.floor((now.getTime() - activationDate.getTime()) / (24 * 60 * 60 * 1000));
      alerts.push({
        priority: "opportunite",
        userId: user.user_id,
        prenom: user.prenom, nom: user.nom, email: user.email,
        alerte: `Freemium actif depuis ${days} jours sans upgrade`,
        daysSince: days,
      });
    }

    // INFO: Never connected after activation (exclude accounts < 1 hour old)
    if (!lastLogin && activationDate < oneHourAgo) {
      const days = Math.floor((now.getTime() - activationDate.getTime()) / (24 * 60 * 60 * 1000));
      alerts.push({
        priority: "info",
        userId: user.user_id,
        prenom: user.prenom, nom: user.nom, email: user.email,
        alerte: `Activé il y a ${days} jours, jamais connecté`,
        daysSince: days,
      });
    }
  }

  const priorityOrder: Record<string, number> = { urgent: 0, attention: 1, opportunite: 2, info: 3 };
  alerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return { kpis: { inactive7, inactive30, neverConnected, hotProspects }, alerts };
}

async function fetchEngagement(): Promise<EngagementKpis> {
  const now = new Date();
  const dayOfWeek = (now.getDay() + 6) % 7; // Monday = 0
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [clientsRes, postsRes, previewRes, paymentsRes] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase.from("posts").select("id", { count: "exact", head: true }).gte("created_at", startOfWeek.toISOString()),
    supabase.from("preview_links").select("id", { count: "exact", head: true }).gte("created_at", startOfMonth.toISOString()),
    supabase.from("payments").select("montant").gte("created_at", startOfMonth.toISOString()),
  ]);

  const revenueThisMonth = (paymentsRes.data ?? []).reduce(
    (s: number, p: { montant: number }) => s + p.montant, 0
  );

  return {
    totalClients: clientsRes.count ?? 0,
    postsThisWeek: postsRes.count ?? 0,
    previewLinksThisMonth: previewRes.count ?? 0,
    revenueThisMonth,
  };
}

/* ─── Helpers ────────────────────────────────────────────── */

function formatFCFA(amount: number) {
  return amount.toLocaleString("fr-FR") + " FCFA";
}

function getAlertMessage(alert: AlertEntry): string {
  if (alert.priority === "opportunite") {
    return [
      `Bonjour ${alert.prenom},`,
      "",
      `Vous utilisez Digal depuis ${alert.daysSince} jours en version gratuite.`,
      "Passez à la version Solo Standard et débloquez :",
      "la facturation FCFA, la comptabilité et les rapports KPI.",
      "",
      "Licence 6 mois : 75 000 FCFA",
      "Contactez-moi pour activer votre licence.",
      "",
      "L'équipe Digal",
    ].join("\n");
  }
  if (alert.priority === "info") {
    return [
      `Bonjour ${alert.prenom},`,
      "",
      "Votre compte Digal est prêt mais vous ne vous êtes",
      "pas encore connecté(e).",
      "",
      "Accédez à votre espace ici :",
      "digal.vercel.app/login",
      "",
      "Besoin d'aide ? Répondez à ce message.",
      "",
      "L'équipe Digal",
    ].join("\n");
  }
  return alert.email;
}

/* ─── Sub-components ─────────────────────────────────────── */

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-3">
    <h2 className="text-base font-bold font-serif text-foreground shrink-0">{children}</h2>
    <div className="flex-1 h-px bg-border" />
  </div>
);

const KpiWidget = ({
  title,
  value,
  icon: Icon,
  onClick,
  highlight,
  isLoading,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  onClick?: () => void;
  highlight?: "orange" | "red" | "green";
  isLoading?: boolean;
}) => {
  const colorMap = { orange: "text-orange-600", red: "text-red-600", green: "text-emerald-600" };
  const valueColor = highlight ? colorMap[highlight] : "";
  return (
    <Card
      className={`group hover:shadow-lg hover:border-primary/30 transition-all ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium font-sans text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </CardHeader>
      <CardContent>
        {isLoading
          ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          : <div className={`text-2xl font-bold font-serif ${valueColor}`}>{value}</div>
        }
      </CardContent>
    </Card>
  );
};

/* ─── Page ───────────────────────────────────────────────── */

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { data: dbPlans } = usePlans();

  const planPrices: Record<string, number> = {};
  (dbPlans ?? []).forEach((p) => {
    planPrices[p.slug] = p.promo_active && p.promo_prix_mensuel != null
      ? p.promo_prix_mensuel
      : p.prix_mensuel;
  });

  // ── KPIs existants ─────────────────────────────────────
  const { data: kpi, isLoading: kpiLoading, error: kpiError } = useQuery({
    queryKey: ["admin-kpis", planPrices],
    queryFn: () => fetchKpis(planPrices),
    refetchInterval: 30_000,
    enabled: (dbPlans ?? []).length > 0,
  });

  // ── Santé utilisateurs + alertes ───────────────────────
  const { data: allUsers } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase.from("users").select("*");
      if (error) throw error;
      return (data ?? []) as UserRow[];
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ["admin-health"],
    queryFn: () => fetchHealthData(allUsers!),
    enabled: !!allUsers,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  // ── Engagement produit ─────────────────────────────────
  const { data: engagement, isLoading: engagementLoading } = useQuery({
    queryKey: ["admin-engagement"],
    queryFn: fetchEngagement,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const copyAlertAction = async (alert: AlertEntry) => {
    const msg = getAlertMessage(alert);
    try {
      await navigator.clipboard.writeText(msg);
      const label = alert.priority === "urgent" || alert.priority === "attention"
        ? `Email copié : ${alert.email}`
        : `Message copié pour ${alert.prenom}`;
      toast.success(label);
    } catch {
      toast.error("Impossible d'accéder au presse-papier");
    }
  };

  const widgets = kpi
    ? [
        { title: "MRR", value: formatFCFA(kpi.mrr), icon: DollarSign, href: "/admin/facturation" },
        { title: "Comptes Solo actifs", value: String(kpi.soloActive), icon: Users, href: "/admin/comptes" },
        { title: "Comptes Agence actifs", value: String(kpi.agenceActive), icon: Briefcase, href: "/admin/comptes" },
        { title: "Licences ce mois", value: String(kpi.licensesThisMonth), icon: KeyRound, href: "/admin/licences" },
        { title: "Expirent sous 30j", value: String(kpi.expiringIn30Days), icon: AlertTriangle, href: "/admin/licences" },
        { title: "Total comptes", value: String(kpi.totalComptes), icon: Users, href: "/admin/comptes" },
        { title: "Freemium vs Licenciés", value: `${kpi.freemiumCount} / ${kpi.licensedCount}`, icon: PieChart, href: "/admin/comptes" },
        { title: "Taux conversion", value: `${kpi.conversionRate}%`, icon: TrendingUp, href: "/admin/plans" },
      ]
    : [];

  const h = healthData?.kpis;
  const healthWidgets = [
    {
      title: "Inactifs 7 jours",
      value: h ? String(h.inactive7) : "—",
      icon: UserX,
      filter: "inactive7",
      highlight: h && h.inactive7 > 0 ? ("orange" as const) : undefined,
    },
    {
      title: "Inactifs 30 jours",
      value: h ? String(h.inactive30) : "—",
      icon: UserMinus,
      filter: "inactive30",
      highlight: h && h.inactive30 > 0 ? ("red" as const) : undefined,
    },
    {
      title: "Jamais connectés",
      value: h ? String(h.neverConnected) : "—",
      icon: UserCheck,
      filter: "never",
      highlight: h && h.neverConnected > 0 ? ("red" as const) : undefined,
    },
    {
      title: "Prospects chauds",
      value: h ? String(h.hotProspects) : "—",
      icon: TrendingUp,
      filter: "hot",
      highlight: h && h.hotProspects > 0 ? ("green" as const) : undefined,
    },
  ];

  const eg = engagement;
  const engagementWidgets = [
    { title: "Clients créés total", value: eg ? String(eg.totalClients) : "—", icon: Briefcase },
    { title: "Posts cette semaine", value: eg ? String(eg.postsThisWeek) : "—", icon: FileText },
    { title: "Liens validation ce mois", value: eg ? String(eg.previewLinksThisMonth) : "—", icon: LinkIcon },
    { title: "Revenus encaissés ce mois", value: eg ? formatFCFA(eg.revenueThisMonth) : "—", icon: Wallet },
  ];

  return (
    <AdminLayout>
      <div className="animate-fade-in space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Administration</h1>
          <p className="text-muted-foreground font-sans mt-1">
            Vue d'ensemble de la plateforme Digal
          </p>
        </div>

        {kpiLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {kpiError && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive text-sm font-sans">
                Erreur lors du chargement des données : {(kpiError as Error).message}
              </p>
            </CardContent>
          </Card>
        )}

        {/* ── Section 1 : Vue d'ensemble ─────────────────── */}
        {kpi && (
          <>
            <SectionTitle>Vue d'ensemble</SectionTitle>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {widgets.map((w) => (
                <KpiWidget
                  key={w.title}
                  title={w.title}
                  value={w.value}
                  icon={w.icon}
                  onClick={() => navigate(w.href)}
                />
              ))}
            </div>
          </>
        )}

        {/* ── Section 2 : Santé utilisateurs ─────────────── */}
        <SectionTitle>Santé utilisateurs</SectionTitle>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {healthWidgets.map((w) => (
            <KpiWidget
              key={w.title}
              title={w.title}
              value={w.value}
              icon={w.icon}
              highlight={w.highlight}
              isLoading={healthLoading}
              onClick={() => navigate(`/admin/comptes?filter=${w.filter}`)}
            />
          ))}
        </div>

        {/* ── Section 3 : Engagement produit ─────────────── */}
        <SectionTitle>Engagement produit</SectionTitle>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {engagementWidgets.map((w) => (
            <KpiWidget
              key={w.title}
              title={w.title}
              value={w.value}
              icon={w.icon}
              isLoading={engagementLoading}
            />
          ))}
        </div>

        {/* ── Section 4 : Alertes prioritaires ───────────── */}
        <SectionTitle>Alertes prioritaires</SectionTitle>
        {healthLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-28">Priorité</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Alerte</TableHead>
                    <TableHead className="w-24">Depuis</TableHead>
                    <TableHead className="w-32 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(healthData?.alerts ?? []).slice(0, 30).map((alert, i) => {
                    const cfg = PRIORITY_CONFIG[alert.priority];
                    return (
                      <TableRow key={`${alert.userId}-${alert.priority}-${i}`}>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold font-sans px-2 py-0.5 rounded-full ${cfg.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium text-sm">
                          {alert.prenom} {alert.nom}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{alert.email}</TableCell>
                        <TableCell className="text-xs font-sans">{alert.alerte}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {alert.priority === "urgent"
                            ? `J${alert.daysSince}`
                            : `${alert.daysSince}j`}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs font-sans h-7 gap-1.5"
                            onClick={() => copyAlertAction(alert)}
                          >
                            <Copy className="h-3 w-3" />
                            {cfg.actionLabel}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(!healthData?.alerts || healthData.alerts.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground text-sm py-12 font-sans">
                        Aucune alerte en cours
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
