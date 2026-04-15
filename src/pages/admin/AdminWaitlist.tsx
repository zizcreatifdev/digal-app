import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle, Copy, RefreshCw } from "lucide-react";
import { toast } from "@/components/ui/sonner";

/* ─── Types ─────────────────────────────────────────────── */

interface WaitlistEntry {
  id: string;
  prenom: string | null;
  nom: string | null;
  email: string;
  type_compte: string | null;
  statut: string | null;
  created_at: string;
}

interface TokenInfo {
  token: string;
  email: string;
  expires_at: string;
  is_used: boolean;
  message_copied_at: string | null;
}

interface PlanConfig {
  plan_type: string;
  duree_mois: number;
  prix_fcfa: number;
  est_actif: boolean;
}

/* ─── Constants ─────────────────────────────────────────── */

const TYPE_LABELS: Record<string, string> = {
  solo: "Solo",
  agence: "Agence",
  agence_standard: "Agence Standard",
  agence_pro: "Agence Pro",
};

// Maps waitlist type_compte → plan_configs plan_type
const TYPE_COMPTE_TO_PLAN_TYPE: Record<string, string> = {
  solo: "solo",
  agence: "agence_standard",
  agence_standard: "agence_standard",
  agence_pro: "agence_pro",
};

/* ─── Component ─────────────────────────────────────────── */

export default function AdminWaitlist() {
  const queryClient = useQueryClient();
  // duration selected per entry (keyed by entry email)
  const [dureeParEmail, setDureeParEmail] = useState<Record<string, string>>({});

  const { data: entries, isLoading } = useQuery({
    queryKey: ["admin-waitlist"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("waitlist")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as WaitlistEntry[];
    },
  });

  // Fetch latest token per email
  const { data: tokensByEmail = {} } = useQuery({
    queryKey: ["admin-activation-tokens"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activation_tokens")
        .select("token, email, expires_at, is_used, message_copied_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const map: Record<string, TokenInfo> = {};
      for (const t of (data ?? []) as TokenInfo[]) {
        if (!map[t.email]) map[t.email] = t;
      }
      return map;
    },
  });

  // Load plan_configs for duration select (active only)
  const { data: planConfigs } = useQuery({
    queryKey: ["plan-configs"],
    queryFn: async () => {
      // plan_configs not yet in generated types — cast required
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("plan_configs")
        .select("plan_type, duree_mois, prix_fcfa, est_actif")
        .eq("est_actif", true)
        .order("duree_mois");
      if (error) throw error;
      return (data ?? []) as PlanConfig[];
    },
  });

  const getDurationsForEntry = (typeCompte: string | null) => {
    const planType = TYPE_COMPTE_TO_PLAN_TYPE[typeCompte ?? "solo"] ?? "solo";
    return (planConfigs ?? []).filter((c) => c.plan_type === planType);
  };

  const getSelectedConfig = (entry: WaitlistEntry): PlanConfig | undefined => {
    const duree = parseInt(dureeParEmail[entry.email] ?? "6");
    const planType = TYPE_COMPTE_TO_PLAN_TYPE[entry.type_compte ?? "solo"] ?? "solo";
    return (planConfigs ?? []).find((c) => c.plan_type === planType && c.duree_mois === duree);
  };

  const updateStatus = useMutation({
    mutationFn: async ({ id, statut, entry }: { id: string; statut: string; entry: WaitlistEntry }) => {
      const { error } = await supabase.from("waitlist").update({ statut }).eq("id", id);
      if (error) throw error;
      if (statut === "approuve") {
        const { error: tokenError } = await supabase
          .from("activation_tokens")
          .insert({
            email: entry.email,
            prenom: entry.prenom ?? "",
            nom: entry.nom ?? "",
            type_compte: entry.type_compte ?? "solo",
          });
        if (tokenError) console.warn("[waitlist] Token creation failed:", tokenError.message);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-waitlist"] });
      queryClient.invalidateQueries({ queryKey: ["admin-activation-tokens"] });
      if (variables.statut === "approuve") {
        toast.success("Approuvé, copiez le message d'activation");
      } else {
        toast.success("Statut mis à jour");
      }
    },
  });

  const copyMessage = useMutation({
    mutationFn: async ({
      entry,
      tokenInfo,
      duree,
      prix,
    }: {
      entry: WaitlistEntry;
      tokenInfo: TokenInfo;
      duree: number;
      prix: number;
    }) => {
      const typeLabel = TYPE_LABELS[entry.type_compte ?? ""] ?? (entry.type_compte ?? "Solo");
      const activationLink = `https://digal.vercel.app/activate/${tokenInfo.token}`;
      const prixLine = prix > 0 ? `Prix : ${prix.toLocaleString("fr-FR")} FCFA` : null;
      const message = [
        `Bonjour ${entry.prenom ?? ""} 👋`,
        "",
        `Votre accès Digal a été approuvé ! 🎉`,
        "",
        `Vous avez été sélectionné(e) parmi nos premiers utilisateurs, bienvenue dans la communauté.`,
        "",
        `Compte : ${typeLabel}`,
        `Durée : ${duree} mois`,
        ...(prixLine ? [prixLine] : []),
        `Lien d'activation (valable 48h) :`,
        activationLink,
        "",
        `Cliquez sur le lien pour créer votre mot de passe et accéder à votre espace Digal.`,
        "",
        `À très vite,`,
        `L'équipe Digal 🚀`,
      ].join("\n");

      await navigator.clipboard.writeText(message);

      await supabase
        .from("activation_tokens")
        .update({ message_copied_at: new Date().toISOString() })
        .eq("token", tokenInfo.token);
    },
    onSuccess: (_, { entry }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-activation-tokens"] });
      toast.success(`Message copié ! Envoyez-le à ${entry.prenom ?? entry.email}`);
    },
    onError: () => {
      toast.error("Impossible de copier dans le presse-papier");
    },
  });

  const regenerateToken = useMutation({
    mutationFn: async ({ entry }: { entry: WaitlistEntry }) => {
      const { error } = await supabase
        .from("activation_tokens")
        .insert({
          email: entry.email,
          prenom: entry.prenom ?? "",
          nom: entry.nom ?? "",
          type_compte: entry.type_compte ?? "solo",
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-activation-tokens"] });
      toast.success("Nouveau lien généré, copiez le message");
    },
    onError: () => {
      toast.error("Erreur lors de la génération du lien");
    },
  });

  const statusBadge = (statut: string | null) => {
    switch (statut) {
      case "approuve": return <Badge className="bg-emerald-100 text-emerald-700">Approuvé</Badge>;
      case "refuse": return <Badge className="bg-red-100 text-red-700">Refusé</Badge>;
      default: return <Badge className="bg-amber-100 text-amber-700">En attente</Badge>;
    }
  };

  const activationBadge = (tokenInfo: TokenInfo | undefined) => {
    if (!tokenInfo) return null;
    if (tokenInfo.is_used) return <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Compte activé</Badge>;
    if (new Date(tokenInfo.expires_at) < new Date()) return <Badge className="bg-red-100 text-red-700 text-[10px]">Lien expiré</Badge>;
    if (tokenInfo.message_copied_at) return <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Message envoyé</Badge>;
    return <Badge className="bg-amber-100 text-amber-700 text-[10px]">En attente d'envoi</Badge>;
  };

  const stats = {
    total: entries?.length ?? 0,
    enAttente: entries?.filter(e => e.statut === "en_attente").length ?? 0,
    approuve: entries?.filter(e => e.statut === "approuve").length ?? 0,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Liste d'attente</h1>

        <div className="grid grid-cols-3 gap-4">
          <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold font-serif">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold font-serif text-amber-600">{stats.enAttente}</p><p className="text-xs text-muted-foreground">En attente</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold font-serif text-emerald-600">{stats.approuve}</p><p className="text-xs text-muted-foreground">Approuvés</p></CardContent></Card>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries?.map((e) => {
                    const tokenInfo = tokensByEmail[e.email];
                    const tokenExpired = tokenInfo && !tokenInfo.is_used && new Date(tokenInfo.expires_at) < new Date();
                    const canCopy = tokenInfo && !tokenInfo.is_used && !tokenExpired;
                    const needsRegenerate = e.statut === "approuve" && (!tokenInfo || tokenExpired);
                    const durations = getDurationsForEntry(e.type_compte);
                    const selectedConfig = getSelectedConfig(e);

                    return (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{e.prenom} {e.nom}</TableCell>
                        <TableCell className="text-sm">{e.email}</TableCell>
                        <TableCell><Badge variant="outline">{e.type_compte ?? "solo"}</Badge></TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 items-start">
                            {statusBadge(e.statut)}
                            {e.statut === "approuve" && activationBadge(tokenInfo)}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(e.created_at).toLocaleDateString("fr-FR")}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap items-center">
                            {e.statut === "en_attente" && (
                              <>
                                <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ id: e.id, statut: "approuve", entry: e })} disabled={updateStatus.isPending}>
                                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ id: e.id, statut: "refuse", entry: e })} disabled={updateStatus.isPending}>
                                  <XCircle className="h-4 w-4 text-red-500" />
                                </Button>
                              </>
                            )}
                            {canCopy && durations.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Select
                                  value={dureeParEmail[e.email] ?? "6"}
                                  onValueChange={(v) =>
                                    setDureeParEmail((prev) => ({ ...prev, [e.email]: v }))
                                  }
                                >
                                  <SelectTrigger className="h-7 w-24 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {durations.map((c) => (
                                      <SelectItem key={c.duree_mois} value={String(c.duree_mois)}>
                                        {c.duree_mois} mois
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-7 gap-1"
                                  onClick={() =>
                                    copyMessage.mutate({
                                      entry: e,
                                      tokenInfo: tokenInfo!,
                                      duree: parseInt(dureeParEmail[e.email] ?? "6"),
                                      prix: selectedConfig?.prix_fcfa ?? 0,
                                    })
                                  }
                                  disabled={copyMessage.isPending}
                                >
                                  <Copy className="h-3 w-3" />
                                  Copier
                                </Button>
                              </div>
                            )}
                            {canCopy && durations.length === 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-7 gap-1"
                                onClick={() =>
                                  copyMessage.mutate({
                                    entry: e,
                                    tokenInfo: tokenInfo!,
                                    duree: 6,
                                    prix: 0,
                                  })
                                }
                                disabled={copyMessage.isPending}
                              >
                                <Copy className="h-3 w-3" />
                                Copier
                              </Button>
                            )}
                            {needsRegenerate && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-7 gap-1"
                                onClick={() => regenerateToken.mutate({ entry: e })}
                                disabled={regenerateToken.isPending}
                              >
                                <RefreshCw className="h-3 w-3" />
                                {tokenInfo ? "Regénérer" : "Générer lien"}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {entries?.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-12">Aucune inscription</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
