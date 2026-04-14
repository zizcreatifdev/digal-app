import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { createPreviewLink, getPreviewUrl, PERIOD_OPTIONS, PeriodOption, getPeriodDates } from "@/lib/preview-links";
import { logPreviewAction } from "@/lib/activity-logs";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Copy, Check, Link2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface GeneratePreviewLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
}

export function GeneratePreviewLinkModal({ open, onOpenChange, clientId, clientName }: GeneratePreviewLinkModalProps) {
  const { user } = useAuth();
  const [period, setPeriod] = useState<PeriodOption>("semaine_courante");
  const [loading, setLoading] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { start, end } = getPeriodDates(period);

  const handleGenerate = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const link = await createPreviewLink(clientId, user.id, period);
      setGeneratedUrl(getPreviewUrl(link.slug));
      toast.success("Lien de validation créé");
      logPreviewAction(user.id, "Lien de validation généré", clientName, link.id);
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la création du lien");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (generatedUrl) {
      navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      toast.success("Lien copié !");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setGeneratedUrl(null);
      setCopied(false);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Lien de validation
          </DialogTitle>
          <DialogDescription>
            Générez un lien pour que <span className="font-semibold text-foreground">{clientName}</span> valide les posts.
          </DialogDescription>
        </DialogHeader>

        {!generatedUrl ? (
          <div className="space-y-4 mt-2">
            <div>
              <Label className="font-sans">Période</Label>
              <Select value={period} onValueChange={(v) => setPeriod(v as PeriodOption)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg bg-muted/50 border border-border p-3">
              <p className="text-xs text-muted-foreground font-sans">
                Du <span className="font-medium text-foreground">{format(start, "d MMMM yyyy", { locale: fr })}</span> au{" "}
                <span className="font-medium text-foreground">{format(end, "d MMMM yyyy", { locale: fr })}</span>
              </p>
              <p className="text-[10px] text-muted-foreground font-sans mt-1">
                Le lien sera valable 48 heures après sa création.
              </p>
            </div>

            <Button onClick={handleGenerate} disabled={loading} className="w-full">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Générer le lien
            </Button>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            <div className="rounded-lg bg-muted/50 border border-border p-3">
              <p className="text-[10px] text-muted-foreground font-sans mb-1">Lien de validation</p>
              <div className="flex items-center gap-2">
                <Input value={generatedUrl} readOnly className="text-xs font-mono flex-1" />
                <Button size="icon" variant="outline" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground font-sans text-center">
              Expire dans 48 heures · Accessible sans connexion
            </p>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleCopy}>
                <Copy className="h-4 w-4" />
                Copier le lien
              </Button>
              <Button className="flex-1" onClick={() => handleClose(false)}>
                Terminé
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
