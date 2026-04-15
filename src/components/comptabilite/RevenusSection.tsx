import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { STATUT_COLORS, STATUT_LABELS, formatFCFA, Document } from "@/lib/facturation";

interface Props {
  documents: Document[];
}

export function RevenusSection({ documents }: Props) {
  const factures = documents.filter((d) => d.type === "facture");
  const [statutFilter, setStatutFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("");

  const filtered = factures.filter((f) => {
    if (statutFilter !== "all" && f.statut !== statutFilter) return false;
    if (clientFilter && !f.clients?.nom.toLowerCase().includes(clientFilter.toLowerCase())) return false;
    return true;
  });

  const totalFacture = filtered.reduce((s, f) => s + f.total, 0);
  const totalEncaisse = filtered
    .filter((f) => f.statut === "paye")
    .reduce((s, f) => s + f.total, 0);
  const solde = totalFacture - totalEncaisse;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total facturé</p>
          <p className="text-lg font-bold font-serif mt-1">{formatFCFA(totalFacture)}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total encaissé</p>
          <p className="text-lg font-bold font-serif mt-1 text-emerald-600">{formatFCFA(totalEncaisse)}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Solde en attente</p>
          <p className="text-lg font-bold font-serif mt-1 text-amber-600">{formatFCFA(solde)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={statutFilter} onValueChange={setStatutFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {Object.entries(STATUT_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input placeholder="Filtrer par client..." value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} className="w-48" />
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">Aucune facture</p>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-mono text-sm">{f.numero}</TableCell>
                  <TableCell>{f.clients?.nom ?? "-"}</TableCell>
                  <TableCell>{f.date_emission}</TableCell>
                  <TableCell className="font-semibold">{formatFCFA(f.total)}</TableCell>
                  <TableCell>
                    <Badge className={STATUT_COLORS[f.statut] ?? ""}>
                      {STATUT_LABELS[f.statut] ?? f.statut}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
