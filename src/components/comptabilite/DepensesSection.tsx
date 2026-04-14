import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Depense, CATEGORIE_LABELS, CATEGORIE_COLORS, createDepense, deleteDepense } from "@/lib/comptabilite";
import { formatFCFA } from "@/lib/facturation";

interface Props {
  depenses: Depense[];
  onRefresh: () => void;
}

export function DepensesSection({ depenses, onRefresh }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [libelle, setLibelle] = useState("");
  const [montant, setMontant] = useState(0);
  const [categorie, setCategorie] = useState("autre");
  const [dateDepense, setDateDepense] = useState(new Date().toISOString().split("T")[0]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [catFilter, setCatFilter] = useState("all");

  const filtered = catFilter === "all" ? depenses : depenses.filter((d) => d.categorie === catFilter);
  const totalDepenses = filtered.reduce((s, d) => s + d.montant, 0);

  const handleSubmit = async () => {
    if (!user || !libelle.trim()) return;
    setLoading(true);
    try {
      let pieceUrl: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop();
        const path = `depenses/${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("post-media").upload(path, file);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("post-media").getPublicUrl(path);
        pieceUrl = urlData.publicUrl;
      }
      await createDepense({
        user_id: user.id,
        libelle: libelle.trim(),
        montant,
        categorie,
        date_depense: dateDepense,
        piece_jointe_url: pieceUrl,
      });
      toast.success("Dépense ajoutée");
      setOpen(false);
      setLibelle("");
      setMontant(0);
      setFile(null);
      onRefresh();
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDepense(id);
      toast.success("Dépense supprimée");
      onRefresh();
    } catch (err: unknown) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              {Object.entries(CATEGORIE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">Total : <strong>{formatFCFA(totalDepenses)}</strong></span>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Ajouter
        </Button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">Aucune dépense</p>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Libellé</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{d.date_depense}</TableCell>
                  <TableCell className="flex items-center gap-2">
                    {d.libelle}
                    {d.piece_jointe_url && (
                      <a href={d.piece_jointe_url} target="_blank" rel="noopener noreferrer">
                        <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                      </a>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={CATEGORIE_COLORS[d.categorie] ?? ""}>
                      {CATEGORIE_LABELS[d.categorie] ?? d.categorie}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold">{formatFCFA(d.montant)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(d.id)} className="text-destructive h-8 w-8">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle className="font-serif">Nouvelle dépense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Libellé</Label>
              <Input value={libelle} onChange={(e) => setLibelle(e.target.value)} placeholder="Ex : Abonnement Canva" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Montant (FCFA)</Label>
                <Input type="number" min={0} value={montant} onChange={(e) => setMontant(parseInt(e.target.value) || 0)} />
              </div>
              <div>
                <Label>Catégorie</Label>
                <Select value={categorie} onValueChange={setCategorie}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORIE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={dateDepense} onChange={(e) => setDateDepense(e.target.value)} />
            </div>
            <div>
              <Label>Pièce jointe (optionnel)</Label>
              <Input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button onClick={handleSubmit} disabled={loading || !libelle.trim()}>
                {loading ? "..." : "Ajouter"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
