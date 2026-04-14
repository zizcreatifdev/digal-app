import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  PERIOD_TYPES, PeriodType, ProductionPeriod,
  createProductionPeriod, updateProductionPeriod, deleteProductionPeriod,
} from "@/lib/production-periods";

interface ProductionPeriodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  period?: ProductionPeriod | null;
  onSuccess: () => void;
}

export function ProductionPeriodModal({
  open, onOpenChange, clientId, period, onSuccess,
}: ProductionPeriodModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<PeriodType>("shooting");
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  useEffect(() => {
    if (period) {
      setType(period.type);
      setTitre(period.titre);
      setDescription(period.description ?? "");
      setDateDebut(period.date_debut);
      setDateFin(period.date_fin);
    } else {
      setType("shooting");
      setTitre("");
      setDescription("");
      setDateDebut("");
      setDateFin("");
    }
  }, [period, open]);

  const handleSubmit = async () => {
    if (!titre.trim()) { toast.error("Le titre est requis"); return; }
    if (!dateDebut || !dateFin) { toast.error("Les dates sont requises"); return; }
    if (dateFin < dateDebut) { toast.error("La date de fin doit être après la date de début"); return; }
    if (!user) return;

    setLoading(true);
    try {
      if (period) {
        await updateProductionPeriod(period.id, { type, titre: titre.trim(), description: description || null, date_debut: dateDebut, date_fin: dateFin });
        toast.success("Période modifiée");
      } else {
        await createProductionPeriod({
          user_id: user.id,
          client_id: clientId,
          type,
          titre: titre.trim(),
          description: description || null,
          date_debut: dateDebut,
          date_fin: dateFin,
          assigne_a: null,
        });
        toast.success("Période créée");
      }
      onOpenChange(false);
      onSuccess();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!period) return;
    setLoading(true);
    try {
      await deleteProductionPeriod(period.id);
      toast.success("Période supprimée");
      onOpenChange(false);
      onSuccess();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{period ? "Modifier la période" : "Nouvelle période de production"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="font-sans">Type *</Label>
            <Select value={type} onValueChange={(v) => setType(v as PeriodType)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_TYPES.map(pt => (
                  <SelectItem key={pt.id} value={pt.id}>{pt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="font-sans">Titre *</Label>
            <Input
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex : Shooting produits Acme"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="font-sans">Date de début *</Label>
              <Input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="font-sans">Date de fin *</Label>
              <Input
                type="date"
                value={dateFin}
                min={dateDebut}
                onChange={(e) => setDateFin(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="font-sans">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Instructions, objectifs, notes..."
              rows={2}
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {period && (
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>
                Supprimer
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {period ? "Enregistrer" : "Créer"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
