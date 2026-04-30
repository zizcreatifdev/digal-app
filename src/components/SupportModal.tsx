import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { MessageSquarePlus, AlertCircle, HelpCircle, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SupportModalProps {
  collapsed?: boolean;
}

const TYPE_CONFIG = {
  bug: { label: "Signaler un problème", icon: AlertCircle, color: "text-destructive" },
  question: { label: "Poser une question", icon: HelpCircle, color: "text-primary" },
  suggestion: { label: "Proposer une idée", icon: Lightbulb, color: "text-yellow-500" },
} as const;

type SupportType = keyof typeof TYPE_CONFIG;

export function SupportModal({ collapsed = false }: SupportModalProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<SupportType>("question");
  const [sujet, setSujet] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const TypeIcon = TYPE_CONFIG[type].icon;

  const handleSubmit = async () => {
    if (!sujet.trim()) { toast.error("Le sujet est requis"); return; }
    if (message.trim().length < 20) {
      toast.error("Le message doit contenir au moins 20 caractères");
      return;
    }

    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("support_messages").insert({
      user_id: user?.id,
      type,
      sujet: sujet.trim(),
      message: message.trim(),
    });
    setLoading(false);

    if (error) { toast.error("Erreur lors de l'envoi"); return; }
    toast.success("Message envoyé ! Nous vous répondrons rapidement.");
    setOpen(false);
    setSujet("");
    setMessage("");
    setType("question");
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setSujet("");
      setMessage("");
      setType("question");
    }
    setOpen(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          className={cn(
            "w-full flex items-center gap-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors rounded-md text-sm font-sans cursor-pointer",
            collapsed ? "px-0 py-2 justify-center" : "px-2 py-2"
          )}
          title="Nous contacter"
        >
          <MessageSquarePlus className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Nous contacter</span>}
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <TypeIcon className={cn("h-5 w-5", TYPE_CONFIG[type].color)} />
            Nous contacter
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="font-sans text-sm">Type de message</Label>
            <Select value={type} onValueChange={(v) => setType(v as SupportType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(TYPE_CONFIG) as [SupportType, typeof TYPE_CONFIG[SupportType]][]).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <cfg.icon className={cn("h-4 w-4", cfg.color)} />
                      <span className="font-sans">{cfg.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="font-sans text-sm">Sujet *</Label>
            <Input
              value={sujet}
              onChange={(e) => setSujet(e.target.value)}
              placeholder="Décrivez brièvement votre message"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-sans text-sm">Votre message *</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Détaillez votre message (minimum 20 caractères)..."
              rows={5}
            />
            {message.length > 0 && message.length < 20 && (
              <p className="text-xs text-muted-foreground font-sans">
                {message.length}/20 caractères minimum
              </p>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="gap-2">
              <MessageSquarePlus className="h-4 w-4" />
              Envoyer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
