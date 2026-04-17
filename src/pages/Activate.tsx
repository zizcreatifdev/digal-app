import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activity-logs";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";

const activateSchema = z.object({
  prenom: z.string().min(1, "Prénom obligatoire"),
  nom: z.string().min(1, "Nom obligatoire"),
  agence_nom: z.string().optional(),
  password: z.string().min(8, "8 caractères minimum"),
  confirm_password: z.string(),
}).refine(d => d.password === d.confirm_password, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirm_password"],
});

type FormData = z.infer<typeof activateSchema>;
type PageState = "loading" | "invalid" | "expired" | "used" | "form" | "activating" | "success";

interface TokenRow {
  email: string;
  prenom: string;
  nom: string;
  type_compte: string;
  is_used: boolean;
  expires_at: string;
}

export default function Activate() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [tokenRow, setTokenRow] = useState<TokenRow | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(activateSchema),
    defaultValues: { prenom: "", nom: "", agence_nom: "", password: "", confirm_password: "" },
  });

  useEffect(() => {
    if (!token) { setPageState("invalid"); return; }

    supabase
      .from("activation_tokens")
      .select("email, prenom, nom, type_compte, is_used, expires_at")
      .eq("token", token)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) { setPageState("invalid"); return; }
        if (data.is_used) { setPageState("used"); return; }
        if (new Date(data.expires_at) < new Date()) { setPageState("expired"); return; }
        const row = data as TokenRow;
        setTokenRow(row);
        reset({ prenom: row.prenom, nom: row.nom, agence_nom: "", password: "", confirm_password: "" });
        setPageState("form");
      });
  }, [token, reset]);

  const onSubmit = async (formData: FormData) => {
    if (!tokenRow || !token) return;
    setPageState("activating");

    try {
      const { data, error } = await supabase.functions.invoke("activate-account", {
        body: {
          token,
          prenom: formData.prenom,
          nom: formData.nom,
          agence_nom: formData.agence_nom || undefined,
          password: formData.password,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      // Auto sign-in after activation
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: tokenRow.email,
        password: formData.password,
      });

      if (signInError) throw signInError;

      const { data: { user: newUser } } = await supabase.auth.getUser();
      if (newUser) {
        await logActivity(newUser.id, "login_success", "auth", "Première connexion via activation");
      }

      setPageState("success");
      setTimeout(() => navigate("/dashboard"), 2500);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'activation");
      setPageState("form");
    }
  };

  const typeLabel: Record<string, string> = {
    solo: "CM Pro",
    agence: "Studio",
    agence_standard: "Studio",
    agence_pro: "Elite",
    freemium: "Découverte",
  };

  return (
    <div className="ios-scroll-container">
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <img
            src="/logos/Logo%20Digal_iconorange_ettext_ennoir.svg.svg"
            alt="Digal"
            className="h-10 w-auto"
          />
        </div>

        {pageState === "loading" && (
          <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-sans">Vérification du lien…</p>
          </div>
        )}

        {pageState === "invalid" && (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
              <XCircle className="h-12 w-12 text-destructive" />
              <h2 className="text-lg font-semibold font-serif">Lien invalide</h2>
              <p className="text-sm text-muted-foreground font-sans">Ce lien d'activation est introuvable ou incorrect.</p>
              <Button asChild variant="outline" size="sm"><Link to="/">Retour à l'accueil</Link></Button>
            </CardContent>
          </Card>
        )}

        {pageState === "expired" && (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
              <Clock className="h-12 w-12 text-amber-500" />
              <h2 className="text-lg font-semibold font-serif">Lien expiré</h2>
              <p className="text-sm text-muted-foreground font-sans">Ce lien d'activation a expiré (validité 48h). Contactez un administrateur pour en obtenir un nouveau.</p>
              <Button asChild variant="outline" size="sm"><Link to="/">Retour à l'accueil</Link></Button>
            </CardContent>
          </Card>
        )}

        {pageState === "used" && (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
              <CheckCircle className="h-12 w-12 text-emerald-500" />
              <h2 className="text-lg font-semibold font-serif">Compte déjà activé</h2>
              <p className="text-sm text-muted-foreground font-sans">Ce lien a déjà été utilisé. Connectez-vous directement.</p>
              <Button asChild size="sm"><Link to="/login">Se connecter</Link></Button>
            </CardContent>
          </Card>
        )}

        {pageState === "success" && (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
              <CheckCircle className="h-12 w-12 text-emerald-500" />
              <h2 className="text-lg font-semibold font-serif">Compte activé !</h2>
              <p className="text-sm text-muted-foreground font-sans">Votre compte a été créé avec succès. Redirection en cours…</p>
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </CardContent>
          </Card>
        )}

        {(pageState === "form" || pageState === "activating") && tokenRow && (
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-xl">Activer votre compte</CardTitle>
              <p className="text-sm text-muted-foreground font-sans">
                Compte <strong>{typeLabel[tokenRow.type_compte] ?? tokenRow.type_compte}</strong> pour <strong>{tokenRow.email}</strong>
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="prenom" className="font-sans text-xs">Prénom *</Label>
                    <Input id="prenom" {...register("prenom")} onFocus={(e) => { setTimeout(() => { e.target.scrollIntoView({ behavior: "smooth", block: "center" }); }, 300); }} />
                    {errors.prenom && <p className="text-xs text-destructive">{errors.prenom.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="nom" className="font-sans text-xs">Nom *</Label>
                    <Input id="nom" {...register("nom")} onFocus={(e) => { setTimeout(() => { e.target.scrollIntoView({ behavior: "smooth", block: "center" }); }, 300); }} />
                    {errors.nom && <p className="text-xs text-destructive">{errors.nom.message}</p>}
                  </div>
                </div>

                {(tokenRow.type_compte === "agence" || tokenRow.type_compte === "agence_standard" || tokenRow.type_compte === "agence_pro") && (
                  <div className="space-y-1">
                    <Label htmlFor="agence_nom" className="font-sans text-xs">Nom de l'agence</Label>
                    <Input id="agence_nom" {...register("agence_nom")} onFocus={(e) => { setTimeout(() => { e.target.scrollIntoView({ behavior: "smooth", block: "center" }); }, 300); }} placeholder="Mon agence digitale" />
                  </div>
                )}

                <div className="space-y-1">
                  <Label htmlFor="password" className="font-sans text-xs">Mot de passe *</Label>
                  <Input id="password" type="password" {...register("password")} onFocus={(e) => { setTimeout(() => { e.target.scrollIntoView({ behavior: "smooth", block: "center" }); }, 300); }} placeholder="8 caractères minimum" />
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="confirm_password" className="font-sans text-xs">Confirmer le mot de passe *</Label>
                  <Input id="confirm_password" type="password" {...register("confirm_password")} onFocus={(e) => { setTimeout(() => { e.target.scrollIntoView({ behavior: "smooth", block: "center" }); }, 300); }} />
                  {errors.confirm_password && <p className="text-xs text-destructive">{errors.confirm_password.message}</p>}
                </div>

                <Button type="submit" className="w-full" disabled={pageState === "activating"}>
                  {pageState === "activating" ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" />Activation…</>
                  ) : (
                    "Activer mon compte"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
    </div>
  );
}
