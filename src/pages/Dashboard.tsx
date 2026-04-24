import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users, FileText, Link2, Receipt, ArrowUpRight, Plus,
  Lock, Clock, AlertTriangle, UserPlus, UserCheck,
  Loader2, BarChart2, Upload, Settings,
  TrendingUp, TrendingDown, CheckCircle2, CalendarCheck, Sun, Moon,
  Instagram, Facebook, Linkedin, Twitter, Music, AlertCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ProUpgradeModal } from "@/components/ProUpgradeModal";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getAccountAccess } from "@/lib/account-access";
import { formatFCFA } from "@/lib/facturation";
import { startOfWeek, endOfWeek, startOfMonth, subWeeks, format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface DashboardStats {
  activeClients: number;
  clientsThisMonth: number;
  postsThisWeek: number;
  postsPublished: number;
  postsScheduled: number;
  postsLastWeek: number;
  pendingLinks: number;
  expiredLinks: number;
  unpaidInvoices: number;
  unpaidTotal: number;
}

interface TodayPost {
  id: string;
  reseau: string;
  date_publication: string;
  client_nom: string;
}

interface ActivityItem {
  id: string;
  action: string;
  time: string;
  icon: LucideIcon;
  color: string;
  bg: string;
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
  auth: "text-blue-600",
  post: "text-violet-600",
  client: "text-emerald-600",
  preview: "text-orange-600",
  document: "text-amber-600",
  kpi: "text-pink-600",
  fichier: "text-cyan-600",
  parametre: "text-slate-500",
  autre: "text-slate-400",
};

const ACTIVITY_BG_MAP: Record<string, string> = {
  auth: "bg-blue-100 dark:bg-blue-900/30",
  post: "bg-violet-100 dark:bg-violet-900/30",
  client: "bg-emerald-100 dark:bg-emerald-900/30",
  preview: "bg-orange-100 dark:bg-orange-900/30",
  document: "bg-amber-100 dark:bg-amber-900/30",
  kpi: "bg-pink-100 dark:bg-pink-900/30",
  fichier: "bg-cyan-100 dark:bg-cyan-900/30",
  parametre: "bg-slate-100 dark:bg-slate-800",
  autre: "bg-slate-100 dark:bg-slate-800",
};

const RESEAU_ICONS: Record<string, React.ReactNode> = {
  instagram: <Instagram className="h-3.5 w-3.5" />,
  facebook: <Facebook className="h-3.5 w-3.5" />,
  linkedin: <Linkedin className="h-3.5 w-3.5" />,
  x: <Twitter className="h-3.5 w-3.5" />,
  tiktok: <Music className="h-3.5 w-3.5" />,
};

const LICENSE_EXPIRY_POPUP_KEY = "digal_expiry_popup_dismissed";

function formatActivityLabel(action: string, typeAction: string, detail: string | null, city: string | null): string {
  if (action === "login_success") return city ? `Connexion depuis ${city}` : "Connexion";
  if (action === "Déconnexion") return "Déconnexion";
  if (action === "Inscription via parrainage") return "Inscription via parrainage";
  if (typeAction === "post") return detail ? `Post créé · ${detail}` : "Post créé";
  if (typeAction === "client") {
    if (action === "Client créé") return detail ? `Nouveau client : ${detail}` : "Nouveau client ajouté";
    if (action === "Client modifié") return detail ? `Client modifié : ${detail}` : "Client modifié";
    return detail ? `${action} · ${detail}` : action;
  }
  if (typeAction === "preview") return detail ? `Lien envoyé à ${detail}` : "Lien de validation généré";
  if (typeAction === "document") return detail ? `Facture · ${detail}` : action;
  if (typeAction === "kpi") return "Rapport KPI consulté";
  return action;
}

function DeltaBadge({ current, previous, label = "vs sem. dernière" }: { current: number; previous: number; label?: string }) {
  if (previous === 0 && current === 0) return (
    <span className="text-xs text-muted-foreground font-sans">Stable {label}</span>
  );
  const delta = current - previous;
  const pct = previous === 0 ? 100 : Math.round((delta / previous) * 100);
  if (delta === 0) return (
    <span className="text-xs text-muted-foreground font-sans flex items-center gap-1">
      Stable {label}
    </span>
  );
  if (delta > 0) return (
    <span className="text-xs text-emerald-600 font-sans font-medium flex items-center gap-0.5">
      <TrendingUp className="h-3 w-3" />+{pct}% {label}
    </span>
  );
  return (
    <span className="text-xs text-destructive font-sans font-medium flex items-center gap-0.5">
      <TrendingDown className="h-3 w-3" />{pct}% {label}
    </span>
  );
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [upgradeModal, setUpgradeModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [profile, setProfile] = useState<{
    role?: string | null; plan?: string | null;
    licence_expiration?: string | null; prenom?: string | null;
    nom?: string | null; avatar_url?: string | null;
  } | null>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [showExpiryPopup, setShowExpiryPopup] = useState(false);
  const [expiryDaysLeft, setExpiryDaysLeft] = useState(0);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);
  const [todayPosts, setTodayPosts] = useState<TodayPost[]>([]);
  const [markingPublished, setMarkingPublished] = useState<string | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [unassignedCount, setUnassignedCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const check = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: prof } = await (supabase as any).from("users").select("*").eq("user_id", user.id).maybeSingle();
      setProfile(prof);
      if (!prof?.onboarding_completed) setShowOnboarding(true);

      if (prof?.licence_expiration && prof.role !== "freemium") {
        const expiry = new Date(prof.licence_expiration);
        const now = new Date();
        const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 0) {
          await supabase.from("users").update({ role: "freemium", updated_at: new Date().toISOString() }).eq("user_id", user.id);
          setProfile((prev) => prev ? { ...prev, role: "freemium" } : prev);
        } else {
          const dismissedAt = sessionStorage.getItem(LICENSE_EXPIRY_POPUP_KEY);
          if (daysLeft <= 30 && !dismissedAt) {
            setExpiryDaysLeft(daysLeft);
            setShowExpiryPopup(true);
          }
        }
      }
      setCheckingOnboarding(false);
    };
    check();
  }, [user]);

  // Alert: DM clients without assigned CM
  useEffect(() => {
    if (!user || !profile) return;
    const isDm = profile.role === "dm" || (typeof profile.role === "string" && profile.role.startsWith("agence"));
    if (!isDm) return;
    supabase
      .from("clients")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .select("id", { count: "exact", head: true } as any)
      .eq("user_id", user.id)
      .eq("statut", "actif")
      .is("assigned_cm", null)
      .then(({ count }) => setUnassignedCount(count ?? 0));
  }, [user, profile]);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      setStatsLoading(true);
      setStatsError(false);
      try {
        const now = new Date();
        const today = format(now, "yyyy-MM-dd");
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
        const prevWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        const prevWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        const monthStart = startOfMonth(now);

        const [clientsRes, postsRes, prevPostsRes, todayPostsRes, linksRes, invoicesRes] = await Promise.all([
          supabase.from("clients").select("id, created_at").eq("user_id", user.id).eq("statut", "actif"),
          supabase.from("posts").select("id, statut, date_publication")
            .eq("user_id", user.id)
            .gte("date_publication", weekStart.toISOString().split("T")[0])
            .lte("date_publication", weekEnd.toISOString().split("T")[0]),
          supabase.from("posts").select("id")
            .eq("user_id", user.id)
            .gte("date_publication", prevWeekStart.toISOString().split("T")[0])
            .lte("date_publication", prevWeekEnd.toISOString().split("T")[0]),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any).from("posts").select("id, reseau, date_publication, clients(nom)")
            .eq("user_id", user.id)
            .eq("statut", "programme_valide")
            .eq("date_publication", today),
          supabase.from("preview_links").select("id, expires_at").eq("user_id", user.id),
          supabase.from("documents").select("id, total")
            .eq("user_id", user.id).eq("type", "facture")
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
          postsLastWeek: (prevPostsRes.data ?? []).length,
          pendingLinks: links.filter((l) => l.expires_at && new Date(l.expires_at) > now).length,
          expiredLinks: links.filter((l) => l.expires_at && new Date(l.expires_at) <= now).length,
          unpaidInvoices: invoices.length,
          unpaidTotal: invoices.reduce((sum, d) => sum + Number(d.total ?? 0), 0),
        });

        const rawToday = (todayPostsRes.data ?? []) as Array<{
          id: string; reseau: string; date_publication: string;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          clients: any;
        }>;
        setTodayPosts(rawToday.map((p) => ({
          id: p.id,
          reseau: p.reseau,
          date_publication: p.date_publication,
          client_nom: p.clients?.nom ?? "Client",
        })));
      } catch {
        setStatsError(true);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  const retryStats = () => {
    if (!user) return;
    setStatsLoading(true);
    setStatsError(false);
    // Re-trigger the effect by creating a fresh fetch
    const fetchStats = async () => {
      try {
        const now = new Date();
        const today = format(now, "yyyy-MM-dd");
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
        const prevWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        const prevWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        const monthStart = startOfMonth(now);
        const [clientsRes, postsRes, prevPostsRes, todayPostsRes, linksRes, invoicesRes] = await Promise.all([
          supabase.from("clients").select("id, created_at").eq("user_id", user.id).eq("statut", "actif"),
          supabase.from("posts").select("id, statut, date_publication").eq("user_id", user.id).gte("date_publication", weekStart.toISOString().split("T")[0]).lte("date_publication", weekEnd.toISOString().split("T")[0]),
          supabase.from("posts").select("id").eq("user_id", user.id).gte("date_publication", prevWeekStart.toISOString().split("T")[0]).lte("date_publication", prevWeekEnd.toISOString().split("T")[0]),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any).from("posts").select("id, reseau, date_publication, clients(nom)").eq("user_id", user.id).eq("statut", "programme_valide").eq("date_publication", today),
          supabase.from("preview_links").select("id, expires_at").eq("user_id", user.id),
          supabase.from("documents").select("id, total").eq("user_id", user.id).eq("type", "facture").in("statut", ["envoye", "en_retard", "partiellement_paye"]),
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
          postsLastWeek: (prevPostsRes.data ?? []).length,
          pendingLinks: links.filter((l) => l.expires_at && new Date(l.expires_at) > now).length,
          expiredLinks: links.filter((l) => l.expires_at && new Date(l.expires_at) <= now).length,
          unpaidInvoices: invoices.length,
          unpaidTotal: invoices.reduce((sum, d) => sum + Number(d.total ?? 0), 0),
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawToday = (todayPostsRes.data ?? []) as Array<{ id: string; reseau: string; date_publication: string; clients: any }>;
        setTodayPosts(rawToday.map((p) => ({ id: p.id, reseau: p.reseau, date_publication: p.date_publication, client_nom: p.clients?.nom ?? "Client" })));
      } catch {
        setStatsError(true);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  };

  useEffect(() => {
    if (!user) return;
    const fetchActivity = async () => {
      setActivityLoading(true);
      try {
        const { data } = await supabase
          .from("activity_logs")
          .select("id, action, type_action, detail, city, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(6);

        const items = (data ?? []).map((log) => ({
          id: log.id,
          action: formatActivityLabel(
            log.action,
            log.type_action,
            (log as { detail?: string | null }).detail ?? null,
            (log as { city?: string | null }).city ?? null,
          ),
          time: formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: fr }),
          icon: ACTIVITY_ICON_MAP[log.type_action] ?? Clock,
          color: ACTIVITY_COLOR_MAP[log.type_action] ?? "text-slate-400",
          bg: ACTIVITY_BG_MAP[log.type_action] ?? "bg-slate-100",
        }));
        setActivity(items);
      } catch {
        // Silent
      } finally {
        setActivityLoading(false);
      }
    };
    fetchActivity();
  }, [user]);

  const handleMarkPublished = async (postId: string) => {
    setMarkingPublished(postId);
    try {
      await supabase.from("posts").update({ statut: "publie" }).eq("id", postId);
      setTodayPosts((prev) => prev.filter((p) => p.id !== postId));
      if (stats) setStats({ ...stats, postsPublished: stats.postsPublished + 1 });
    } catch {
      // Silent
    } finally {
      setMarkingPublished(null);
    }
  };

  const { isFreemium } = getAccountAccess(profile);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : "Bonsoir";
  const prenom = profile?.prenom;

  // Hero card content
  const heroContent = (() => {
    if (hour < 12) return {
      icon: <CalendarCheck className="h-8 w-8 text-white/80" />,
      title: "Posts à publier aujourd'hui",
      value: statsLoading ? "…" : String(todayPosts.length),
      sub: todayPosts.length === 0 ? "Aucune publication prévue" : `${todayPosts.length} post${todayPosts.length > 1 ? "s" : ""} à traiter`,
      href: "/dashboard/calendrier",
    };
    if (hour < 18) return {
      icon: <Link2 className="h-8 w-8 text-white/80" />,
      title: "Liens en attente de validation",
      value: statsLoading ? "…" : String(stats?.pendingLinks ?? 0),
      sub: (stats?.pendingLinks ?? 0) === 0 ? "Aucun lien en attente" : `${stats?.pendingLinks} lien${(stats?.pendingLinks ?? 0) > 1 ? "s" : ""} client${(stats?.pendingLinks ?? 0) > 1 ? "s" : ""}`,
      href: "/dashboard/calendrier",
    };
    return {
      icon: <BarChart2 className="h-8 w-8 text-white/80" />,
      title: "Récap de la journée",
      value: statsLoading ? "…" : String(stats?.postsPublished ?? 0),
      sub: `Post${(stats?.postsPublished ?? 0) > 1 ? "s" : ""} publié${(stats?.postsPublished ?? 0) > 1 ? "s" : ""} aujourd'hui`,
      href: "/dashboard/rapports",
    };
  })();

  if (checkingOnboarding) return null;
  if (showOnboarding && profile) return <OnboardingWizard profile={profile} onComplete={() => setShowOnboarding(false)} />;

  return (
    <DashboardLayout pageTitle="Tableau de bord">
      <div className="animate-fade-in space-y-6">

        {/* ── Salutation ── */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 shrink-0">
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                {profile?.prenom?.[0]?.toUpperCase()}{profile?.nom?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight font-serif">
                {greeting}{prenom ? `, ${prenom}` : ""} 👋
              </h1>
              <p className="text-muted-foreground font-sans mt-1 text-sm">
                Voici votre activité du jour
              </p>
            </div>
          </div>
          <Button size="lg" onClick={() => navigate("/dashboard/clients")}>
            <Plus className="h-4 w-4" />
            Ajouter un client
          </Button>
        </div>

        {/* ── Alerte DM : clients sans CM ── */}
        {unassignedCount > 0 && (
          <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
            <p className="text-sm font-sans flex-1">
              <span className="font-semibold">{unassignedCount} client{unassignedCount > 1 ? "s" : ""}</span> sans Community Manager assigné
            </p>
            <Button size="sm" variant="outline" onClick={() => navigate("/dashboard/clients")}>
              <UserCheck className="h-4 w-4 mr-1.5" /> Assigner maintenant
            </Button>
          </div>
        )}

        {/* ── Hero card ── */}
        <div
          className="rounded-2xl p-6 text-white cursor-pointer select-none"
          style={{ background: "linear-gradient(135deg, #E8511A 0%, #C4522A 100%)" }}
          onClick={() => navigate(heroContent.href)}
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-white/70 text-sm font-sans font-medium uppercase tracking-wider">
                {hour < 12 ? "Ce matin" : hour < 18 ? "Cet après-midi" : "Ce soir"}
              </p>
              <p className="text-4xl font-bold font-serif">{heroContent.value}</p>
              <p className="text-white/90 font-sans text-sm">{heroContent.title}</p>
              <p className="text-white/60 font-sans text-xs">{heroContent.sub}</p>
            </div>
            <div className="flex flex-col items-end gap-4">
              {heroContent.icon}
              <Button
                size="sm"
                className="bg-white text-orange-700 hover:bg-white/90 font-semibold shadow-none"
                onClick={(e) => { e.stopPropagation(); navigate(heroContent.href); }}
              >
                Voir →
              </Button>
            </div>
          </div>
        </div>

        {/* ── KPI Stats grid ── */}
        {statsError && (
          <div className="flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-destructive font-sans">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Erreur de chargement des statistiques
            </div>
            <Button size="sm" variant="outline" onClick={retryStats} className="text-xs">
              Réessayer
            </Button>
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-fade-in-up">
          {/* Clients actifs */}
          <GlassCard>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium font-sans text-muted-foreground">Clients actifs</CardTitle>
              <div className="h-8 w-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Users className="h-4 w-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              {statsLoading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : statsError ? (
                <div className="flex items-center gap-1.5 text-xs text-destructive font-sans">
                  <AlertCircle className="h-3.5 w-3.5" /> Erreur de chargement
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold font-serif">{stats?.activeClients ?? 0}</div>
                  <div className="mt-1">
                    {isFreemium ? (
                      <div className="flex items-center gap-1">
                        <Badge variant="warning" className="text-[10px]">{stats?.activeClients ?? 0}/2</Badge>
                        <span className="text-xs text-muted-foreground font-sans">limite Découverte</span>
                      </div>
                    ) : (stats?.clientsThisMonth ?? 0) > 0 ? (
                      <span className="text-xs text-emerald-600 font-sans font-medium flex items-center gap-0.5">
                        <ArrowUpRight className="h-3 w-3" />+{stats?.clientsThisMonth} ce mois
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground font-sans">Stable ce mois</span>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </GlassCard>

          {/* Posts cette semaine */}
          <GlassCard>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium font-sans text-muted-foreground">Posts cette semaine</CardTitle>
              <div className="h-8 w-8 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <FileText className="h-4 w-4 text-violet-600" />
              </div>
            </CardHeader>
            <CardContent>
              {statsLoading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : statsError ? (
                <div className="flex items-center gap-1.5 text-xs text-destructive font-sans">
                  <AlertCircle className="h-3.5 w-3.5" /> Erreur de chargement
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold font-serif">{stats?.postsThisWeek ?? 0}</div>
                  <div className="mt-1">
                    <DeltaBadge current={stats?.postsThisWeek ?? 0} previous={stats?.postsLastWeek ?? 0} />
                  </div>
                </>
              )}
            </CardContent>
          </GlassCard>

          {/* Liens en attente */}
          <GlassCard>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium font-sans text-muted-foreground">Liens en attente</CardTitle>
              <div className="h-8 w-8 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Link2 className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              {statsLoading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : statsError ? (
                <div className="flex items-center gap-1.5 text-xs text-destructive font-sans">
                  <AlertCircle className="h-3.5 w-3.5" /> Erreur de chargement
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold font-serif">{stats?.pendingLinks ?? 0}</div>
                  <div className="mt-1">
                    {(stats?.expiredLinks ?? 0) > 0 ? (
                      <span className="text-xs text-warning font-sans font-medium flex items-center gap-0.5">
                        <AlertTriangle className="h-3 w-3" />{stats?.expiredLinks} expirés
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground font-sans">Aucun lien expiré</span>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </GlassCard>

          {/* Factures impayées */}
          <GlassCard
            className={isFreemium ? "opacity-60 cursor-pointer" : ""}
            onClick={() => isFreemium && setUpgradeModal(true)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium font-sans text-muted-foreground flex items-center gap-1.5">
                Factures impayées
                {isFreemium && <Lock className="h-3 w-3" />}
              </CardTitle>
              <div className="h-8 w-8 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Receipt className="h-4 w-4 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              {isFreemium ? (
                <div className="space-y-1">
                  <div className="text-3xl font-bold font-serif text-muted-foreground">-</div>
                  <Badge variant="outline" className="text-[10px]">
                    <Lock className="h-2.5 w-2.5 mr-1" />Pro uniquement
                  </Badge>
                </div>
              ) : statsLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : statsError ? (
                <div className="flex items-center gap-1.5 text-xs text-destructive font-sans">
                  <AlertCircle className="h-3.5 w-3.5" /> Erreur de chargement
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold font-serif">{stats?.unpaidInvoices ?? 0}</div>
                  <div className="mt-1">
                    {(stats?.unpaidTotal ?? 0) > 0 ? (
                      <span className="text-xs text-destructive font-sans font-medium">
                        {formatFCFA(stats?.unpaidTotal ?? 0)}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground font-sans">Aucun impayé</span>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </GlassCard>
        </div>

        {/* ── À publier aujourd'hui ── */}
        <GlassCard>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-primary" />
              À publier aujourd'hui
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate("/dashboard/calendrier")}>
              Voir calendrier →
            </Button>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : todayPosts.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground font-sans">Aucune publication prévue aujourd'hui 🎉</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todayPosts.map((post) => (
                  <div key={post.id} className="flex items-center gap-3 py-2 px-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                    <div className="h-7 w-7 rounded-lg bg-background flex items-center justify-center text-muted-foreground border border-border">
                      {RESEAU_ICONS[post.reseau] ?? <FileText className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium font-sans truncate">{post.client_nom}</p>
                      <p className="text-xs text-muted-foreground font-sans">
                        {format(new Date(post.date_publication + "T00:00:00"), "HH:mm", { locale: fr })} · {post.reseau}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs shrink-0"
                      disabled={markingPublished === post.id}
                      onClick={() => handleMarkPublished(post.id)}
                    >
                      {markingPublished === post.id
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <><CheckCircle2 className="h-3 w-3" /> Publié</>
                      }
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </GlassCard>

        {/* ── Activité récente ── */}
        <GlassCard>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Activité récente</CardTitle>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : activity.length === 0 ? (
              <p className="text-sm text-muted-foreground font-sans text-center py-6">Aucune activité récente.</p>
            ) : (
              <div className="space-y-1">
                {activity.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${item.bg}`}>
                      <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                    </div>
                    <span className="text-sm font-sans flex-1 leading-snug">{item.action}</span>
                    <span className="text-xs text-muted-foreground font-sans whitespace-nowrap">{item.time}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </GlassCard>
      </div>

      <ProUpgradeModal open={upgradeModal} onOpenChange={setUpgradeModal} featureName="Facturation" />

      <Dialog
        open={showExpiryPopup}
        onOpenChange={(v) => {
          if (!v) sessionStorage.setItem(LICENSE_EXPIRY_POPUP_KEY, "1");
          setShowExpiryPopup(v);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {expiryDaysLeft <= 0 ? "Licence expirée" : "Licence bientôt expirée"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm font-sans text-muted-foreground">
            {expiryDaysLeft <= 0
              ? "Votre licence a expiré. Vous êtes repassé en mode Découverte."
              : `Il vous reste ${expiryDaysLeft} jour${expiryDaysLeft > 1 ? "s" : ""} avant l'expiration de votre licence.`}
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => { sessionStorage.setItem(LICENSE_EXPIRY_POPUP_KEY, "1"); setShowExpiryPopup(false); }}>
              Plus tard
            </Button>
            <Button size="sm" onClick={() => { sessionStorage.setItem(LICENSE_EXPIRY_POPUP_KEY, "1"); setShowExpiryPopup(false); window.location.href = "/dashboard/parametres?tab=licence"; }}>
              Activer une clé
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Dashboard;
