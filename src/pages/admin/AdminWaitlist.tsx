import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle, Mail } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { sendActivationEmail } from "@/lib/emails";

interface WaitlistEntry {
  id: string;
  prenom: string | null;
  nom: string | null;
  email: string;
  type_compte: string | null;
  statut: string | null;
  created_at: string;
}

export default function AdminWaitlist() {
  const queryClient = useQueryClient();

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

  const updateStatus = useMutation({
    mutationFn: async ({ id, statut, entry }: { id: string; statut: string; entry: WaitlistEntry }) => {
      const { error } = await supabase.from("waitlist").update({ statut }).eq("id", id);
      if (error) throw error;

      if (statut === "approuve") {
        // Create activation token
        const { data: tokenData, error: tokenError } = await supabase
          .from("activation_tokens")
          .insert({
            email: entry.email,
            prenom: entry.prenom ?? "",
            nom: entry.nom ?? "",
            type_compte: entry.type_compte ?? "solo",
          })
          .select("token")
          .single();

        if (tokenError || !tokenData) {
          console.warn("[waitlist] Failed to create activation token:", tokenError?.message);
          return;
        }

        const activationLink = `${window.location.origin}/activate/${tokenData.token}`;
        try {
          await sendActivationEmail(entry.email, entry.prenom ?? "", entry.type_compte ?? "solo", activationLink);
        } catch { /* silent */ }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-waitlist"] });
      if (variables.statut === "approuve") {
        toast.success(`Email d'activation envoyé à ${variables.entry.email}`);
      } else {
        toast.success("Statut mis à jour");
      }
    },
  });

  const statusBadge = (statut: string | null) => {
    switch (statut) {
      case "approuve": return <Badge className="bg-emerald-100 text-emerald-700">Approuvé</Badge>;
      case "refuse": return <Badge className="bg-red-100 text-red-700">Refusé</Badge>;
      default: return <Badge className="bg-amber-100 text-amber-700">En attente</Badge>;
    }
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
                  {entries?.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.prenom} {e.nom}</TableCell>
                      <TableCell className="text-sm">{e.email}</TableCell>
                      <TableCell><Badge variant="outline">{e.type_compte ?? "solo"}</Badge></TableCell>
                      <TableCell>{statusBadge(e.statut)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(e.created_at).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell>
                        {e.statut === "en_attente" && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ id: e.id, statut: "approuve", entry: e })}>
                              <CheckCircle className="h-4 w-4 text-emerald-600" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ id: e.id, statut: "refuse", entry: e })}>
                              <XCircle className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
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
