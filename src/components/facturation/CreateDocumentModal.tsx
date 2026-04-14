import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import { logDocumentAction } from "@/lib/activity-logs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  DocumentLine,
  generateNumero,
  calculateTotals,
  createDocument,
  formatFCFA,
} from "@/lib/facturation";

interface Client {
  id: string;
  nom: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "devis" | "facture";
  preselectedClientId?: string;
  onCreated: () => void;
}

const EMPTY_LINE: DocumentLine = {
  description: "",
  quantite: 1,
  prix_unitaire: 0,
  brs_applicable: true,
  montant: 0,
  ordre: 0,
};

const PAYMENT_METHODS = [
  { value: "wave", label: "Wave" },
  { value: "yas", label: "YAS" },
  { value: "orange_money", label: "Orange Money" },
  { value: "virement", label: "Virement" },
  { value: "cash", label: "Cash" },
];

export function CreateDocumentModal({ open, onOpenChange, type, preselectedClientId, onCreated }: Props) {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState(preselectedClientId ?? "");
  const [numero, setNumero] = useState("");
  const [dateEmission, setDateEmission] = useState(new Date().toISOString().split("T")[0]);
  const [dateEcheance, setDateEcheance] = useState("");
  const [lines, setLines] = useState<DocumentLine[]>([{ ...EMPTY_LINE }]);
  const [tauxBrs, setTauxBrs] = useState(5);
  const [tauxTva, setTauxTva] = useState(0);
  const [methodes, setMethodes] = useState<string[]>(["wave"]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    supabase.from("clients").select("id, nom").eq("user_id", user.id).eq("statut", "actif")
      .then(({ data }) => setClients(data ?? []));
    generateNumero(type, user.id).then(setNumero);
  }, [open, user, type]);

  useEffect(() => {
    if (preselectedClientId) setClientId(preselectedClientId);
  }, [preselectedClientId]);

  const totals = calculateTotals(lines, tauxBrs, tauxTva);

  const updateLine = (index: number, field: keyof DocumentLine, value: any) => {
    setLines((prev) =>
      prev.map((l, i) => (i === index ? { ...l, [field]: value } : l))
    );
  };

  const addLine = () => setLines((prev) => [...prev, { ...EMPTY_LINE, ordre: prev.length }]);
  const removeLine = (index: number) => setLines((prev) => prev.filter((_, i) => i !== index));

  const toggleMethode = (m: string) => {
    setMethodes((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  };

  const handleSubmit = async () => {
    if (!user || !clientId) return;
    setLoading(true);
    try {
      await createDocument(
        {
          user_id: user.id,
          client_id: clientId,
          type,
          numero,
          date_emission: dateEmission,
          date_echeance: dateEcheance || null,
          sous_total: totals.sousTotal,
          taux_brs: tauxBrs,
          montant_brs: totals.montantBrs,
          taux_tva: tauxTva,
          montant_tva: totals.montantTva,
          total: totals.total,
          methodes_paiement: methodes,
          notes,
        },
        lines
      );
      toast.success(`${type === "devis" ? "Devis" : "Facture"} créé(e) avec succès`);
      logDocumentAction(user.id, `${type === "devis" ? "Devis" : "Facture"} créé(e)`, numero);
      onCreated();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {type === "devis" ? "Nouveau Devis" : "Nouvelle Facture"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Client</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un client" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Numéro</Label>
              <Input value={numero} readOnly className="bg-muted" />
            </div>
            <div>
              <Label>Date d'émission</Label>
              <Input type="date" value={dateEmission} onChange={(e) => setDateEmission(e.target.value)} />
            </div>
            <div>
              <Label>Date d'échéance</Label>
              <Input type="date" value={dateEcheance} onChange={(e) => setDateEcheance(e.target.value)} />
            </div>
          </div>

          {/* Lines */}
          <div>
            <Label className="mb-2 block">Prestations</Label>
            <div className="space-y-2">
              {lines.map((line, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    {i === 0 && <span className="text-xs text-muted-foreground">Description</span>}
                    <Input
                      value={line.description}
                      onChange={(e) => updateLine(i, "description", e.target.value)}
                      placeholder="Description"
                    />
                  </div>
                  <div className="col-span-2">
                    {i === 0 && <span className="text-xs text-muted-foreground">Qté</span>}
                    <Input
                      type="number"
                      min={1}
                      value={line.quantite}
                      onChange={(e) => updateLine(i, "quantite", parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="col-span-3">
                    {i === 0 && <span className="text-xs text-muted-foreground">Prix unit. (FCFA)</span>}
                    <Input
                      type="number"
                      min={0}
                      value={line.prix_unitaire}
                      onChange={(e) => updateLine(i, "prix_unitaire", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-1 flex items-center gap-1">
                    <Checkbox
                      checked={line.brs_applicable}
                      onCheckedChange={(v) => updateLine(i, "brs_applicable", !!v)}
                      title="BRS"
                    />
                    <span className="text-[10px] text-muted-foreground">BRS</span>
                  </div>
                  <div className="col-span-1">
                    {lines.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeLine(i)} className="text-destructive h-8 w-8">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={addLine} className="mt-2">
              <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter une ligne
            </Button>
          </div>

          {/* Taxes */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>BRS (%)</Label>
              <Input type="number" min={0} max={100} value={tauxBrs} onChange={(e) => setTauxBrs(parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <Label>TVA (%)</Label>
              <Input type="number" min={0} max={100} value={tauxTva} onChange={(e) => setTauxTva(parseFloat(e.target.value) || 0)} />
            </div>
          </div>

          {/* Totals preview */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-1 text-sm">
            <div className="flex justify-between"><span>Sous-total</span><span>{formatFCFA(totals.sousTotal)}</span></div>
            <div className="flex justify-between"><span>BRS ({tauxBrs}%)</span><span>{formatFCFA(totals.montantBrs)}</span></div>
            {tauxTva > 0 && (
              <div className="flex justify-between"><span>TVA ({tauxTva}%)</span><span>{formatFCFA(totals.montantTva)}</span></div>
            )}
            <div className="flex justify-between font-bold text-base border-t border-border pt-2 mt-2">
              <span>Total</span>
              <span>{formatFCFA(totals.total)}</span>
            </div>
          </div>

          {/* Payment methods */}
          <div>
            <Label className="mb-2 block">Méthodes de paiement</Label>
            <div className="flex flex-wrap gap-3">
              {PAYMENT_METHODS.map((m) => (
                <label key={m.value} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={methodes.includes(m.value)} onCheckedChange={() => toggleMethode(m.value)} />
                  {m.label}
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes ou conditions..." rows={3} />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={loading || !clientId}>
              {loading ? "Création..." : `Créer le ${type === "devis" ? "devis" : "la facture"}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
