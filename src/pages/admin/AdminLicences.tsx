import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Download, Key, Copy, Check, Gift, CalendarPlus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/sonner";

interface PlanConfig {
  id: string;
  plan_type: string;
  duree_mois: number;
  prix_fcfa: number;
  est_actif: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  solo: "CM Pro",
  solo_standard: "CM Pro",
  agence_standard: "Studio",
  agence_pro: "Elite",
};

const TYPE_SHORT: Record<string, string> = {
  solo: "SOLO",
  agence_standard: "STD",
  agence_pro: "PRO",
};

function generateKeyCode(type: string): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `DIGAL-${TYPE_SHORT[type] ?? "SOLO"}-${suffix}`;
}

export default function AdminLicences() {
  const queryClient = useQueryClient();

  // Activate existing user dialog
  const [showActivate, setShowActivate] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("solo_standard");
  const [duree, setDuree] = useState("6");

  // Generate key dialog
  const [showGenerate, setShowGenerate] = useState(false);
  const [genType, setGenType] = useState("solo");
  const [genDuration, setGenDuration] = useState("6");
  const [generatedKey, setGeneratedKey] = useState("");
  const [copied, setCopied] = useState(false);
  const [genPromo, setGenPromo] = useState(false);
  const [genPromoDiscount, setGenPromoDiscount] = useState("30");

  // Extend license dialog
  const [extendUser, setExtendUser] = useState<{ id: string; email: string; licence_expiration: string | null } | null>(null);
  const [extendMonths, setExtendMonths] = useState("3");

  const { data: planConfigs } = useQuery({
    queryKey: ["plan-configs"],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("plan_configs")
        .select("id, plan_type, duree_mois, prix_fcfa, est_actif")
        .eq("est_actif", true)
        .order("duree_mois");
      if (error) throw error;
      return (data ?? []) as PlanConfig[];
    },
  });

  // Reset genDuration when genType changes, default to 6m if available
  useEffect(() => {
    const configs = (planConfigs ?? []).filter((c) => c.plan_type === genType);
    if (configs.length === 0) return;
    const sixM = configs.find((c) => c.duree_mois === 6);
    setGenDuration(String(sixM?.duree_mois ?? configs[0].duree_mois));
  }, [genType, planConfigs]);

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-licences-users"],
    queryFn: async () => {
      const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: licenseKeys, isLoading: keysLoading } = useQuery({
    queryKey: ["admin-license-keys"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("license_keys")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const licensedUsers = users?.filter(u => u.role !== "freemium") ?? [];

  const activateLicense = useMutation({
    mutationFn: async () => {
      const expDate = new Date();
      expDate.setMonth(expDate.getMonth() + parseInt(duree));
      const { error } = await supabase.from("users").update({
        role: selectedPlan,
        licence_expiration: expDate.toISOString(),
      }).eq("id", selectedUserId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-licences-users"] });
      toast.success("Licence activée");
      setShowActivate(false);
    },
  });

  const generateKey = useMutation({
    mutationFn: async () => {
      const keyCode = generateKeyCode(genType);
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("license_keys").insert({
        key_code: keyCode,
        type: genType,
        duration_months: parseInt(genDuration),
        created_by: user?.id,
        promo_discount: genPromo ? parseInt(genPromoDiscount) || 0 : 0,
      });
      if (error) throw error;
      return keyCode;
    },
    onSuccess: (keyCode) => {
      queryClient.invalidateQueries({ queryKey: ["admin-license-keys"] });
      setGeneratedKey(keyCode);
      toast.success("Clé générée");
    },
    onError: () => toast.error("Erreur lors de la génération"),
  });

  const extendLicenseMutation = useMutation({
    mutationFn: async ({ userId, months }: { userId: string; months: number }) => {
      // Get current expiry
      const { data: u, error: eErr } = await supabase.from("users").select("licence_expiration").eq("id", userId).single();
      if (eErr) throw eErr;
      const base = u?.licence_expiration ? new Date(u.licence_expiration) : new Date();
      const newExp = new Date(base);
      newExp.setMonth(newExp.getMonth() + months);
      const { error } = await supabase.from("users").update({ licence_expiration: newExp.toISOString() }).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-licences-users"] });
      toast.success("Licence prolongée");
      setExtendUser(null);
    },
    onError: () => toast.error("Erreur lors de la prolongation"),
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenGenerate = () => {
    setGeneratedKey("");
    setCopied(false);
    setGenPromo(false);
    setGenPromoDiscount("30");
    setShowGenerate(true);
  };

  const exportCsv = () => {
    if (!licensedUsers.length) return;
    const header = "Nom,Email,Plan,Expiration\n";
    const rows = licensedUsers.map(u =>
      `"${u.prenom} ${u.nom}","${u.email}","${u.role}","${u.licence_expiration ? new Date(u.licence_expiration).toLocaleDateString("fr-FR") : "-"}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `licences-digal-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Licences</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
            <Button variant="outline" size="sm" onClick={handleOpenGenerate}><Key className="h-4 w-4 mr-1" /> Générer clé</Button>
            <Button size="sm" onClick={() => setShowActivate(true)}><Plus className="h-4 w-4 mr-1" /> Activer licence</Button>
          </div>
        </div>

        {/* Licensed users */}
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <Card>
            <CardHeader><CardTitle className="text-base">Comptes sous licence</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Expiration</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {licensedUsers.map((u) => {
                    const expired = u.licence_expiration && new Date(u.licence_expiration) < new Date();
                    return (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.prenom} {u.nom}</TableCell>
                        <TableCell className="text-sm">{u.email}</TableCell>
                        <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
                        <TableCell>
                          {expired
                            ? <Badge className="bg-red-100 text-red-700">Expiré</Badge>
                            : <Badge className="bg-emerald-100 text-emerald-700">Actif</Badge>
                          }
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {u.licence_expiration ? new Date(u.licence_expiration).toLocaleDateString("fr-FR") : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm" variant="ghost"
                            onClick={() => { setExtendUser({ id: u.id, email: u.email, licence_expiration: u.licence_expiration }); setExtendMonths("3"); }}
                            title="Prolonger la licence"
                          >
                            <CalendarPlus className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {licensedUsers.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-12">Aucune licence active</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Generated keys */}
        {!keysLoading && (
          <Card>
            <CardHeader><CardTitle className="text-base">Clés de licence générées</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clé</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Durée</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Utilisée le</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(licenseKeys ?? []).map((k) => (
                    <TableRow key={k.id}>
                      <TableCell className="font-mono text-xs">{k.key_code}</TableCell>
                      <TableCell><Badge variant="outline">{TYPE_LABELS[k.type] ?? k.type}</Badge></TableCell>
                      <TableCell className="text-sm">{k.duration_months} mois</TableCell>
                      <TableCell>
                        {k.is_used
                          ? <Badge className="bg-slate-100 text-slate-700">Utilisée</Badge>
                          : <Badge className="bg-emerald-100 text-emerald-700">Disponible</Badge>
                        }
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {k.used_at ? new Date(k.used_at).toLocaleDateString("fr-FR") : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(licenseKeys ?? []).length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Aucune clé générée</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Generate key dialog */}
        <Dialog open={showGenerate} onOpenChange={(v) => { setShowGenerate(v); if (!v) setGeneratedKey(""); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Générer une clé de licence</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Type de licence</Label>
                <Select value={genType} onValueChange={setGenType} disabled={!!generatedKey}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solo">CM Pro</SelectItem>
                    <SelectItem value="agence_standard">Studio</SelectItem>
                    <SelectItem value="agence_pro">Elite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Durée</Label>
                <Select
                  value={genDuration}
                  onValueChange={setGenDuration}
                  disabled={!!generatedKey}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une durée" />
                  </SelectTrigger>
                  <SelectContent>
                    {(planConfigs ?? [])
                      .filter((c) => c.plan_type === genType)
                      .map((c) => (
                        <SelectItem key={c.id} value={String(c.duree_mois)}>
                          {c.duree_mois === 12 ? "12 mois (1 an)" : `${c.duree_mois} mois`}
                          {" — "}
                          {c.prix_fcfa.toLocaleString("fr-FR")} FCFA
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Promo key */}
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Clé promotionnelle</p>
                    <p className="text-xs text-muted-foreground">Réduction sur le prix affiché</p>
                  </div>
                </div>
                <Switch checked={genPromo} onCheckedChange={setGenPromo} disabled={!!generatedKey} />
              </div>
              {genPromo && !generatedKey && (
                <div className="flex items-center gap-2">
                  <Label className="whitespace-nowrap">Remise (%)</Label>
                  <Input type="number" value={genPromoDiscount} onChange={e => setGenPromoDiscount(e.target.value)} min="1" max="100" className="w-24" />
                  <span className="text-xs text-muted-foreground">Ex : 30 = -30% de lancement</span>
                </div>
              )}
              {generatedKey && (
                <div className="rounded-lg bg-muted p-3 flex items-center justify-between gap-2">
                  <div>
                    <span className="font-mono text-sm font-semibold">{generatedKey}</span>
                    {genPromo && <Badge className="ml-2 bg-primary/10 text-primary text-[10px]">-{genPromoDiscount}%</Badge>}
                  </div>
                  <Button size="icon" variant="ghost" onClick={handleCopy}>
                    {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowGenerate(false); setGeneratedKey(""); }}>Fermer</Button>
              {!generatedKey && (
                <Button onClick={() => generateKey.mutate()} disabled={generateKey.isPending}>
                  {generateKey.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Générer
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Extend license dialog */}
        <Dialog open={!!extendUser} onOpenChange={(v) => !v && setExtendUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Prolonger la licence</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground font-sans">{extendUser?.email}</p>
              {extendUser?.licence_expiration && (
                <p className="text-xs text-muted-foreground font-sans">
                  Expiration actuelle : {new Date(extendUser.licence_expiration).toLocaleDateString("fr-FR")}
                </p>
              )}
              <div>
                <Label>Durée à ajouter (mois)</Label>
                <Input type="number" value={extendMonths} onChange={e => setExtendMonths(e.target.value)} min="1" max="24" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setExtendUser(null)}>Annuler</Button>
              <Button
                onClick={() => extendUser && extendLicenseMutation.mutate({ userId: extendUser.id, months: parseInt(extendMonths) || 3 })}
                disabled={extendLicenseMutation.isPending}
              >
                {extendLicenseMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Prolonger
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Activate existing user dialog */}
        <Dialog open={showActivate} onOpenChange={setShowActivate}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Activer une licence manuellement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Compte</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un compte" /></SelectTrigger>
                  <SelectContent>
                    {users?.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.prenom} {u.nom} ({u.email})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Plan</Label>
                <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solo_standard">CM Pro</SelectItem>
                    <SelectItem value="agence_standard">Studio</SelectItem>
                    <SelectItem value="agence_pro">Elite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Durée (mois)</Label>
                <Input type="number" value={duree} onChange={e => setDuree(e.target.value)} min="1" max="24" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowActivate(false)}>Annuler</Button>
              <Button onClick={() => activateLicense.mutate()} disabled={!selectedUserId || activateLicense.isPending}>
                {activateLicense.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Activer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
