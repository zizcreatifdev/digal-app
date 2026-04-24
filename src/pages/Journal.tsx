import { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "@/components/ui/table";
import { Monitor, Smartphone, Tablet, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  ActivityLog,
  fetchActivityLogs,
  ACTION_TYPE_LABELS,
  ACTION_TYPE_COLORS,
} from "@/lib/activity-logs";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DeviceIcon({ deviceType }: { deviceType: string | null }) {
  if (deviceType === "Mobile") return <Smartphone className="h-4 w-4 text-muted-foreground" title="Mobile" />;
  if (deviceType === "Tablet") return <Tablet className="h-4 w-4 text-muted-foreground" title="Tablette" />;
  return <Monitor className="h-4 w-4 text-muted-foreground" title="Ordinateur" />;
}

function countryFlag(code: string | null): string {
  if (!code || code.length !== 2) return "";
  return String.fromCodePoint(
    ...code.toUpperCase().split("").map((c) => 127397 + c.charCodeAt(0))
  );
}

export default function Journal() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await fetchActivityLogs(user.id, {
        typeAction: typeFilter,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setLogs(data);
    } finally {
      setLoading(false);
    }
  }, [user, typeFilter, dateFrom, dateTo]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-serif font-bold">Journal d'activité</h1>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <Label className="text-xs">Type d'action</Label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les actions</SelectItem>
                {Object.entries(ACTION_TYPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Du</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
          </div>
          <div>
            <Label className="text-xs">Au</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">Aucune activité enregistrée</p>
        ) : (
          <div className="rounded-lg border bg-card overflow-hidden overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Détail</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Navigateur</TableHead>
                  <TableHead>Localisation</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </TableCell>
                    <TableCell>
                      <Badge className={ACTION_TYPE_COLORS[log.type_action] ?? ACTION_TYPE_COLORS.autre}>
                        {ACTION_TYPE_LABELS[log.type_action] ?? log.type_action}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-sm">{log.action}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {log.detail ?? "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <DeviceIcon deviceType={log.device_type} />
                        <span className="text-xs text-muted-foreground font-sans hidden sm:inline">
                          {log.os ?? ""}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-sans">
                      {log.browser ?? "-"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-sans whitespace-nowrap">
                      {log.city || log.country ? (
                        <span>
                          {countryFlag(log.country_code)}{" "}
                          {[log.city, log.country].filter(Boolean).join(" · ")}
                        </span>
                      ) : "-"}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {log.ip_address ?? "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
