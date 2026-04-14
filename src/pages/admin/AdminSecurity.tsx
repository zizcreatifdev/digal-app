import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ShieldCheck, ShieldAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function AdminSecurity() {
  const [search, setSearch] = useState("");

  const { data: logs, isLoading } = useQuery({
    queryKey: ["admin-security-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("security_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 15000,
  });

  const filtered = logs?.filter(l =>
    !search || l.email?.toLowerCase().includes(search.toLowerCase()) || l.action.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Sécurité & Journal</h1>

        <div className="w-64">
          <Label className="text-xs">Rechercher</Label>
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Email ou action..." />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Résultat</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Détail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(l.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </TableCell>
                      <TableCell className="text-sm">{l.email ?? "—"}</TableCell>
                      <TableCell className="text-sm font-medium">{l.action}</TableCell>
                      <TableCell>
                        {l.success
                          ? <Badge className="bg-emerald-100 text-emerald-700"><ShieldCheck className="h-3 w-3 mr-1" /> OK</Badge>
                          : <Badge className="bg-red-100 text-red-700"><ShieldAlert className="h-3 w-3 mr-1" /> Échec</Badge>
                        }
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{l.ip_address ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{l.detail ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-12">Aucun log de sécurité</TableCell></TableRow>
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
