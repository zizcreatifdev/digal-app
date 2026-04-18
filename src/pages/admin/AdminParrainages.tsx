import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Users2, Loader2, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PLAN_LABELS } from "@/lib/plan-labels";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface ReferralRow {
  id: string;
  referrer_id: string;
  referred_id: string;
  status: string;
  plan_referee: string | null;
  qualified_at: string | null;
  created_at: string;
}

interface QuotaRequest {
  id: string;
  user_id: string;
  requested_quota: number;
  status: string;
  created_at: string;
  auto_approve_at: string | null;
}

interface UserInfo {
  user_id: string;
  prenom: string;
  nom: string;
  email: string;
  referral_quota: number | null;
}

function minutesUntil(isoDate: string | null): number | null {
  if (!isoDate) return null;
  return Math.max(0, Math.ceil((new Date(isoDate).getTime() - Date.now()) / 60000));
}

export default function AdminParrainages() {
  const queryClient = useQueryClient();
  const [markingId, setMarkingId] = useState<string | null>(null);

  const { data: referrals, isLoading: refLoading } = useQuery({
    queryKey: ["admin-referrals-list"],
    queryFn: async () => {
      const { data } = await db.from("referrals")
        .select("id, referrer_id, referred_id, status, plan_referee, qualified_at, created_at")
        .order("created_at", { ascending: false });
      return (data ?? []) as ReferralRow[];
    },
  });

  const { data: quotaRequests, isLoading: quotaLoading } = useQuery({
    queryKey: ["admin-quota-requests"],
    queryFn: async () => {
      const { data } = await db.from("referral_quota_requests")
        .select("id, user_id, requested_quota, status, created_at, auto_approve_at")
        .order("created_at", { ascending: false })
        .limit(100);
      return (data ?? []) as QuotaRequest[];
    },
  });

  // Collect all user IDs from referrals
  const allUserIds = Array.from(new Set([
    ...(referrals ?? []).map((r) => r.referrer_id),
    ...(referrals ?? []).map((r) => r.referred_id),
    ...(quotaRequests ?? []).map((q) => q.user_id),
  ]));

  const { data: usersMap } = useQuery({
    queryKey: ["admin-parrainage-users", allUserIds],
    queryFn: async () => {
      if (allUserIds.length === 0) return {};
      const { data } = await db.from("users")
        .select("user_id, prenom, nom, email, referral_quota")
        .in("user_id", allUserIds);
      const map: Record<string, UserInfo> = {};
      for (const u of (data ?? []) as UserInfo[]) {
        map[u.user_id] = u;
      }
      return map;
    },
    enabled: allUserIds.length > 0,
  });

  const markRewarded = useMutation({
    mutationFn: async (refId: string) => {
      setMarkingId(refId);
      const { error } = await db.from("referrals")
        .update({ status: "rewarded" })
        .eq("id", refId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-referrals-list"] });
      toast.success("Filleul marqué comme récompensé");
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
    onSettled: () => setMarkingId(null),
  });

  const approveQuota = useMutation({
    mutationFn: async ({ reqId, userId, requested }: { reqId: string; userId: string; requested: number }) => {
      const { data: userRow } = await db.from("users").select("referral_quota").eq("user_id", userId).maybeSingle();
      const newQuota = (userRow?.referral_quota ?? 3) + requested;
      await db.from("users").update({ referral_quota: newQuota }).eq("user_id", userId);
      await db.from("referral_quota_requests")
        .update({ status: "approved", reviewed_at: new Date().toISOString() })
        .eq("id", reqId);
      await supabase.from("notifications").insert({
        user_id: userId,
        titre: "Invitations disponibles",
        message: `Vos ${requested} invitations supplémentaires sont maintenant disponibles !`,
        type: "info",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quota-requests"] });
      toast.success("Demande approuvée");
    },
    onError: () => toast.error("Erreur lors de l'approbation"),
  });

  const rejectQuota = useMutation({
    mutationFn: async (reqId: string) => {
      await db.from("referral_quota_requests")
        .update({ status: "rejected", reviewed_at: new Date().toISOString() })
        .eq("id", reqId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quota-requests"] });
      toast.success("Demande rejetée");
    },
    onError: () => toast.error("Erreur lors du rejet"),
  });

  const getUser = (id: string) => usersMap?.[id];

  const getStatusBadge = (status: string) => {
    if (status === "rewarded") return <Badge className="bg-emerald-100 text-emerald-700 text-xs">Récompensé ✅</Badge>;
    if (status === "qualified") return <Badge className="bg-blue-100 text-blue-700 text-xs">Qualifié</Badge>;
    return <Badge variant="outline" className="text-xs text-muted-foreground">En attente</Badge>;
  };

  const getQuotaStatusBadge = (status: string) => {
    if (status === "approved") return <Badge className="bg-emerald-100 text-emerald-700 text-xs">Approuvé</Badge>;
    if (status === "rejected") return <Badge className="bg-red-100 text-red-700 text-xs">Rejeté</Badge>;
    return <Badge className="bg-amber-100 text-amber-700 text-xs">En attente</Badge>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users2 className="h-7 w-7 text-primary" /> Parrainages
          </h1>
          <p className="text-muted-foreground font-sans mt-1">
            Gestion des parrainages et demandes de quota
          </p>
        </div>

        <Tabs defaultValue="referrals">
          <TabsList>
            <TabsTrigger value="referrals" className="font-sans">
              Parrainages {referrals ? `(${referrals.length})` : ""}
            </TabsTrigger>
            <TabsTrigger value="quota" className="font-sans">
              Demandes quota {quotaRequests?.filter((q) => q.status === "pending").length ? `(${quotaRequests.filter((q) => q.status === "pending").length})` : ""}
            </TabsTrigger>
          </TabsList>

          {/* ── Tab 1: Parrainages ── */}
          <TabsContent value="referrals" className="mt-4">
            {refLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parrain</TableHead>
                        <TableHead>Filleul</TableHead>
                        <TableHead>Plan filleul</TableHead>
                        <TableHead>Date qualification</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(referrals ?? []).map((ref) => {
                        const referrer = getUser(ref.referrer_id);
                        const referred = getUser(ref.referred_id);
                        const planLabel = PLAN_LABELS[ref.plan_referee ?? ""] ?? ref.plan_referee ?? "—";
                        const isQualified = ref.status === "qualified";
                        return (
                          <TableRow key={ref.id}>
                            <TableCell>
                              <div className="text-sm font-sans">
                                <p className="font-medium">{referrer ? `${referrer.prenom} ${referrer.nom}` : ref.referrer_id.slice(0, 8)}</p>
                                <p className="text-xs text-muted-foreground">{referrer?.email ?? ""}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm font-sans">
                                <p className="font-medium">{referred ? `${referred.prenom} ${referred.nom}` : ref.referred_id.slice(0, 8)}</p>
                                <p className="text-xs text-muted-foreground">{referred?.email ?? ""}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">{planLabel}</Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground font-sans">
                              {ref.qualified_at
                                ? new Date(ref.qualified_at).toLocaleDateString("fr-FR")
                                : "—"}
                            </TableCell>
                            <TableCell>{getStatusBadge(ref.status)}</TableCell>
                            <TableCell className="text-right">
                              {isQualified && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs gap-1.5 h-7"
                                  disabled={markRewarded.isPending && markingId === ref.id}
                                  onClick={() => markRewarded.mutate(ref.id)}
                                >
                                  {markRewarded.isPending && markingId === ref.id
                                    ? <Loader2 className="h-3 w-3 animate-spin" />
                                    : <CheckCircle2 className="h-3 w-3" />}
                                  Marquer récompensé
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {(referrals ?? []).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground text-sm py-12 font-sans">
                            Aucun parrainage pour l'instant
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── Tab 2: Demandes quota ── */}
          <TabsContent value="quota" className="mt-4">
            {quotaLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Quota actuel</TableHead>
                        <TableHead>Quota demandé</TableHead>
                        <TableHead>Auto-approbation</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(quotaRequests ?? []).map((req) => {
                        const u = getUser(req.user_id);
                        const mins = minutesUntil(req.auto_approve_at);
                        const isPending = req.status === "pending";
                        return (
                          <TableRow key={req.id}>
                            <TableCell>
                              <div className="text-sm font-sans">
                                <p className="font-medium">{u ? `${u.prenom} ${u.nom}` : req.user_id.slice(0, 8)}</p>
                                <p className="text-xs text-muted-foreground">{u?.email ?? ""}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm font-sans">
                              {u?.referral_quota ?? "—"}
                            </TableCell>
                            <TableCell className="text-sm font-sans font-semibold text-primary">
                              +{req.requested_quota}
                            </TableCell>
                            <TableCell>
                              {isPending && mins !== null ? (
                                <div className="flex items-center gap-1.5 text-xs font-sans text-amber-700">
                                  <Clock className="h-3.5 w-3.5 shrink-0" />
                                  {mins > 0 ? `${mins} min` : "Maintenant"}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground font-sans">—</span>
                              )}
                            </TableCell>
                            <TableCell>{getQuotaStatusBadge(req.status)}</TableCell>
                            <TableCell className="text-right">
                              {isPending && (
                                <div className="flex gap-1.5 justify-end">
                                  <Button
                                    size="sm"
                                    className="text-xs h-7 gap-1 bg-emerald-600 hover:bg-emerald-700"
                                    disabled={approveQuota.isPending}
                                    onClick={() => approveQuota.mutate({ reqId: req.id, userId: req.user_id, requested: req.requested_quota })}
                                  >
                                    {approveQuota.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                                    Approuver
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-7 gap-1 text-destructive border-destructive/30"
                                    disabled={rejectQuota.isPending}
                                    onClick={() => rejectQuota.mutate(req.id)}
                                  >
                                    {rejectQuota.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                                    Rejeter
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {(quotaRequests ?? []).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground text-sm py-12 font-sans">
                            Aucune demande de quota
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
