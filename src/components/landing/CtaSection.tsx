import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function CtaSection() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("waitlist")
        .insert([{ email: email.trim() }]);

      if (error) {
        if (error.code === "23505") {
          toast.info("Cet email est déjà inscrit sur la liste d'attente.");
        } else {
          toast.error("Une erreur est survenue. Réessayez.");
        }
      } else {
        toast.success("Vous êtes sur la liste ! Nous vous contacterons bientôt.");
        setEmail("");
      }
    } catch {
      toast.error("Une erreur est survenue. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-20 md:py-28 bg-foreground" id="contact">
      <div className="container mx-auto px-4 max-w-2xl text-center">
        <Badge variant="outline" className="mb-6 px-4 py-1.5 text-xs font-sans border-background/20 text-background/70 gap-1.5">
          <Sparkles className="h-3 w-3" />
          Liste d'attente ouverte
        </Badge>

        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-background mb-6">
          Prêt à travailler comme un pro ?
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-4">
          <Input
            type="email"
            placeholder="votre@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-background/10 border-background/20 text-background placeholder:text-background/40 focus-visible:ring-primary"
          />
          <Button type="submit" disabled={loading} className="gap-1.5 shrink-0">
            {loading ? "Envoi…" : "Rejoindre"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <p className="text-xs text-background/40 font-sans">
          Places limitées. Vous serez notifié dès votre accès accordé.
        </p>
      </div>
    </section>
  );
}
