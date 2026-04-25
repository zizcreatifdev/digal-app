import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { User, Mail, Lock, ArrowRight, Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const registerSchema = z.object({
  prenom: z.string().min(1, "Prénom obligatoire"),
  nom: z.string().min(1, "Nom obligatoire"),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Minimum 8 caractères"),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const Register = () => {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("token");
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  if (!inviteToken) {
    return (
      <div className="ios-scroll-container">
        <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4">
          <Card className="w-full max-w-md text-center border-0 shadow-none">
            <CardContent className="pt-8 space-y-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <ShieldAlert className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-2xl font-bold font-serif">Accès restreint</h2>
              <p className="text-muted-foreground font-sans">
                L'inscription est accessible uniquement via un lien d'invitation.
                Contactez l'administrateur pour obtenir un lien.
              </p>
              <Link to="/">
                <Button variant="outline" className="mt-4">Retour à l'accueil</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const onSubmit = async (formData: RegisterFormData) => {
    const { data, error } = await signUp(formData.email, formData.password);

    if (error) {
      toast.error(error.message || "Erreur lors de l'inscription.");
      return;
    }

    if (data?.user) {
      const { error: profileError } = await supabase.from("users").insert({
        user_id: data.user.id,
        email: formData.email,
        prenom: formData.prenom,
        nom: formData.nom,
        role: "freemium",
      });

      if (profileError && import.meta.env.DEV) {
        console.error("Profile creation error:", profileError);
      }

      await supabase.from("user_roles").insert({
        user_id: data.user.id,
        role: "user",
      });
    }

    toast.success("Compte créé ! Vérifiez votre email pour confirmer.");
    navigate("/login");
  };

  return (
    <div className="ios-scroll-container">
      <div className="min-h-[100dvh] flex bg-background">
        {/* Left : Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-foreground items-center justify-center p-12">
          <div className="max-w-md text-center space-y-6 animate-fade-in">
            <img
              src="/logos/Logo%20Digal_iconorange_ettext_enblanc.svg"
              alt="Digal"
              className="h-12 w-auto mx-auto"
            />
            <p className="text-lg text-primary-foreground/70 font-sans leading-relaxed">
              Bienvenue ! Créez votre compte pour accéder à la plateforme.
            </p>
          </div>
        </div>

        {/* Right : Register form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <Card className="w-full max-w-md border-0 shadow-none bg-transparent">
            <CardHeader className="space-y-2 text-center lg:text-left">
              <div className="mb-6 flex lg:justify-start justify-center">
                <Link to="/">
                  <img
                    src="/logos/Logo%20Digal_iconorange_ettext_ennoir.svg.svg"
                    alt="Digal"
                    className="h-10 w-auto dark:content-[url('/logos/Logo%20Digal_iconorange_ettext_enblanc.svg')]"
                  />
                </Link>
              </div>
              <CardTitle className="text-2xl">Créer un compte</CardTitle>
              <CardDescription>
                Remplissez vos informations pour commencer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="rprenom" className="font-sans text-sm">Prénom</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="rprenom"
                        placeholder="Amadou"
                        {...register("prenom")}
                        className="pl-10"
                        autoComplete="given-name"
                        inputMode="text"
                      />
                    </div>
                    {errors.prenom && <p className="text-xs text-destructive">{errors.prenom.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="rnom" className="font-sans text-sm">Nom</Label>
                    <Input
                      id="rnom"
                      placeholder="Diallo"
                      {...register("nom")}
                      autoComplete="family-name"
                      inputMode="text"
                    />
                    {errors.nom && <p className="text-xs text-destructive">{errors.nom.message}</p>}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="remail" className="font-sans text-sm">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="remail"
                      type="email"
                      placeholder="vous@exemple.com"
                      {...register("email")}
                      className="pl-10"
                      autoComplete="email"
                      inputMode="email"
                    />
                  </div>
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="rpassword" className="font-sans text-sm">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="rpassword"
                      type="password"
                      placeholder="••••••••"
                      {...register("password")}
                      className="pl-10"
                      autoComplete="new-password"
                    />
                  </div>
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="rconfirm" className="font-sans text-sm">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="rconfirm"
                      type="password"
                      placeholder="••••••••"
                      {...register("confirmPassword")}
                      className="pl-10"
                      autoComplete="new-password"
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
                </div>

                <Button type="submit" className="w-full gap-2" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Créer mon compte
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
    </div>
  );
};

export default Register;
