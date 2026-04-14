import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, FileText, Link2, Receipt, ArrowUpRight, Plus,
  Lock, Clock, AlertTriangle, UserPlus,
  Loader2, BarChart2, Upload, Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { ProUpgradeModal } from "@/components/ProUpgradeModal";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getAccountAccess } from "@/lib/account-access";
import { formatFCFA } from "@/lib/facturation";
import { startOfWeek, endOfWeek, startOfMonth, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface DashboardStats {
  activeClients: number;
  clientsThisMonth: number;
  postsThisWeek: number;
  postsPublished: number;
  postsScheduled: number;
  pendingLinks: number;
  expiredLinks: number;
  unpaidInvoices: number;
  unpaidTotal: number;
}

interface ActivityItem {
  id: string;
  action: string;
  time: string;
  icon: LucideIcon;
  color: string;
}

const ACTIVITY_ICON_MAP: Record<string, LucideIcon> = {
  auth: UserPlus,
  post: FileText,
  client: Users,
  preview: Link2,
  document: Receipt,
  kpi: BarChart2,
  fichier: Upload,
  parametre: Settings,
  autre: Clock,
};

const ACTIVITY_COLOR_MAP: Record<string, string> = {
  auth: "text-blue-500",
  post: "text-violet-500",
  client: "text-success",
  preview: "text-primary",
  document: "text-orange-500",
  kpi: "text-pink-500",
  fichier: "text-cyan-500",
  parametre: "text-muted-foreground",
  autre: "text-muted-foreground",
};

const Dashboard = () => {
  const { user } = useAuth();
  const [upgradeModal, setUpgradeModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [profile, setProfile] = useState<{ role?: string | null; plan?: string | null } | null>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  // Onboarding check
  useEffect(() => {
    if (!user) return;
    const check = async () => {
      const [{ data: prof }, { data: onb }] = await Promise.all([
        supabase.from("users").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("site_settings").select("id").eq("key", `onboarding_done_${user.id}`).maybeSingle(),
      ]);
      setProfile(prof);
      if (!onb) setShowOnboarding(true);
      setCheckingOnboarding(false);
    };
    check();
  }, [user]);

  // Stats fetch
  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const now = new Date();
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
        const monthStart = startOfMonth(now);

        const [clientsRes, postsRes, linksRes, invoicesRes] = await Promise.all([
          supabase.from("clients").select("id, created_at").eq("user_id", user.id).eq("statut", "actif"),
          supabase
            .from("posts")
            .select("id, statut, date_publication")
            .eq("user_id", user.id)
            .gte("date_publication", weekStart.toISOString().split("T")[0])
            .lte("date_publication", weekEnd.toISOString().split("T")[0]),
          supabase.from("preview_links").select("id, expires_at").eq("user_id", user.id),
          supabase
            .from("documents")
            .select("id, total")
            .eq("user_id", user.id)
            .eq("type", "facture")
            .in("statut", ["envoye", "en_retard", "partiellement_paye"]),
        ]);

        const clients = clientsRes.data ?? [];
        const posts = postsRes.data ?? [];
        const links = linksRes.data ?? [];
        const invoices = invoicesRes.data ?? [];

        const published = posts.filter((p) => p.statut === "publie").length;

        setStats({
          activeClients: clients.length,
          clientsThisMonth: clients.filter((c) => new Date(c.created_at) >= monthStart).length,
          postsThisWeek: posts.length,
          postsPublished: published,
          postsScheduled: posts.length - published,
          pendingLinks: links.filter((l) => l.expires_at && new Date(l.expires_at) > now).length,
          expiredLinks: links.filter((l) => l.expires_at && new Date(l.expires_at) <= now).length,
          unpaidInvoices: invoices.length,
          unpaidTotal: invoices.reduce((sum, d) => sum + Number(d.total ?? 0), 0),
        });
      } catch {
        // Silent fail — dashboard stats should never block the UI
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  // Activity logs fetch
  useEffect(() => {
    if (!user) return;
    const fetchActivity = async () => {
      setActivityLoading(true);
      try {
        const { data } = await supabase
          .from("activity_logs")
          .select("id, action, type_action, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);

        const items = (data ?? []).map((log) => ({
          id: log.id,
          action: log.action,
          time: formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: fr }),
          icon: ACTIVITY_ICON_MAP[log.type_action] ?? Clock,
          color: ACTIVITY_COLOR_MAP[log.type_action] ?? "text-muted-foreground",
        }));
        setActivity(items);
      } catch {
        // Silent fail
      } finally {
        setActivityLoading(false);
      }
    };
    fetchActivity();
  }, [user]);

  const { isFreemium } = getAccountAccess(profile);

  if (checkingOnboarding) return null;

  if (showOnboarding && profile) {
    return <OnboardingWizard profile={profile} onComplete={() => setShowOnboarding(false)} />;
  }

  return (
    <DashboardLayout pageTitle="Tableau de bord">
      <div className="animate-fade-in space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
            <p className="text-muted-foreground font-sans mt-1">
              Vue d'ensemble de votre activité
            </p>
          </div>
          <Button size="lg">
            <Plus className="h-4 w-4" />
            Ajouter un client
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Clients actifs */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium font-sans text-muted-foreground">
                Clients actifs
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="text-2xl font-bold font-serif">
                    {stats?.activeClients ?? 0}
                  </div>
                  {isFreemium && (
                    <div className="flex items-center gap-1 mt-1">
                      <Badge variant="warning" className="text-[10px]">
                        {stats?.activeClients ?? 0}/2
                      </Badge>
                      <span className="text-xs text-muted-foreground font-sans">limite Freemium</span>
                    </div>
                  )}
                  {!isFreemium && (stats?.clientsThisMonth ?? 0) > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <ArrowUpRight className="h-3 w-3 text-success" />
                      <span className="text-xs text-success font-sans font-medium">
                        +{stats?.clientsThisMonth} ce mois
                      </span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Posts cette semaine */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium font-sans text-muted-foreground">
                Posts cette semaine
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="text-2xl font-bold font-serif">{stats?.postsThisWeek ?? 0}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-muted-foreground font-sans">
                      {stats?.postsPublished ?? 0} publiés · {stats?.postsScheduled ?? 0} programmés
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Liens en attente */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium font-sans text-muted-foreground">
                Liens en attente
              </CardTitle>
              <Link2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="text-2xl font-bold font-serif">{stats?.pendingLinks ?? 0}</div>
                  {(stats?.expiredLinks ?? 0) > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertTriangle className="h-3 w-3 text-warning" />
                      <span className="text-xs text-warning font-sans font-medium">
                        {stats?.expiredLinks ?? 0} en retard
                      </span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Factures impayées */}
          <Card
            className={isFreemium ? "opacity-60 cursor-pointer" : ""}
            onClick={() => isFreemium && setUpgradeModal(true)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium font-sans text-muted-foreground flex items-center gap-1.5">
                Factures impayées
                {isFreemium && <Lock className="h-3 w-3" />}
              </CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isFreemium ? (
                <div className="space-y-1">
                  <div className="text-2xl font-bold font-serif text-muted-foreground">—</div>
                  <Badge variant="outline" className="text-[10px]">
                    <Lock className="h-2.5 w-2.5 mr-1" />
                    Pro uniquement
                  </Badge>
                </div>
              ) : statsLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="text-2xl font-bold font-serif">{stats?.unpaidInvoices ?? 0}</div>
                  {(stats?.unpaidTotal ?? 0) > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-destructive font-sans font-medium">
                        {formatFCFA(stats?.unpaidTotal ?? 0)}
                      </span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : activity.length === 0 ? (
              <p className="text-sm text-muted-foreground font-sans text-center py-6">
                Aucune activité récente.
              </p>
            ) : (
              <div className="space-y-1">
                {activity.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 py-3 border-b border-border last:border-0"
                  >
                    <item.icon className={`h-4 w-4 shrink-0 ${item.color}`} />
                    <span className="text-sm font-sans flex-1">{item.action}</span>
                    <span className="text-xs text-muted-foreground font-sans whitespace-nowrap">
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ProUpgradeModal
        open={upgradeModal}
        onOpenChange={setUpgradeModal}
        featureName="Facturation"
      />
    </DashboardLayout>
  );
};

export default Dashboard;
