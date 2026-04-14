import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles } from "lucide-react";

interface ProUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName: string;
}

export function ProUpgradeModal({ open, onOpenChange, featureName }: ProUpgradeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Fonctionnalité Pro
          </DialogTitle>
          <DialogDescription>
            <span className="font-semibold text-foreground">{featureName}</span> est disponible avec une licence Pro.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-muted/50 p-6 my-2">
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <div className="text-center space-y-2">
              <Lock className="h-10 w-10 mx-auto text-primary/40" />
              <p className="text-sm font-sans">Aperçu de {featureName}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground font-sans">
            Passez à une licence pour débloquer toutes les fonctionnalités avancées de Digal.
          </p>
          <Button className="w-full" size="lg">
            Débloquer avec une licence
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
            Plus tard
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
