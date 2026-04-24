import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Copy, MessageCircle, Gift, Award, Users2, Loader2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { requestQuota } from "@/lib/referrals";
import { PLAN_LABELS } from "@/lib/plan-labels";
import { usePageTitle } from "@/hooks/usePageTitle";

class RenderErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <DashboardLayout>
          <div className="p-6 rounded-lg bg-destructive/10 border border-destructive text-destructive font-mono text-sm space-y-2">
            <p className="font-bold">Erreur de rendu :</p>
            <p>{this.state.error.message}</p>
            <pre className="text-xs overflow-auto whitespace-pre-wrap">{this.state.error.stack}</pre>
          </div>
        </DashboardLayout>
      );
    }
    return this.props.children;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

const APP_URL = window.location.origin;

interface ReferralRow {
  id: string;
  referee_id: string;
  status: string;
  qualified_at: string | null;
  created_at: string;
  plan_referee: string | null;
}

interface ReferredUser {
  user_id: string;
  prenom: string;
  nom: string;
  role: string;
  plan: string | null;
  created_at: string;
}

export default function Parrainages() {
  usePageTitle("Digal · Parrainages");
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [copyPending, setCopyPending] = useState(false);


  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["parrainage-profile", user?.id],
    queryFn: async () => {
      // Try full query with referral columns first
      const { data, error } = await db
        .from("users")
        .select("user_id, prenom, nom, role, referral_code, referral_quota, referral_count, referral_months_earned, referral_months_used")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) {
        // Referral columns may not be migrated yet — fallback to basic query
        const { data: basic } = await supabase
          .from("users")
          .select("user_id, prenom, nom, role")
          .eq("user_id", user!.id)
          .maybeSingle();
        return basic;
      }
      return data;
    },
    enabled: !!user,
  });

  const { data: referrals } = useQuery({
    queryKey: ["parrainage-referrals", user?.id],
    queryFn: async () => {
      const { data } = await db
        .from("referrals")
        .select("id, referee_id, status, qualified_at, created_at, plan_referee")
        .eq("referrer_id", user!.id)
        .order("created_at", { ascending: false });
      return (data ?? []) as ReferralRow[];
    },
    enabled: !!user,
  });

  const { data: referredUsers } = useQuery({
    queryKey: ["parrainage-referred-users", referrals?.map((r) => r.referee_id)],
    queryFn: async () => {
      const ids = (referrals ?? []).map((r) => r.referee_id);
      if (ids.length === 0) return [];
      const { data } = await db
        .from("users")
        .select("user_id, prenom, nom, role, plan, created_at")
        .in("user_id", ids);
      return (data ?? []) as ReferredUser[];
    },
    enabled: (referrals?.length ?? 0) > 0,
  });

  const { data: pendingQuotaRequest } = useQuery({
    queryKey: ["parrainage-quota-request", user?.id],
    queryFn: async () => {
      const { data } = await db
        .from("referral_quota_requests")
        .select("id, created_at, auto_approve_at")
        .eq("user_id", user!.id)
        .eq("statut", "en_attente")
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: tiers } = useQuery({
    queryKey: ["referral-tiers"],
    queryFn: async (): Promise<Record<string, number>> => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "referral_tiers")
        .maybeSingle();
      if (!data?.value) return {};

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = data.value as any;
      let parsed: unknown;
      if (typeof raw === "object") {
        parsed = raw;
      } else {
        try { parsed = JSON.parse(raw as string); }
        catch { return {}; }
      }

      // Array format: [{count, months}, ...]
      if (Array.isArray(parsed)) {
        const result: Record<string, number> = {};
        for (const tier of parsed as { count?: unknown; months?: unknown }[]) {
          if (tier?.count != null && tier?.months != null) {
            result[String(tier.count)] = Number(tier.months);
          }
        }
        return result;
      }

      // Object format: {"3": 1} or {"3": {count, months}}
      if (parsed && typeof parsed === "object") {
        const result: Record<string, number> = {};
        for (const [key, val] of Object.entries(parsed as Record<string, unknown>)) {
          if (typeof val === "number") {
            result[key] = val;
          } else if (val && typeof val === "object" && "months" in val) {
            result[key] = Number((val as { months: unknown }).months);
          }
        }
        return result;
      }

      return {};
    },
  });

  const { data: waTemplate } = useQuery({
    queryKey: ["referral-wa-template"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "referral_whatsapp_template")
        .maybeSingle();
      return (data?.value as string) ?? "Bonjour ! Je t'invite à essayer Digal, la plateforme pour les Community Managers et agences au Sénégal. Rejoins-moi ici : [Lien]";
    },
  });

  const requestQuotaMut = useMutation({
    mutationFn: () => requestQuota(user!.id),
    onSuccess: (result) => {
      if (result.error) { toast.error(result.error); return; }
      toast.success("Demande envoyée ! Vos invitations seront disponibles dans ~1h");
      queryClient.invalidateQueries({ queryKey: ["parrainage-quota-request", user?.id] });
    },
  });

  if (profileLoading || (!profile && !profileLoading && user)) {
    if (!profileLoading && !profile) {
      return (
        <DashboardLayout>
          <div className="p-6 text-sm text-muted-foreground font-sans space-y-2">
            <p className="font-semibold text-destructive">Profil introuvable.</p>
            <p>Impossible de charger votre profil. Vérifiez votre connexion ou reconnectez-vous.</p>
            <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
              Réessayer
            </Button>
          </div>
        </DashboardLayout>
      );
    }
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const referralCode: string = profile.referral_code ?? "";
  const referralLink = `${APP_URL}/ref/${referralCode}`;
  const quota: number = profile.referral_quota ?? 3;
  const quotaUsed: number = profile.referral_count ?? 0;
  const monthsEarned: number = profile.referral_months_earned ?? 0;
  const monthsUsed: number = profile.referral_months_used ?? 0;
  const monthsStock: number = monthsEarned - monthsUsed;
  const isFreemium = profile.role === "freemium";
  const qualifiedCount = (referrals ?? []).filter((r) => r.status === "qualified" || r.status === "rewarded").length;

  // Next tier calculation — tiers is always Record<string, number> after normalization
  const tierKeys = Object.keys(tiers ?? {}).map(Number).filter(Boolean).sort((a, b) => a - b);
  const nextTierCount = tierKeys.find((k) => k > qualifiedCount);
  const nextTierMonths: number | null = nextTierCount != null
    ? (Number((tiers ?? {})[String(nextTierCount)]) || null)
    : null;
  const remaining: number | null = nextTierCount != null ? nextTierCount - qualifiedCount : null;

  const copyLink = async () => {
    setCopyPending(true);
    try { await navigator.clipboard.writeText(referralLink); toast.success("Lien copié !"); }
    catch { toast.error("Impossible de copier"); }
    setCopyPending(false);
  };

  const shareWhatsApp = () => {
    const template = (waTemplate ?? "").replace("[Prénom parrain]", profile.prenom ?? "").replace("[Lien]", referralLink);
    window.open(`https://wa.me/?text=${encodeURIComponent(template)}`, "_blank");
  };

  const getReferredUser = (refereeId: string) => (referredUsers ?? []).find((u) => u.user_id === refereeId);

  const minutesUntilApprove = pendingQuotaRequest?.auto_approve_at
    ? Math.max(0, Math.ceil((new Date(pendingQuotaRequest.auto_approve_at).getTime() - Date.now()) / 60000))
    : null;

  return (
    <RenderErrorBoundary>
    <DashboardLayout>
      <div className="animate-fade-in space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold font-serif flex items-center gap-2">
            <Users2 className="h-6 w-6 text-primary" /> Parrainages
          </h1>
          <p className="text-muted-foreground font-sans text-sm mt-1">
            Invitez vos collègues et gagnez des mois gratuits
          </p>
        </div>

        {/* Lien de parrainage */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-base flex items-center gap-2">
              <Gift className="h-4 w-4 text-primary" />
              Invitez vos collègues, gagnez des mois gratuits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted border border-border">
              <span className="flex-1 text-sm font-mono text-muted-foreground truncate">{referralLink}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyLink} disabled={copyPending} className="gap-1.5">
                <Copy className="h-3.5 w-3.5" /> Copier le lien
              </Button>
              <Button variant="outline" size="sm" onClick={shareWhatsApp} className="gap-1.5 text-emerald-600 border-emerald-300 hover:bg-emerald-50">
                <MessageCircle className="h-3.5 w-3.5" /> Partager WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Progression */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-base flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" /> Progression
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-sans">
                <span>Invitations utilisées</span>
                <span className="font-semibold">{quotaUsed} / {quota}</span>
              </div>
              <Progress value={quota > 0 ? (quotaUsed / quota) * 100 : 0} className="h-2" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted">
                <p className="text-2xl font-bold font-serif text-primary">{qualifiedCount}</p>
                <p className="text-xs text-muted-foreground font-sans mt-1">Filleuls payants</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted">
                <p className="text-2xl font-bold font-serif text-emerald-600">{monthsEarned}</p>
                <p className="text-xs text-muted-foreground font-sans mt-1">Mois gagnés</p>
              </div>
              {isFreemium && (
                <div className="text-center p-3 rounded-lg bg-muted">
                  <p className="text-2xl font-bold font-serif text-blue-600">{monthsStock}</p>
                  <p className="text-xs text-muted-foreground font-sans mt-1">Mois en stock</p>
                </div>
              )}
              <div className="text-center p-3 rounded-lg bg-muted">
                <p className="text-2xl font-bold font-serif text-muted-foreground">{monthsUsed}</p>
                <p className="text-xs text-muted-foreground font-sans mt-1">Mois utilisés</p>
              </div>
            </div>

            {nextTierCount != null && remaining != null && nextTierMonths != null && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm font-sans">
                <span className="font-semibold text-primary">Prochain palier :</span>{" "}
                encore <strong>{remaining}</strong> filleul{remaining > 1 ? "s" : ""} payant{remaining > 1 ? "s" : ""} → <strong>{nextTierMonths} mois offert{nextTierMonths > 1 ? "s" : ""}</strong>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mes filleuls */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-base">Mes filleuls</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {(referrals ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8 font-sans">
                Aucun filleul pour l&apos;instant. Partagez votre lien !
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Filleul</TableHead>
                    <TableHead>Inscription</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(referrals ?? []).map((ref) => {
                    const ru = getReferredUser(ref.referee_id);
                    const initials = ru ? (ru.prenom[0] + ru.nom[0]).toUpperCase() : "?";
                    const planLabel = PLAN_LABELS[ru?.role ?? ""] ?? ru?.role ?? "—";
                    const isQualified = ref.status === "qualified" || ref.status === "rewarded";
                    return (
                      <TableRow key={ref.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                              {initials}
                            </div>
                            <span className="text-sm font-sans">{ru ? `${ru.prenom} ${ru.nom}` : ref.referee_id.slice(0, 8)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-sans">
                          {ru ? new Date(ru.created_at).toLocaleDateString("fr-FR") : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{planLabel}</Badge>
                        </TableCell>
                        <TableCell>
                          {isQualified
                            ? <Badge className="bg-success/10 text-success text-xs">Qualifié ✅</Badge>
                            : <Badge variant="outline" className="text-xs text-muted-foreground">En attente</Badge>
                          }
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Demande quota */}
        {quotaUsed >= quota && (
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-base">Invitations supplémentaires</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground font-sans">
                Vous avez utilisé toutes vos invitations ({quotaUsed}/{quota}).
              </p>
              {pendingQuotaRequest ? (
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 font-sans">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span>Demande en cours… Disponible dans ~{minutesUntilApprove ?? 0} minutes</span>
                </div>
              ) : (
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => requestQuotaMut.mutate()}
                  disabled={requestQuotaMut.isPending}
                >
                  {requestQuotaMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Users2 className="h-3.5 w-3.5" />}
                  Demander 3 invitations supplémentaires →
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Navigate shortcut */}
        <div className="text-center">
          <Button variant="link" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate("/dashboard")}>
            ← Retour au tableau de bord
          </Button>
        </div>
      </div>
    </DashboardLayout>
    </RenderErrorBoundary>
  );
}
