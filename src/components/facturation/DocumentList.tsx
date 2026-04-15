import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "@/components/ui/table";
import { FileDown, ArrowRightLeft, CreditCard, Ban } from "lucide-react";
import { toast } from "sonner";
import {
  Document,
  STATUT_COLORS,
  STATUT_LABELS,
  formatFCFA,
  convertDevisToFacture,
  updateDocumentStatut,
  fetchDocumentWithLines,
  addPayment,
} from "@/lib/facturation";
import { generateDocumentPdf } from "@/lib/facturation-pdf";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const STATUT_OPTIONS = [
  { value: "all", label: "Tous les statuts" },
  { value: "brouillon", label: "Brouillon" },
  { value: "envoye", label: "Envoyé" },
  { value: "paye", label: "Payé" },
  { value: "partiellement_paye", label: "Partiellement payé" },
  { value: "en_retard", label: "En retard" },
  { value: "annule", label: "Annulé" },
];

interface Props {
  documents: Document[];
  type: "devis" | "facture";
  onRefresh: () => void;
}

export function DocumentList({ documents, type, onRefresh }: Props) {
  const { user } = useAuth();
  const [statutFilter, setStatutFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("");
  const [paymentModal, setPaymentModal] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethode, setPayMethode] = useState("wave");
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payLoading, setPayLoading] = useState(false);

  const filtered = documents.filter((d) => {
    if (statutFilter !== "all" && d.statut !== statutFilter) return false;
    if (clientFilter && !d.clients?.nom.toLowerCase().includes(clientFilter.toLowerCase())) return false;
    return true;
  });

  const handleDownloadPdf = async (docId: string) => {
    try {
      const { document: doc, lines, payments } = await fetchDocumentWithLines(docId);

      // Fetch user profile for emitter info (including tampon + signature)
      const { data: profile } = await supabase
        .from("users")
        .select("prenom, nom, email, agence_nom, logo_url, tampon_url, signature_url")
        .eq("user_id", doc.user_id)
        .single();

      // Fetch client details
      const { data: client } = await supabase
        .from("clients")
        .select("nom, contact_nom, contact_email, contact_telephone, facturation_adresse")
        .eq("id", doc.client_id)
        .single();

      const userProfile = profile ?? { prenom: "", nom: "", email: "" };
      const clientInfo = client ?? { nom: doc.clients?.nom ?? "Client" };

      const pdf = await generateDocumentPdf(doc, lines, payments, clientInfo, userProfile);
      pdf.save(`${doc.numero}.pdf`);
    } catch (err: unknown) {
      toast.error((err as Error).message);
    }
  };

  const handleConvert = async (devisId: string) => {
    if (!user) return;
    try {
      await convertDevisToFacture(devisId, user.id);
      toast.success("Devis converti en facture");
      onRefresh();
    } catch (err: unknown) {
      toast.error((err as Error).message);
    }
  };

  const handleCancel = async (docId: string) => {
    try {
      await updateDocumentStatut(docId, "annule");
      toast.success("Document annulé");
      onRefresh();
    } catch (err: unknown) {
      toast.error((err as Error).message);
    }
  };

  const handlePayment = async () => {
    if (!paymentModal || payAmount <= 0) return;
    setPayLoading(true);
    try {
      await addPayment(paymentModal, payAmount, payMethode, payDate);
      toast.success("Paiement enregistré");
      setPaymentModal(null);
      onRefresh();
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={statutFilter} onValueChange={setStatutFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Filtrer par client..."
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="w-48"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          Aucun {type === "devis" ? "devis" : "facture"} trouvé
        </p>
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-mono text-sm">{doc.numero}</TableCell>
                  <TableCell>{doc.clients?.nom ?? "-"}</TableCell>
                  <TableCell>{doc.date_emission}</TableCell>
                  <TableCell className="font-semibold">{formatFCFA(doc.total)}</TableCell>
                  <TableCell>
                    <Badge className={STATUT_COLORS[doc.statut] ?? ""}>
                      {STATUT_LABELS[doc.statut] ?? doc.statut}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" title="Télécharger PDF" onClick={() => handleDownloadPdf(doc.id)}>
                        <FileDown className="h-4 w-4" />
                      </Button>
                      {type === "devis" && doc.statut !== "annule" && (
                        <Button variant="ghost" size="icon" title="Convertir en facture" onClick={() => handleConvert(doc.id)}>
                          <ArrowRightLeft className="h-4 w-4" />
                        </Button>
                      )}
                      {type === "facture" && !["paye", "annule"].includes(doc.statut) && (
                        <Button variant="ghost" size="icon" title="Enregistrer un paiement" onClick={() => setPaymentModal(doc.id)}>
                          <CreditCard className="h-4 w-4" />
                        </Button>
                      )}
                      {!["annule", "paye"].includes(doc.statut) && (
                        <Button variant="ghost" size="icon" title="Annuler" onClick={() => handleCancel(doc.id)} className="text-destructive">
                          <Ban className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Payment modal */}
      <Dialog open={!!paymentModal} onOpenChange={(open) => !open && setPaymentModal(null)}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle className="font-serif">Enregistrer un paiement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Montant (FCFA)</Label>
              <Input type="number" min={1} value={payAmount} onChange={(e) => setPayAmount(parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <Label>Méthode</Label>
              <Select value={payMethode} onValueChange={setPayMethode}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="wave">Wave</SelectItem>
                  <SelectItem value="yas">YAS</SelectItem>
                  <SelectItem value="orange_money">Orange Money</SelectItem>
                  <SelectItem value="virement">Virement</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setPaymentModal(null)}>Annuler</Button>
              <Button onClick={handlePayment} disabled={payLoading || payAmount <= 0}>
                {payLoading ? "..." : "Enregistrer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
