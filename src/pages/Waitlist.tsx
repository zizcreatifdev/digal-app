import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, Mail, ArrowRight, Loader2, CheckCircle, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { usePageTitle } from "@/hooks/usePageTitle";

const waitlistSchema = z.object({
  prenom: z.string().min(1, "Prénom obligatoire"),
  nom: z.string().min(1, "Nom obligatoire"),
  email: z.string().email("Email invalide"),
});
type WaitlistFormData = z.infer<typeof waitlistSchema>;

const Waitlist = () => {
  usePageTitle("Digal · Liste d'attente");
  const [typeCompte, setTypeCompte] = useState<"solo" | "agence">("solo");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submittedPrenom, setSubmittedPrenom] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<WaitlistFormData>({
    resolver: zodResolver(waitlistSchema),
  });

  const onSubmit = async (formData: WaitlistFormData) => {
    setLoading(true);

    // Check if email already has an account
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingUser } = await (supabase as any)
      .from("users")
      .select("statut")
      .eq("email", formData.email)
      .maybeSingle();

    if (existingUser) {
      setLoading(false);
      const s: string = existingUser.statut ?? "actif";
      if (s === "suspendu") {
        toast.error("Ce compte est suspendu. Contactez l'administrateur.");
      } else if (s === "suppression_planifiee") {
        toast.error("Ce compte est en cours de suppression. Contactez l'administrateur.");
      } else {
        toast.error("Vous avez déjà un compte Digal. Connectez-vous directement.");
      }
      return;
    }

    const { error } = await supabase.from("waitlist").insert([
      { prenom: formData.prenom, nom: formData.nom, email: formData.email, type_compte: typeCompte, statut: "en_attente" },
    ]);
    setLoading(false);

    if (error) {
      if (error.code === "23505") {
        toast.info("Cet email est déjà inscrit sur la liste d'attente.");
      } else {
        toast.error("Une erreur est survenue. Réessayez.");
      }
      return;
    }

    // Trigger confirmation email
    await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "waitlist-confirmation",
        recipientEmail: formData.email,
        idempotencyKey: `waitlist-confirm-${formData.email}-${Date.now()}`,
        templateData: { prenom: formData.prenom },
      },
    });

    setSubmittedPrenom(formData.prenom);
    setSuccess(true);
    toast.success("Inscription réussie !");
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md text-center border-0 shadow-none">
          <CardContent className="pt-8 space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-2xl font-bold font-serif">Vous êtes inscrit !</h2>
            <p className="text-muted-foreground font-sans">
              Merci <span className="font-semibold text-foreground">{submittedPrenom}</span> ! Vous êtes sur la liste d'attente de Digal.
              Nous vous contacterons dès votre accès approuvé.
            </p>
            <Link to="/">
              <Button variant="outline" className="mt-4">Retour à l'accueil</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left : Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-foreground items-center justify-center p-12">
        <div className="max-w-md text-center space-y-6 animate-fade-in">
          <img
            src="/logos/Logo%20Digal_iconorange_ettext_enblanc.svg"
            alt="Digal"
            className="w-48 mx-auto"
          />
          <p className="text-lg text-primary-foreground/70 font-sans leading-relaxed">
            Rejoignez la liste d'attente et soyez parmi les premiers à découvrir la plateforme.
          </p>
        </div>
      </div>

      {/* Right : Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md border-0 shadow-none bg-transparent">
          <CardHeader className="space-y-2 text-center lg:text-left">
            <div className="lg:hidden mb-6 flex justify-center">
              <Link to="/">
                <img
                  src="/logos/Logo%20Digal_iconorange_ettext_ennoir.svg.svg"
                  alt="Digal"
                  className="h-10 w-auto dark:content-[url('/logos/Logo%20Digal_iconorange_ettext_enblanc.svg')]"
                />
              </Link>
            </div>
            <Badge variant="outline" className="w-fit border-primary/30 text-primary text-xs">
              Places limitées
            </Badge>
            <CardTitle className="text-2xl">Rejoindre la liste d'attente</CardTitle>
            <CardDescription>
              Remplissez le formulaire pour réserver votre place
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="prenom" className="font-sans text-sm">Prénom</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="prenom"
                      placeholder="Amadou"
                      {...register("prenom")}
                      className="pl-10"
                    />
                  </div>
                  {errors.prenom && <p className="text-xs text-destructive">{errors.prenom.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="nom" className="font-sans text-sm">Nom</Label>
                  <Input
                    id="nom"
                    placeholder="Diallo"
                    {...register("nom")}
                  />
                  {errors.nom && <p className="text-xs text-destructive">{errors.nom.message}</p>}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="wemail" className="font-sans text-sm">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="wemail"
                    type="email"
                    placeholder="vous@exemple.com"
                    {...register("email")}
                    className="pl-10"
                  />
                </div>
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="font-sans text-sm">Type de compte souhaité</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTypeCompte("solo")}
                    className={`flex items-center gap-2 rounded-lg border-2 px-4 py-3 transition-colors ${
                      typeCompte === "solo"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    <User className="h-4 w-4" />
                    <span className="text-sm font-sans font-medium">Solo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTypeCompte("agence")}
                    className={`flex items-center gap-2 rounded-lg border-2 px-4 py-3 transition-colors ${
                      typeCompte === "agence"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    <Briefcase className="h-4 w-4" />
                    <span className="text-sm font-sans font-medium">Agence</span>
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full gap-2" size="lg" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Rejoindre la liste
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground font-sans">
                Déjà un compte ?{" "}
                <Link to="/login" className="text-primary hover:underline font-semibold">
                  Se connecter
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Waitlist;
