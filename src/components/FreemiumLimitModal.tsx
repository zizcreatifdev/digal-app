import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FreemiumLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  description: string;
  title?: string;
}

export function FreemiumLimitModal({ open, onOpenChange, description, title }: FreemiumLimitModalProps) {
  const navigate = useNavigate();

  const handleActivate = () => {
    onOpenChange(false);
    navigate("/dashboard/parametres?tab=licence");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif">
            <Sparkles className="h-5 w-5 text-primary" />
            {title ?? "Fonctionnalité Pro"}
          </DialogTitle>
          <DialogDescription className="font-sans">{description}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center py-4">
          <Lock className="h-12 w-12 text-primary/30" />
        </div>

        <div className="space-y-2">
          <Button className="w-full" onClick={handleActivate}>
            Activer une licence
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
            Plus tard
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
