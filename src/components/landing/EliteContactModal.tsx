import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

/* ─── Schema ─────────────────────────────────────────────── */

const schema = z.object({
  nom: z.string().min(2, "Requis"),
  agence: z.string().min(2, "Requis"),
  email: z.string().email("Email invalide"),
  telephone: z.string().min(8, "Requis"),
  nb_membres: z.string().min(1, "Requis"),
  message: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

/* ─── Props ─────────────────────────────────────────────── */

interface EliteContactModalProps {
  open: boolean;
  onClose: () => void;
}

/* ─── Component ─────────────────────────────────────────── */

export function EliteContactModal({ open, onClose }: EliteContactModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nom: "",
      agence: "",
      email: "",
      telephone: "",
      nb_membres: "",
      message: "",
    },
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const onSubmit = async (values: FormData) => {
    setIsSubmitting(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("elite_requests")
        .insert({
          nom: values.nom,
          agence: values.agence,
          email: values.email,
          telephone: values.telephone,
          nb_membres: values.nb_membres,
          message: values.message || null,
        });
      if (error) throw error;
      toast.success("Demande envoyée ! Nous vous contacterons dans les 24h.");
      form.reset();
      onClose();
    } catch {
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Demande de devis Elite</DialogTitle>
          <DialogDescription className="font-sans text-sm">
            Décrivez votre agence et vos besoins. Nous vous répondrons sous 24h.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom complet *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ousmane Diallo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="agence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de l'agence *</FormLabel>
                  <FormControl>
                    <Input placeholder="Agence Digitale Dakar" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email professionnel *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="contact@agence.sn" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telephone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Téléphone WhatsApp *</FormLabel>
                  <FormControl>
                    <Input placeholder="+221 77 000 00 00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nb_membres"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de membres</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une tranche" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="2-5">2-5 membres</SelectItem>
                      <SelectItem value="6-10">6-10 membres</SelectItem>
                      <SelectItem value="11-20">11-20 membres</SelectItem>
                      <SelectItem value="20+">20+ membres</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Message{" "}
                    <span className="text-muted-foreground font-normal">(optionnel)</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Décrivez vos besoins, le nombre de clients gérés, vos attentes..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full gap-1.5" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  Envoyer la demande
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
