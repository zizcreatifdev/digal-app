import { useState } from "react";
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
import { Loader2, Plus, Download, Key, Copy, Check } from "lucide-react";
import { toast } from "@/components/ui/sonner";

const TYPE_LABELS: Record<string, string> = {
  solo: "Solo Standard",
  agence_standard: "Agence Standard",
  agence_pro: "Agence Pro",
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
  const [selectedPlan, setSelectedPlan] = useState("solo");
  const [duree, setDuree] = useState("6");

  // Generate key dialog
  const [showGenerate, setShowGenerate] = useState(false);
  const [genType, setGenType] = useState("solo");
  const [genDuration, setGenDuration] = useState("6");
  const [generatedKey, setGeneratedKey] = useState("");
  const [copied, setCopied] = useState(false);

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

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenGenerate = () => {
    setGeneratedKey("");
    setCopied(false);
    setShowGenerate(true);
  };

  const exportCsv = () => {
    if (!licensedUsers.length) return;
    const header = "Nom,Email,Plan,Expiration\n";
    const rows = licensedUsers.map(u =>
      `"${u.prenom} ${u.nom}","${u.email}","${u.role}","${u.licence_expiration ? new Date(u.licence_expiration).toLocaleDateString("fr-FR") : "—"}"`
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
                          {u.licence_expiration ? new Date(u.licence_expiration).toLocaleDateString("fr-FR") : "—"}
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
                        {k.used_at ? new Date(k.used_at).toLocaleDateString("fr-FR") : "—"}
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
                    <SelectItem value="solo">Solo Standard</SelectItem>
                    <SelectItem value="agence_standard">Agence Standard</SelectItem>
                    <SelectItem value="agence_pro">Agence Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Durée (mois)</Label>
                <Input type="number" value={genDuration} onChange={e => setGenDuration(e.target.value)} min="1" max="24" disabled={!!generatedKey} />
              </div>
              {generatedKey && (
                <div className="rounded-lg bg-muted p-3 flex items-center justify-between gap-2">
                  <span className="font-mono text-sm font-semibold">{generatedKey}</span>
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
                    <SelectItem value="solo">Solo Standard</SelectItem>
                    <SelectItem value="agence_standard">Agence Standard</SelectItem>
                    <SelectItem value="agence_pro">Agence Pro</SelectItem>
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
