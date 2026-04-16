import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activity-logs";
import {
  Loader2, Eye, KeyRound, Users, Briefcase, FileText,
  Calendar, BarChart3, Activity, ShieldOff, Trash2, Download, DollarSign, UserPlus, X,
  CreditCard, Receipt, PauseCircle, CheckCircle2,
} from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/sonner";

const createAccountSchema = z.object({
  prenom: z.string().min(1, "Prénom requis"),
  nom: z.string().min(1, "Nom requis"),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Minimum 8 caractères"),
  confirmPassword: z.string().min(1, "Confirmation requise"),
  type_compte: z.enum(["solo", "agence"]),
  plan: z.enum(["freemium", "solo_standard", "agence_standard", "agence_pro"]),
  agence_nom: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type CreateAccountForm = z.infer<typeof createAccountSchema>;

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  prenom: string;
  nom: string;
  role: string;
  plan: string | null;
  licence_expiration: string | null;
  created_at: string;
  agence_nom: string | null;
}

interface AccountDetail {
  clients: { id: string; nom: string; statut: string }[];
  clientsActifs: number;
  postsCount: number;
  previewLinksCount: number;
  facturesMoisTotal: number;
  lastActivity: string | null;
}

interface AccountFinancial {
  caFacture: number;
  caEncaisse: number;
  depenses: number;
  masseSalariale: number;
}

interface PlanConfig {
  plan_type: string;
  duree_mois: number;
  prix_fcfa: number;
  est_actif: boolean;
}

/* ─── Constants ──────────────────────────────────────────── */

const PLAN_LABELS: Record<string, string> = {
  freemium: "Découverte",
  solo: "CM Pro",
  agence_standard: "Studio",
  agence_pro: "Elite",
};

const METHODE_LABELS = ["Wave", "Orange Money", "YAS", "Virement", "Cash"];

function formatRelativeTime(date: Date | null): { text: string; isOld: boolean } {
  if (!date) return { text: "Jamais", isOld: true };
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  let text: string;
  if (diffHours < 1) text = "Il y a moins d'1h";
  else if (diffHours < 24) text = `Il y a ${diffHours}h`;
  else if (diffDays === 1) text = "Il y a 1 jour";
  else text = `Il y a ${diffDays} jours`;
  return { text, isOld: diffDays >= 30 };
}

const FILTER_LABELS: Record<string, string> = {
  inactive7: "Inactifs 7 jours",
  inactive30: "Inactifs 30 jours",
  never: "Jamais connectés",
  hot: "Prospects chauds",
};

export default function AdminComptes() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const filterParam = searchParams.get("filter");
  const [selected, setSelected] = useState<UserProfile | null>(null);
  const [detail, setDetail] = useState<AccountDetail | null>(null);
  const [financial, setFinancial] = useState<AccountFinancial | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingFinancial, setLoadingFinancial] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  // Plan change 3-step flow
  const [planNewPlan, setPlanNewPlan] = useState("freemium");
  const [planNewDuree, setPlanNewDuree] = useState(6);
  const [planStep, setPlanStep] = useState<0 | 1 | 2>(0);
  const [planInvoiceId, setPlanInvoiceId] = useState<string | null>(null);
  const [planInvoiceNumero, setPlanInvoiceNumero] = useState<string | null>(null);
  const [planPayMethod, setPlanPayMethod] = useState("Wave");
  const [planPayRef, setPlanPayRef] = useState("");
  // Danger zone
  const [deleteInput, setDeleteInput] = useState("");

  const createForm = useForm<CreateAccountForm>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: { type_compte: "solo", plan: "freemium" },
  });

  const createAccount = useMutation({
    mutationFn: async (values: CreateAccountForm) => {
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: {
          prenom: values.prenom,
          nom: values.nom,
          email: values.email,
          password: values.password,
          plan: values.plan,
          agence_nom: values.agence_nom || undefined,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-comptes"] });
      toast.success("Compte créé avec succès");
      setCreateOpen(false);
      createForm.reset({ type_compte: "solo", plan: "freemium" });
    },
    onError: (err: Error) => toast.error(err.message ?? "Erreur lors de la création"),
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-comptes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as UserProfile[];
    },
  });

  // Last login map (shared query key with AdminDashboard)
  const { data: lastLoginMap } = useQuery({
    queryKey: ["admin-last-logins"],
    queryFn: async () => {
      const { data } = await supabase
        .from("activity_logs")
        .select("user_id, created_at")
        .eq("type_action", "auth")
        .eq("action", "login_success")
        .order("created_at", { ascending: false })
        .limit(5000);
      const map: Record<string, Date> = {};
      for (const log of data ?? []) {
        if (!map[log.user_id]) map[log.user_id] = new Date(log.created_at);
      }
      return map;
    },
    staleTime: 60_000,
  });

  // Plan configs (for plan change flow)
  const { data: planConfigs } = useQuery<PlanConfig[]>({
    queryKey: ["plan-configs-admin"],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("plan_configs")
        .select("plan_type, duree_mois, prix_fcfa, est_actif")
        .eq("est_actif", true)
        .order("duree_mois");
      if (error) throw error;
      return (data ?? []) as PlanConfig[];
    },
    staleTime: 5 * 60_000,
  });

  // Filtered users based on URL param
  const filteredUsers = (() => {
    if (!users || !filterParam || !lastLoginMap) return users;
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return users.filter((u) => {
      const lastLogin = lastLoginMap[u.user_id] ?? null;
      const activationDate = new Date(u.created_at);
      if (filterParam === "inactive7") return lastLogin ? lastLogin < sevenDaysAgo : false;
      if (filterParam === "inactive30") return lastLogin ? lastLogin < thirtyDaysAgo : false;
      if (filterParam === "never") return !lastLogin;
      if (filterParam === "hot") return u.role === "freemium" && activationDate < thirtyDaysAgo && !!lastLogin;
      return true;
    });
  })();

  const updateUser = useMutation({
    mutationFn: async (updates: { id: string } & Partial<Omit<UserProfile, "id">>) => {
      const { id, ...rest } = updates;
      const { error } = await supabase.from("users").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-comptes"] });
      toast.success("Compte mis à jour");
    },
  });

  const openDetail = async (u: UserProfile) => {
    setSelected(u);
    setLoadingDetail(true);
    setDetail(null);
    setFinancial(null);
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const [clientsRes, postsRes, previewRes, facturesRes, logsRes] = await Promise.all([
        supabase.from("clients").select("id, nom, statut").eq("user_id", u.user_id),
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("user_id", u.user_id),
        supabase.from("preview_links").select("id", { count: "exact", head: true }).eq("user_id", u.user_id),
        supabase.from("documents").select("total").eq("user_id", u.user_id).eq("type", "facture").gte("created_at", monthStart),
        supabase.from("activity_logs").select("created_at").eq("user_id", u.user_id).order("created_at", { ascending: false }).limit(1),
      ]);
      const allClients = (clientsRes.data ?? []) as { id: string; nom: string; statut: string }[];
      setDetail({
        clients: allClients,
        clientsActifs: allClients.filter((c) => c.statut === "actif").length,
        postsCount: postsRes.count ?? 0,
        previewLinksCount: previewRes.count ?? 0,
        facturesMoisTotal: (facturesRes.data ?? []).reduce((s, d) => s + (d.total ?? 0), 0),
        lastActivity: logsRes.data?.[0]?.created_at ?? null,
      });
    } catch {
      toast.error("Erreur chargement détails");
    } finally {
      setLoadingDetail(false);
    }
  };

  const loadFinancial = async (u: UserProfile) => {
    setLoadingFinancial(true);
    setFinancial(null);
    try {
      const [docsRes, paymentsRes, depensesRes, salairesRes] = await Promise.all([
        supabase.from("documents").select("id, total, type").eq("user_id", u.user_id).eq("type", "facture"),
        supabase.from("payments").select("montant, document_id"),
        supabase.from("depenses").select("montant").eq("user_id", u.user_id),
        supabase.from("salaires").select("salaire_mensuel").eq("user_id", u.user_id),
      ]);
      const caFacture = (docsRes.data ?? []).reduce((s, d) => s + (d.total ?? 0), 0);
      // CA encaissé: sum payments on the user's documents
      const userDocIds = new Set((docsRes.data ?? []).map((d) => d.id).filter(Boolean));
      const caEncaisse = (paymentsRes.data ?? [])
        .filter((p) => userDocIds.has(p.document_id))
        .reduce((s, p) => s + p.montant, 0);
      const depenses = (depensesRes.data ?? []).reduce((s, d) => s + d.montant, 0);
      const masseSalariale = (salairesRes.data ?? []).reduce((s, s2) => s + s2.salaire_mensuel, 0);
      setFinancial({ caFacture, caEncaisse, depenses, masseSalariale });
    } catch {
      toast.error("Erreur chargement données financières");
    } finally {
      setLoadingFinancial(false);
    }
  };

  const exportCsv = () => {
    if (!users?.length) return;
    const header = "Nom,Email,Rôle,Inscription,Expiration,Statut\n";
    const rows = users.map((u) => {
      const expired = u.licence_expiration && new Date(u.licence_expiration) < new Date();
      const statut = u.role === "freemium" ? "Découverte" : expired ? "Expiré" : "Actif";
      return [
        `"${u.prenom} ${u.nom}"`,
        `"${u.email}"`,
        `"${u.role}"`,
        `"${new Date(u.created_at).toLocaleDateString("fr-FR")}"`,
        `"${u.licence_expiration ? new Date(u.licence_expiration).toLocaleDateString("fr-FR") : "-"}"`,
        `"${statut}"`,
      ].join(",");
    }).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `comptes-digal-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  function formatFCFA(n: number) {
    return n.toLocaleString("fr-FR") + " FCFA";
  }

  const getStatusBadge = (u: UserProfile) => {
    if (u.role === "owner" || u.role === "dm") return <Badge className="bg-emerald-100 text-emerald-700">Actif</Badge>;
    if (!u.licence_expiration) return <Badge variant="outline">Découverte</Badge>;
    const exp = new Date(u.licence_expiration);
    if (exp < new Date()) return <Badge className="bg-red-100 text-red-700">Expiré</Badge>;
    return <Badge className="bg-emerald-100 text-emerald-700">Actif</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      owner: { label: "Owner", cls: "bg-primary/10 text-primary border-primary/30" },
      dm: { label: "DM", cls: "bg-primary/10 text-primary border-primary/30" },
      solo: { label: "Solo", cls: "bg-blue-100 text-blue-700" },
      freemium: { label: "Découverte", cls: "bg-muted text-muted-foreground" },
      agence_standard: { label: "Studio", cls: "bg-purple-100 text-purple-700" },
      agence_pro: { label: "Elite", cls: "bg-purple-100 text-purple-700" },
      cm: { label: "CM", cls: "bg-gray-100 text-gray-700" },
      createur: { label: "Créateur", cls: "bg-sky-100 text-sky-700" },
    };
    const info = map[role] ?? { label: role, cls: "" };
    return <Badge className={info.cls}>{info.label}</Badge>;
  };

  const resetPlanFlow = () => {
    setPlanStep(0);
    setPlanNewPlan("freemium");
    setPlanNewDuree(6);
    setPlanInvoiceId(null);
    setPlanInvoiceNumero(null);
    setPlanPayMethod("Wave");
    setPlanPayRef("");
  };

  const getDurationsForPlan = (planType: string) =>
    (planConfigs ?? []).filter((c) => c.plan_type === planType);

  const getSelectedConfig = (planType: string, duree: number) =>
    (planConfigs ?? []).find((c) => c.plan_type === planType && c.duree_mois === duree);

  const generateInvoice = useMutation({
    mutationFn: async ({ targetUser, plan, duree, prix }: {
      targetUser: UserProfile; plan: string; duree: number; prix: number;
    }) => {
      const now = new Date();
      const yymm = now.toISOString().slice(0, 7).replace("-", "");
      const rand = Math.floor(Math.random() * 9000) + 1000;
      const numero = `FAC-DIG-${yymm}-${rand}`;

      // Calculate remise for multi-month plans vs monthly pricing
      const monthlyConfig = (planConfigs ?? []).find((c) => c.plan_type === plan && c.duree_mois === 1);
      const remisePct = (duree > 1 && monthlyConfig)
        ? Math.max(0, Math.round(((monthlyConfig.prix_fcfa * duree - prix) / (monthlyConfig.prix_fcfa * duree)) * 100) - 5)
        : 0;
      const montantRemise = (duree > 1 && monthlyConfig && remisePct > 0)
        ? Math.round(monthlyConfig.prix_fcfa * duree * remisePct / 100)
        : 0;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("documents")
        .insert({
          user_id: targetUser.user_id,
          client_id: null,
          type: "facture_licence",
          statut: "en_attente",
          numero,
          sous_total: monthlyConfig ? monthlyConfig.prix_fcfa * duree : prix,
          montant_tva: 0,
          montant_brs: 0,
          taux_tva: 0,
          taux_brs: 0,
          remise_pct: remisePct,
          montant_remise: montantRemise,
          total: prix,
          date_emission: now.toISOString().slice(0, 10),
          notes: `Licence Digal ${PLAN_LABELS[plan] ?? plan} - ${duree} mois`,
        })
        .select("id, numero")
        .single();
      if (error) throw error;
      return data as { id: string; numero: string };
    },
    onSuccess: (data) => {
      setPlanInvoiceId(data.id);
      setPlanInvoiceNumero(data.numero);
      setPlanStep(1);
      toast.success(`Facture générée — en attente de paiement`);
    },
    onError: (err: Error) => toast.error(err.message ?? "Erreur lors de la génération"),
  });

  const confirmPayment = useMutation({
    mutationFn: async ({ targetUser, invoiceId, plan, duree, methode, reference }: {
      targetUser: UserProfile; invoiceId: string; plan: string;
      duree: number; methode: string; reference: string;
    }) => {
      const newExp = new Date();
      newExp.setMonth(newExp.getMonth() + duree);
      const [docErr, userErr] = await Promise.all([
        supabase.from("documents").update({ statut: "payee" }).eq("id", invoiceId).then((r) => r.error),
        supabase.from("users").update({
          role: plan,
          plan,
          licence_expiration: newExp.toISOString(),
        }).eq("id", targetUser.id).then((r) => r.error),
      ]);
      if (docErr) throw docErr;
      if (userErr) throw userErr;
      await logActivity(
        targetUser.user_id,
        "plan_change",
        "auth",
        `Plan activé par admin : ${PLAN_LABELS[plan] ?? plan} — ${duree} mois — ${methode}${reference ? ` (${reference})` : ""}`,
        "user",
        targetUser.id,
      );
      await supabase.from("notifications").insert({
        user_id: targetUser.user_id,
        titre: "Votre plan a été activé",
        message: `Votre plan ${PLAN_LABELS[plan] ?? plan} est actif pour ${duree} mois. Expiration : ${newExp.toLocaleDateString("fr-FR")}.`,
        type: "plan",
      });
      return newExp;
    },
    onSuccess: (newExp) => {
      queryClient.invalidateQueries({ queryKey: ["admin-comptes"] });
      setPlanStep(2);
      toast.success(`Plan activé jusqu'au ${newExp.toLocaleDateString("fr-FR")}`);
    },
    onError: (err: Error) => toast.error(err.message ?? "Erreur lors de l'activation"),
  });

  const revokeWithLog = useMutation({
    mutationFn: async (targetUser: UserProfile) => {
      const { error } = await supabase.from("users")
        .update({ role: "freemium", plan: null, licence_expiration: null })
        .eq("id", targetUser.id);
      if (error) throw error;
      await logActivity(targetUser.user_id, "plan_revoked", "auth", "Licence révoquée par admin", "user", targetUser.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-comptes"] });
      toast.success("Licence révoquée");
    },
    onError: () => toast.error("Erreur lors de la révocation"),
  });

  const suspendAccount = useMutation({
    mutationFn: async (targetUser: UserProfile) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("users")
        .update({ statut: "suspendu" })
        .eq("id", targetUser.id);
      if (error) throw error;
      await logActivity(targetUser.user_id, "account_suspended", "auth", "Compte suspendu par admin", "user", targetUser.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-comptes"] });
      toast.success("Compte suspendu");
    },
    onError: () => toast.error("Erreur lors de la suspension"),
  });

  const deleteAccount = useMutation({
    mutationFn: async (targetUser: UserProfile) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("users")
        .update({ statut: "suppression_planifiee" })
        .eq("id", targetUser.id);
      if (error) throw error;
      await logActivity(targetUser.user_id, "account_deletion_planned", "auth", "Suppression planifiée par admin", "user", targetUser.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-comptes"] });
      setSelected(null);
      setDetail(null);
      toast.success("Compte marqué pour suppression");
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Comptes utilisateurs</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-muted-foreground font-sans">
                {filteredUsers?.length ?? 0} compte(s) affiché(s)
                {filterParam && ` · filtre : ${FILTER_LABELS[filterParam] ?? filterParam}`}
              </p>
              {filterParam && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-xs font-sans gap-1"
                  onClick={() => setSearchParams({})}
                >
                  <X className="h-3 w-3" /> Retirer le filtre
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setCreateOpen(true)} className="font-sans">
              <UserPlus className="h-4 w-4 mr-2" /> Créer un compte
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={!users?.length} className="font-sans">
              <Download className="h-4 w-4 mr-2" /> Exporter CSV
            </Button>
          </div>
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
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut licence</TableHead>
                    <TableHead>Expiration</TableHead>
                    <TableHead>Inscription</TableHead>
                    <TableHead>Dernière connexion</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.map((u) => {
                    const lastLoginDate = lastLoginMap ? (lastLoginMap[u.user_id] ?? null) : null;
                    const { text: lastLoginText, isOld } = formatRelativeTime(lastLoginDate);
                    return (
                      <TableRow key={u.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetail(u)}>
                        <TableCell className="font-medium">{u.prenom} {u.nom}</TableCell>
                        <TableCell className="text-sm">{u.email}</TableCell>
                        <TableCell>{getRoleBadge(u.role)}</TableCell>
                        <TableCell>{getStatusBadge(u)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {u.licence_expiration ? new Date(u.licence_expiration).toLocaleDateString("fr-FR") : "-"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString("fr-FR")}
                        </TableCell>
                        <TableCell className={`text-xs ${isOld ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                          {lastLoginMap ? lastLoginText : <Loader2 className="h-3 w-3 animate-spin" />}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openDetail(u); }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredUsers?.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-12">Aucun compte</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Modal création de compte */}
        <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) createForm.reset({ type_compte: "solo", plan: "freemium" }); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-serif flex items-center gap-2">
                <UserPlus className="h-5 w-5" /> Créer un compte
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={createForm.handleSubmit((v) => createAccount.mutate(v))} className="space-y-4 font-sans">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="prenom" className="text-xs">Prénom *</Label>
                  <Input id="prenom" {...createForm.register("prenom")} placeholder="Awa" />
                  {createForm.formState.errors.prenom && (
                    <p className="text-xs text-destructive">{createForm.formState.errors.prenom.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="nom" className="text-xs">Nom *</Label>
                  <Input id="nom" {...createForm.register("nom")} placeholder="Diallo" />
                  {createForm.formState.errors.nom && (
                    <p className="text-xs text-destructive">{createForm.formState.errors.nom.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs">Email *</Label>
                <Input id="email" type="email" {...createForm.register("email")} placeholder="awa@agence.sn" />
                {createForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{createForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="password" className="text-xs">Mot de passe *</Label>
                  <Input id="password" type="password" {...createForm.register("password")} placeholder="min. 8 caractères" />
                  {createForm.formState.errors.password && (
                    <p className="text-xs text-destructive">{createForm.formState.errors.password.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="confirmPassword" className="text-xs">Confirmation *</Label>
                  <Input id="confirmPassword" type="password" {...createForm.register("confirmPassword")} placeholder="Répéter" />
                  {createForm.formState.errors.confirmPassword && (
                    <p className="text-xs text-destructive">{createForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Type de compte *</Label>
                <RadioGroup
                  defaultValue="solo"
                  onValueChange={(v) => createForm.setValue("type_compte", v as "solo" | "agence")}
                  className="flex gap-4"
                >
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="solo" id="type-solo" />
                    <Label htmlFor="type-solo" className="text-sm font-normal cursor-pointer">Solo / Freelance</Label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="agence" id="type-agence" />
                    <Label htmlFor="type-agence" className="text-sm font-normal cursor-pointer">Agence</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Plan *</Label>
                <Select
                  defaultValue="freemium"
                  onValueChange={(v) => createForm.setValue("plan", v as CreateAccountForm["plan"])}
                >
                  <SelectTrigger><SelectValue placeholder="Choisir un plan" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="freemium">Découverte</SelectItem>
                    <SelectItem value="solo_standard">CM Pro</SelectItem>
                    <SelectItem value="agence_standard">Studio</SelectItem>
                    <SelectItem value="agence_pro">Elite</SelectItem>
                  </SelectContent>
                </Select>
                {createForm.watch("plan") !== "freemium" && (
                  <p className="text-xs text-muted-foreground">Licence active, expiration dans 6 mois</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="agence_nom" className="text-xs">Nom de l'agence / entreprise</Label>
                <Input id="agence_nom" {...createForm.register("agence_nom")} placeholder="Optionnel" />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setCreateOpen(false)} className="font-sans">
                  Annuler
                </Button>
                <Button type="submit" size="sm" disabled={createAccount.isPending} className="font-sans">
                  {createAccount.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                  Créer le compte
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={!!selected} onOpenChange={(open) => { if (!open) { setSelected(null); setDetail(null); setFinancial(null); setDeleteInput(""); resetPlanFlow(); } }}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle asChild>
                <div className="flex items-center gap-3">
                  {selected && (
                    <div className={`h-11 w-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      selected.role === "owner" || selected.role === "dm" ? "bg-primary text-primary-foreground" :
                      selected.role === "solo" ? "bg-blue-600 text-white" :
                      selected.role === "agence_standard" ? "bg-purple-600 text-white" :
                      selected.role === "agence_pro" ? "bg-indigo-700 text-white" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {(selected.prenom?.[0] ?? "").toUpperCase()}{(selected.nom?.[0] ?? "").toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-serif text-lg font-bold">{selected?.prenom} {selected?.nom}</span>
                      {selected && getRoleBadge(selected.role)}
                    </div>
                    <p className="text-xs text-muted-foreground font-sans font-normal truncate">{selected?.email}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground font-sans font-normal">
                      <span>Inscrit le {selected ? new Date(selected.created_at).toLocaleDateString("fr-FR") : ""}</span>
                      {selected && lastLoginMap && (
                        <span>· {formatRelativeTime(lastLoginMap[selected.user_id] ?? null).text}</span>
                      )}
                    </div>
                  </div>
                </div>
              </DialogTitle>
            </DialogHeader>
            {selected && (
              <Tabs defaultValue="apercu">
                <TabsList className="w-full">
                  <TabsTrigger value="apercu" className="flex-1 text-xs font-sans">
                    <Activity className="h-3.5 w-3.5 mr-1" /> Aperçu
                  </TabsTrigger>
                  <TabsTrigger value="clients" className="flex-1 text-xs font-sans">
                    <Users className="h-3.5 w-3.5 mr-1" /> Clients
                  </TabsTrigger>
                  <TabsTrigger value="financier" className="flex-1 text-xs font-sans" onClick={() => !financial && loadFinancial(selected)}>
                    <BarChart3 className="h-3.5 w-3.5 mr-1" /> Financier
                  </TabsTrigger>
                  <TabsTrigger value="actions" className="flex-1 text-xs font-sans">
                    <KeyRound className="h-3.5 w-3.5 mr-1" /> Actions
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="apercu" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-3 text-sm font-sans">
                    <div><span className="text-muted-foreground">Plan</span><p className="font-medium">{selected.role}</p></div>
                    <div><span className="text-muted-foreground">Expiration</span><p className="font-medium">{selected.licence_expiration ? new Date(selected.licence_expiration).toLocaleDateString("fr-FR") : "-"}</p></div>
                    {selected.agence_nom && <div className="col-span-2"><span className="text-muted-foreground">Agence</span><p className="font-medium">{selected.agence_nom}</p></div>}
                  </div>

                  {loadingDetail ? (
                    <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                  ) : detail && (
                    <div className="grid grid-cols-2 gap-3">
                      <Card>
                        <CardContent className="pt-4 pb-3 text-center">
                          <Users className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                          <p className="text-xl font-bold font-serif">{detail.clientsActifs}</p>
                          <p className="text-[10px] text-muted-foreground">Clients actifs</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4 pb-3 text-center">
                          <Calendar className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                          <p className="text-xl font-bold font-serif">{detail.postsCount}</p>
                          <p className="text-[10px] text-muted-foreground">Posts créés</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4 pb-3 text-center">
                          <Activity className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                          <p className="text-xl font-bold font-serif">{detail.previewLinksCount}</p>
                          <p className="text-[10px] text-muted-foreground">Liens générés</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4 pb-3 text-center">
                          <FileText className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                          <p className="text-xl font-bold font-serif">{detail.facturesMoisTotal > 0 ? (detail.facturesMoisTotal / 1000).toFixed(0) + "k" : "0"}</p>
                          <p className="text-[10px] text-muted-foreground">Facturé ce mois (FCFA)</p>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {detail?.lastActivity && (
                    <p className="text-xs text-muted-foreground font-sans">
                      Dernière activité : {new Date(detail.lastActivity).toLocaleString("fr-FR")}
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="clients" className="mt-4">
                  {loadingDetail ? (
                    <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                  ) : detail && detail.clients.length > 0 ? (
                    <div className="space-y-2">
                      {detail.clients.map((c) => (
                        <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                          <span className="font-medium text-sm font-sans">{c.nom}</span>
                          <Badge variant={c.statut === "actif" ? "success" : "outline"} className="text-[10px]">
                            {c.statut === "actif" ? "Actif" : "Archivé"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8 font-sans">Aucun client</p>
                  )}
                </TabsContent>

                <TabsContent value="financier" className="mt-4">
                  {loadingFinancial ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                  ) : financial ? (
                    <div className="grid grid-cols-2 gap-3">
                      <Card>
                        <CardContent className="pt-4 pb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="h-4 w-4 text-emerald-500" />
                            <span className="text-xs text-muted-foreground font-sans">CA facturé</span>
                          </div>
                          <p className="text-lg font-bold font-serif text-emerald-700">{formatFCFA(financial.caFacture)}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4 pb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="h-4 w-4 text-blue-500" />
                            <span className="text-xs text-muted-foreground font-sans">CA encaissé</span>
                          </div>
                          <p className="text-lg font-bold font-serif text-blue-700">{formatFCFA(financial.caEncaisse)}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4 pb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Briefcase className="h-4 w-4 text-orange-500" />
                            <span className="text-xs text-muted-foreground font-sans">Dépenses</span>
                          </div>
                          <p className="text-lg font-bold font-serif text-orange-700">{formatFCFA(financial.depenses)}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4 pb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="h-4 w-4 text-purple-500" />
                            <span className="text-xs text-muted-foreground font-sans">Masse salariale</span>
                          </div>
                          <p className="text-lg font-bold font-serif text-purple-700">{formatFCFA(financial.masseSalariale)}</p>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8 font-sans">Cliquez sur l'onglet pour charger les données</p>
                  )}
                </TabsContent>

                <TabsContent value="actions" className="space-y-4 mt-4 font-sans">
                  {/* ── Section : Changer de plan ── */}
                  <div className="rounded-lg border border-border p-4 space-y-3">
                    <p className="text-sm font-semibold flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-primary" /> Changer de plan
                    </p>

                    {planStep === 0 && (
                      <div className="space-y-3">
                        {/* Sélection plan */}
                        <div className="space-y-1">
                          <Label className="text-xs">Nouveau plan</Label>
                          <Select value={planNewPlan} onValueChange={(v) => { setPlanNewPlan(v); setPlanNewDuree(getDurationsForPlan(v)[0]?.duree_mois ?? 6); }}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="freemium">Découverte</SelectItem>
                              <SelectItem value="solo">CM Pro</SelectItem>
                              <SelectItem value="agence_standard">Studio</SelectItem>
                              <SelectItem value="agence_pro">Elite</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Sélection durée (masquée pour Freemium) */}
                        {planNewPlan !== "freemium" && (
                          <div className="space-y-1">
                            <Label className="text-xs">Durée</Label>
                            {getDurationsForPlan(planNewPlan).length > 0 ? (
                              <Select
                                value={String(planNewDuree)}
                                onValueChange={(v) => setPlanNewDuree(Number(v))}
                              >
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {getDurationsForPlan(planNewPlan).map((c) => (
                                    <SelectItem key={c.duree_mois} value={String(c.duree_mois)}>
                                      {c.duree_mois} mois — {c.prix_fcfa.toLocaleString("fr-FR")} FCFA
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <p className="text-xs text-muted-foreground">Aucune configuration tarifaire active</p>
                            )}
                          </div>
                        )}

                        {/* Prix affiché */}
                        {planNewPlan !== "freemium" && getSelectedConfig(planNewPlan, planNewDuree) && (
                          <p className="text-xs text-muted-foreground">
                            Prix : <span className="font-semibold text-foreground">{getSelectedConfig(planNewPlan, planNewDuree)!.prix_fcfa.toLocaleString("fr-FR")} FCFA</span>
                          </p>
                        )}

                        <Button
                          size="sm"
                          className="w-full gap-1.5"
                          onClick={() => {
                            if (planNewPlan === "freemium") {
                              revokeWithLog.mutate(selected);
                            } else {
                              const cfg = getSelectedConfig(planNewPlan, planNewDuree);
                              generateInvoice.mutate({ targetUser: selected, plan: planNewPlan, duree: planNewDuree, prix: cfg?.prix_fcfa ?? 0 });
                            }
                          }}
                          disabled={generateInvoice.isPending || revokeWithLog.isPending || (planNewPlan !== "freemium" && getDurationsForPlan(planNewPlan).length === 0)}
                        >
                          {generateInvoice.isPending || revokeWithLog.isPending
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Receipt className="h-3.5 w-3.5" />}
                          {planNewPlan === "freemium" ? "Rétrograder en Découverte" : "Générer la facture"}
                        </Button>
                      </div>
                    )}

                    {planStep === 1 && (
                      <div className="space-y-3">
                        <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-xs space-y-1">
                          <p className="font-semibold text-amber-800">{planInvoiceNumero}</p>
                          <p className="text-amber-700">{PLAN_LABELS[planNewPlan]} — {planNewDuree} mois — {(getSelectedConfig(planNewPlan, planNewDuree)?.prix_fcfa ?? 0).toLocaleString("fr-FR")} FCFA</p>
                          <p className="text-amber-600">En attente de paiement</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Méthode de paiement</Label>
                          <Select value={planPayMethod} onValueChange={setPlanPayMethod}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {METHODE_LABELS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Référence transaction (optionnel)</Label>
                          <Input
                            className="h-8 text-xs"
                            placeholder="Ex: WV-2026-XXXX"
                            value={planPayRef}
                            onChange={(e) => setPlanPayRef(e.target.value)}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 gap-1.5"
                            onClick={() => confirmPayment.mutate({ targetUser: selected, invoiceId: planInvoiceId!, plan: planNewPlan, duree: planNewDuree, methode: planPayMethod, reference: planPayRef })}
                            disabled={confirmPayment.isPending}
                          >
                            {confirmPayment.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                            Confirmer paiement reçu
                          </Button>
                          <Button size="sm" variant="ghost" className="text-xs" onClick={resetPlanFlow}>
                            Annuler
                          </Button>
                        </div>
                      </div>
                    )}

                    {planStep === 2 && (
                      <div className="space-y-3">
                        <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3 text-xs flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-emerald-800">Plan activé</p>
                            <p className="text-emerald-700">{PLAN_LABELS[planNewPlan]} — {planNewDuree} mois</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="w-full text-xs" onClick={resetPlanFlow}>
                          Nouveau changement de plan
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* ── Zone dangereuse ── */}
                  <div className="rounded-lg border border-destructive/30 p-4 space-y-2">
                    <p className="text-xs font-semibold text-destructive">Zone dangereuse</p>

                    {/* Révoquer */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full justify-start text-orange-600 border-orange-300 hover:bg-orange-50">
                          <ShieldOff className="h-4 w-4 mr-2" /> Révoquer la licence
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="font-serif">Révoquer la licence ?</AlertDialogTitle>
                          <AlertDialogDescription className="font-sans">
                            {selected.prenom} {selected.nom} repassera en Découverte immédiatement.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="font-sans">Annuler</AlertDialogCancel>
                          <AlertDialogAction className="bg-orange-600 text-white hover:bg-orange-700 font-sans" onClick={() => revokeWithLog.mutate(selected)}>
                            Révoquer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    {/* Suspendre */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full justify-start text-amber-700 border-amber-300 hover:bg-amber-50">
                          <PauseCircle className="h-4 w-4 mr-2" /> Suspendre le compte
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="font-serif">Suspendre ce compte ?</AlertDialogTitle>
                          <AlertDialogDescription className="font-sans">
                            Le compte de {selected.prenom} {selected.nom} sera suspendu. L'accès sera bloqué.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="font-sans">Annuler</AlertDialogCancel>
                          <AlertDialogAction className="bg-amber-700 text-white hover:bg-amber-800 font-sans" onClick={() => suspendAccount.mutate(selected)}>
                            Suspendre
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    {/* Supprimer */}
                    <div className="space-y-2 pt-1">
                      <Button variant="outline" size="sm" className="w-full justify-start text-destructive border-destructive/30 hover:bg-destructive/10" disabled>
                        <Trash2 className="h-4 w-4 mr-2" /> Supprimer le compte
                      </Button>
                      <p className="text-[11px] text-muted-foreground">Tapez l'email pour confirmer :</p>
                      <Input
                        className="h-8 text-xs"
                        placeholder={selected.email}
                        value={deleteInput}
                        onChange={(e) => setDeleteInput(e.target.value)}
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="w-full"
                        disabled={deleteInput !== selected.email || deleteAccount.isPending}
                        onClick={() => deleteAccount.mutate(selected)}
                      >
                        {deleteAccount.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Trash2 className="h-3.5 w-3.5 mr-1" />}
                        Confirmer la suppression
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
