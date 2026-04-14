import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, X, Receipt } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import digalLogo from "@/assets/digal-logo.png";

interface ReceiptData {
  compte_nom: string;
  compte_email: string | null;
  plan: string;
  planLabel: string;
  planFeatures?: string[];
  montant: number;
  methode: string;
  methodeLabel: string;
  date_paiement: string;
  statut: string;
}

interface ReceiptPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ReceiptData | null;
  onDownload: () => void;
}

export function ReceiptPreviewModal({ open, onOpenChange, data, onDownload }: ReceiptPreviewModalProps) {
  if (!data) return null;

  const formattedDate = format(new Date(data.date_paiement), "dd MMMM yyyy", { locale: fr });
  const refNumber = `DGL-${format(new Date(data.date_paiement), "yyyyMMdd")}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[560px] p-0 overflow-hidden">
        {/* Receipt Preview */}
        <div className="bg-white text-gray-900">
          {/* Header with brand bar */}
          <div className="h-2 bg-[hsl(var(--primary))]" />
          
          <div className="p-8 space-y-6">
            {/* Top: Logo + Receipt title */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img src={digalLogo} alt="Digal" className="h-10 w-10" />
                <div>
                  <h2 className="text-xl font-serif font-bold text-gray-900">Digal</h2>
                  <p className="text-[11px] text-gray-400 font-sans">Plateforme SaaS pour Community Managers</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5 text-[hsl(var(--primary))]">
                  <Receipt className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider font-sans">Reçu de paiement</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 font-sans">{formattedDate}</p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100" />

            {/* Client info block */}
            <div className="bg-gray-50 rounded-xl p-5 space-y-3">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-sans font-semibold">Détails du compte</p>
              <div className="grid grid-cols-2 gap-4 text-sm font-sans">
                <div>
                  <p className="text-[10px] text-gray-400 mb-0.5">Titulaire</p>
                  <p className="font-semibold text-gray-900">{data.compte_nom}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 mb-0.5">Email</p>
                  <p className="text-gray-700">{data.compte_email ?? "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 mb-0.5">Formule</p>
                  <Badge variant="outline" className="text-[10px] border-[hsl(var(--primary))]/30 text-[hsl(var(--primary))]">{data.planLabel}</Badge>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 mb-0.5">Méthode de paiement</p>
                  <p className="text-gray-700">{data.methodeLabel}</p>
                </div>
              </div>
            </div>

            {/* Amount block */}
            <div className="rounded-xl border-2 border-[hsl(var(--primary))]/20 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-sans font-semibold">Montant</p>
                  <p className="text-3xl font-serif font-bold text-gray-900 mt-1">
                    {data.montant.toLocaleString("fr-FR")} <span className="text-base text-gray-400">FCFA</span>
                  </p>
                </div>
                <Badge className={data.statut === "paye" 
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs" 
                  : "bg-amber-50 text-amber-700 border border-amber-200 text-xs"
                }>
                  {data.statut === "paye" ? "✓ Payé" : "En attente"}
                </Badge>
              </div>
            </div>

            {/* Plan features */}
            {data.planFeatures && data.planFeatures.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-sans font-semibold">Inclus dans la formule</p>
                <div className="grid grid-cols-2 gap-1">
                  {data.planFeatures.map((f, i) => (
                    <p key={i} className="text-[11px] text-gray-600 font-sans flex items-start gap-1">
                      <span className="text-emerald-500 mt-0.5">✓</span> {f}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-2">
              <p className="text-[9px] text-gray-300 font-sans">
                Réf : {refNumber} • Dakar, Sénégal
              </p>
              <p className="text-[9px] text-gray-300 font-sans">
                digal.sn
              </p>
            </div>
          </div>

          {/* Bottom brand bar */}
          <div className="h-1.5 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary))]/50" />
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end p-4 border-t bg-gray-50">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="font-sans gap-1.5">
            <X className="h-3.5 w-3.5" /> Fermer
          </Button>
          <Button size="sm" onClick={onDownload} className="font-sans gap-1.5">
            <Download className="h-3.5 w-3.5" /> Télécharger PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
