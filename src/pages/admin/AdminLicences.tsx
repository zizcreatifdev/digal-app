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
import { Loader2, Plus, Download } from "lucide-react";
import { toast } from "@/components/ui/sonner";

export default function AdminLicences() {
  const queryClient = useQueryClient();
  const [showActivate, setShowActivate] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("solo");
  const [duree, setDuree] = useState("6");

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-licences-users"],
    queryFn: async () => {
      const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false });
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
            <Button size="sm" onClick={() => setShowActivate(true)}><Plus className="h-4 w-4 mr-1" /> Activer licence</Button>
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

        <Dialog open={showActivate} onOpenChange={setShowActivate}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Activer une licence</DialogTitle>
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
              <Button onClick={() => activateLicense.mutate()} disabled={!selectedUserId}>Activer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
