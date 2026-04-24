import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ShieldCheck, ShieldAlert, Monitor, Smartphone, Tablet, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

function parseBrowser(ua: string | null): string {
  if (!ua) return "-";
  if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Edg")) return "Edge";
  return "Autre";
}

function parseDevice(ua: string | null): "Mobile" | "Tablet" | "Desktop" {
  if (!ua) return "Desktop";
  if (/iPad|Tablet/i.test(ua)) return "Tablet";
  if (/iPhone|Android/i.test(ua)) return "Mobile";
  return "Desktop";
}

function DeviceIcon({ ua }: { ua: string | null }) {
  const type = parseDevice(ua);
  if (type === "Mobile") return <Smartphone className="h-4 w-4 text-muted-foreground" title="Mobile" />;
  if (type === "Tablet") return <Tablet className="h-4 w-4 text-muted-foreground" title="Tablette" />;
  return <Monitor className="h-4 w-4 text-muted-foreground" title="Ordinateur" />;
}

export default function AdminSecurity() {
  const [search, setSearch] = useState("");

  const { data: logs, isLoading, isError, refetch } = useQuery({
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sécurité & Journal</h1>
          <p className="text-muted-foreground text-sm font-sans mt-1">Journal des connexions et événements de sécurité.</p>
        </div>

        <div className="w-64">
          <Label className="text-xs">Rechercher</Label>
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Email ou action..." />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : isError ? (
          <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-destructive font-sans">
              <AlertCircle className="h-4 w-4 shrink-0" /> Erreur de chargement des logs
            </div>
            <button onClick={() => refetch()} className="text-xs underline text-destructive">Réessayer</button>
          </div>
        ) : (
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Résultat</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Navigateur</TableHead>
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
                      <TableCell className="text-sm">{l.email ?? "-"}</TableCell>
                      <TableCell className="text-sm font-medium">{l.action}</TableCell>
                      <TableCell>
                        {l.success
                          ? <Badge className="bg-success/10 text-success"><ShieldCheck className="h-3 w-3 mr-1" /> OK</Badge>
                          : <Badge className="bg-destructive/10 text-destructive"><ShieldAlert className="h-3 w-3 mr-1" /> Échec</Badge>
                        }
                      </TableCell>
                      <TableCell>
                        <DeviceIcon ua={l.user_agent ?? null} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-sans">
                        {parseBrowser(l.user_agent ?? null)}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{l.ip_address ?? "-"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{l.detail ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-12">Aucun log de sécurité</TableCell></TableRow>
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
