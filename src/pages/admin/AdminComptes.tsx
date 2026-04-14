import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Loader2, Eye, KeyRound, Users, Briefcase, FileText,
  Calendar, BarChart3, Activity, ShieldOff, Trash2, Download, DollarSign, UserPlus,
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
  postsCount: number;
  documentsCount: number;
  lastActivity: string | null;
}

interface AccountFinancial {
  caFacture: number;
  caEncaisse: number;
  depenses: number;
  masseSalariale: number;
}

export default function AdminComptes() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<UserProfile | null>(null);
  const [detail, setDetail] = useState<AccountDetail | null>(null);
  const [financial, setFinancial] = useState<AccountFinancial | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingFinancial, setLoadingFinancial] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

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
      const [clientsRes, postsRes, docsRes, logsRes] = await Promise.all([
        supabase.from("clients").select("id, nom, statut").eq("user_id", u.user_id),
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("user_id", u.user_id),
        supabase.from("documents").select("id", { count: "exact", head: true }).eq("user_id", u.user_id),
        supabase.from("activity_logs").select("created_at").eq("user_id", u.user_id).order("created_at", { ascending: false }).limit(1),
      ]);
      setDetail({
        clients: (clientsRes.data ?? []) as { id: string; nom: string; statut: string }[],
        postsCount: postsRes.count ?? 0,
        documentsCount: docsRes.count ?? 0,
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
      const statut = u.role === "freemium" ? "Freemium" : expired ? "Expiré" : "Actif";
      return [
        `"${u.prenom} ${u.nom}"`,
        `"${u.email}"`,
        `"${u.role}"`,
        `"${new Date(u.created_at).toLocaleDateString("fr-FR")}"`,
        `"${u.licence_expiration ? new Date(u.licence_expiration).toLocaleDateString("fr-FR") : "—"}"`,
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
    if (!u.licence_expiration) return <Badge variant="outline">Freemium</Badge>;
    const exp = new Date(u.licence_expiration);
    if (exp < new Date()) return <Badge className="bg-red-100 text-red-700">Expiré</Badge>;
    return <Badge className="bg-emerald-100 text-emerald-700">Actif</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      owner: { label: "Owner", cls: "bg-primary/10 text-primary border-primary/30" },
      dm: { label: "DM", cls: "bg-primary/10 text-primary border-primary/30" },
      solo: { label: "Solo", cls: "bg-blue-100 text-blue-700" },
      freemium: { label: "Freemium", cls: "bg-muted text-muted-foreground" },
      agence_standard: { label: "Agence Std", cls: "bg-purple-100 text-purple-700" },
      agence_pro: { label: "Agence Pro", cls: "bg-purple-100 text-purple-700" },
      cm: { label: "CM", cls: "bg-gray-100 text-gray-700" },
      createur: { label: "Créateur", cls: "bg-sky-100 text-sky-700" },
    };
    const info = map[role] ?? { label: role, cls: "" };
    return <Badge className={info.cls}>{info.label}</Badge>;
  };

  const extendLicense = (user: UserProfile) => {
    const newExp = new Date(user.licence_expiration ? new Date(user.licence_expiration) : new Date());
    newExp.setMonth(newExp.getMonth() + 6);
    updateUser.mutate({ id: user.id, licence_expiration: newExp.toISOString() });
  };

  const revokeLicense = (user: UserProfile) => {
    updateUser.mutate({ id: user.id, licence_expiration: null, role: "freemium", plan: null });
    toast.success("Licence révoquée");
  };

  const deleteAccount = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from("users").delete().eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-comptes"] });
      setSelected(null);
      setDetail(null);
      toast.success("Compte supprimé");
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Comptes utilisateurs</h1>
            <p className="text-muted-foreground font-sans mt-1">
              {users?.length ?? 0} comptes enregistrés — cliquez sur un compte pour voir son activité
            </p>
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
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((u) => (
                    <TableRow key={u.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetail(u)}>
                      <TableCell className="font-medium">{u.prenom} {u.nom}</TableCell>
                      <TableCell className="text-sm">{u.email}</TableCell>
                      <TableCell>{getRoleBadge(u.role)}</TableCell>
                      <TableCell>{getStatusBadge(u)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {u.licence_expiration ? new Date(u.licence_expiration).toLocaleDateString("fr-FR") : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openDetail(u); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {users?.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-12">Aucun compte</TableCell></TableRow>
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
                    <SelectItem value="freemium">Freemium</SelectItem>
                    <SelectItem value="solo_standard">Solo Standard</SelectItem>
                    <SelectItem value="agence_standard">Agence Standard</SelectItem>
                    <SelectItem value="agence_pro">Agence Pro</SelectItem>
                  </SelectContent>
                </Select>
                {createForm.watch("plan") !== "freemium" && (
                  <p className="text-xs text-muted-foreground">Licence active — expiration dans 6 mois</p>
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

        <Dialog open={!!selected} onOpenChange={(open) => { if (!open) { setSelected(null); setDetail(null); } }}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif flex items-center gap-2">
                {selected?.prenom} {selected?.nom}
                {selected && getRoleBadge(selected.role)}
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
                    <div><span className="text-muted-foreground">Email</span><p className="font-medium">{selected.email}</p></div>
                    <div><span className="text-muted-foreground">Plan</span><p className="font-medium">{selected.role}</p></div>
                    <div><span className="text-muted-foreground">Inscription</span><p className="font-medium">{new Date(selected.created_at).toLocaleDateString("fr-FR")}</p></div>
                    <div><span className="text-muted-foreground">Expiration</span><p className="font-medium">{selected.licence_expiration ? new Date(selected.licence_expiration).toLocaleDateString("fr-FR") : "—"}</p></div>
                    {selected.agence_nom && <div className="col-span-2"><span className="text-muted-foreground">Agence</span><p className="font-medium">{selected.agence_nom}</p></div>}
                  </div>

                  {loadingDetail ? (
                    <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                  ) : detail && (
                    <div className="grid grid-cols-3 gap-3">
                      <Card>
                        <CardContent className="pt-4 pb-3 text-center">
                          <Users className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                          <p className="text-xl font-bold font-serif">{detail.clients.length}</p>
                          <p className="text-[10px] text-muted-foreground">Clients</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4 pb-3 text-center">
                          <Calendar className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                          <p className="text-xl font-bold font-serif">{detail.postsCount}</p>
                          <p className="text-[10px] text-muted-foreground">Posts</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4 pb-3 text-center">
                          <FileText className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                          <p className="text-xl font-bold font-serif">{detail.documentsCount}</p>
                          <p className="text-[10px] text-muted-foreground">Documents</p>
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

                <TabsContent value="actions" className="space-y-3 mt-4">
                  <Button variant="outline" size="sm" className="w-full justify-start font-sans" onClick={() => extendLicense(selected)}>
                    <KeyRound className="h-4 w-4 mr-2" /> Étendre licence (+6 mois)
                  </Button>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground font-sans">Changer le plan :</span>
                    <Select onValueChange={(val) => updateUser.mutate({ id: selected.id, role: val })}>
                      <SelectTrigger className="w-40"><SelectValue placeholder={selected.role} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="freemium">Freemium</SelectItem>
                        <SelectItem value="solo">Solo Standard</SelectItem>
                        <SelectItem value="agence_standard">Agence Standard</SelectItem>
                        <SelectItem value="agence_pro">Agence Pro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="border-t border-border pt-3 mt-3 space-y-2">
                    <p className="text-xs font-semibold text-destructive font-sans">Zone dangereuse</p>
                    <Button variant="outline" size="sm" className="w-full justify-start font-sans text-orange-600 border-orange-300 hover:bg-orange-50" onClick={() => revokeLicense(selected)}>
                      <ShieldOff className="h-4 w-4 mr-2" /> Révoquer la licence
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full justify-start font-sans text-destructive border-destructive/30 hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4 mr-2" /> Supprimer le compte
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="font-serif">Supprimer ce compte ?</AlertDialogTitle>
                          <AlertDialogDescription className="font-sans">
                            Cette action est irréversible. Toutes les données de {selected.prenom} {selected.nom} seront supprimées définitivement.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="font-sans">Annuler</AlertDialogCancel>
                          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-sans" onClick={() => deleteAccount.mutate(selected.id)}>
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
