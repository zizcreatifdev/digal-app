import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createPreviewLink, getPreviewUrl, PERIOD_OPTIONS, PeriodOption, getPeriodDates } from "@/lib/preview-links";
import { supabase } from "@/integrations/supabase/client";
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
  clientSlug?: string | null;
}

export function GeneratePreviewLinkModal({ open, onOpenChange, clientId, clientName, clientSlug }: GeneratePreviewLinkModalProps) {
  const { user } = useAuth();
  const [period, setPeriod] = useState<PeriodOption>("semaine_courante");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingDefaults, setLoadingDefaults] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Load DM default period from site_settings
  useEffect(() => {
    if (!open || !user) return;
    setLoadingDefaults(true);
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "preview_default_period")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value && PERIOD_OPTIONS.some((o) => o.id === data.value)) {
          setPeriod(data.value as PeriodOption);
        }
      })
      .finally(() => setLoadingDefaults(false));
  }, [open, user]);

  const { start, end } = getPeriodDates(period);

  const handleGenerate = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Règle 2 : vérifier qu'il y a des posts en_attente_validation pour la période
      const { start: pStart, end: pEnd } = getPeriodDates(period);
      const { data: pendingPosts } = await supabase
        .from("posts")
        .select("id")
        .eq("client_id", clientId)
        .in("statut", ["en_attente_validation", "lien_envoye"])
        .gte("date_publication", pStart.toISOString())
        .lte("date_publication", pEnd.toISOString())
        .limit(1);
      if (!pendingPosts || pendingPosts.length === 0) {
        toast.error("Aucun post à valider. Soumettez d'abord vos posts pour validation.");
        setLoading(false);
        return;
      }

      const link = await createPreviewLink(clientId, user.id, period, {
        clientSlug: clientSlug ?? null,
        welcomeMessage: welcomeMessage.trim() || undefined,
      });
      setGeneratedUrl(getPreviewUrl(link.slug));
      toast.success("Lien de validation créé");
      logPreviewAction(user.id, "Lien de validation généré", clientName, link.id);
      // Mettre les posts en_attente_validation → lien_envoye pour la période
      await supabase
        .from("posts")
        .update({ statut: "lien_envoye" })
        .eq("client_id", clientId)
        .eq("statut", "en_attente_validation")
        .gte("date_publication", pStart.toISOString())
        .lte("date_publication", pEnd.toISOString());
    } catch (err: unknown) {
      toast.error((err as Error).message || "Erreur lors de la création du lien");
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
      setWelcomeMessage("");
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
              <Select
                value={period}
                onValueChange={(v) => setPeriod(v as PeriodOption)}
                disabled={loadingDefaults}
              >
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

            <div>
              <Label className="font-sans">Message d'accueil (optionnel)</Label>
              <Textarea
                className="mt-1 resize-none"
                rows={2}
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                placeholder={`Bonjour, voici les posts de ${clientName} pour validation...`}
              />
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
