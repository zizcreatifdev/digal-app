import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { User, Mail, Lock, ArrowRight, Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Register = () => {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("token");
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  if (!inviteToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
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
    );
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }

    if (password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setLoading(true);
    const { data, error } = await signUp(email, password);
    
    if (error) {
      setLoading(false);
      toast.error(error.message || "Erreur lors de l'inscription.");
      return;
    }

    if (data?.user) {
      // Create user profile
      const { error: profileError } = await supabase.from("users").insert({
        user_id: data.user.id,
        email,
        prenom,
        nom,
        role: "freemium",
      });

      if (profileError) {
        console.error("Profile creation error:", profileError);
      }

      // Assign default user role
      await supabase.from("user_roles").insert({
        user_id: data.user.id,
        role: "user",
      });
    }

    setLoading(false);
    toast.success("Compte créé ! Vérifiez votre email pour confirmer.");
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-foreground items-center justify-center p-12">
        <div className="max-w-md text-center space-y-6 animate-fade-in">
          <h1 className="text-5xl font-bold font-serif text-primary-foreground">Digal</h1>
          <p className="text-lg text-primary-foreground/70 font-sans leading-relaxed">
            Bienvenue ! Créez votre compte pour accéder à la plateforme.
          </p>
        </div>
      </div>

      {/* Right — Register form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md border-0 shadow-none bg-transparent">
          <CardHeader className="space-y-2 text-center lg:text-left">
            <div className="lg:hidden mb-6">
              <Link to="/" className="inline-flex items-center gap-1">
                <span className="text-4xl font-bold font-serif text-foreground">Digal</span>
                <span className="w-2 h-2 rounded-full bg-primary mt-1" />
              </Link>
            </div>
            <CardTitle className="text-2xl">Créer un compte</CardTitle>
            <CardDescription>
              Remplissez vos informations pour commencer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="rprenom" className="font-sans text-sm">Prénom</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="rprenom"
                      placeholder="Amadou"
                      value={prenom}
                      onChange={(e) => setPrenom(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rnom" className="font-sans text-sm">Nom</Label>
                  <Input
                    id="rnom"
                    placeholder="Diallo"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="remail" className="font-sans text-sm">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="remail"
                    type="email"
                    placeholder="vous@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rpassword" className="font-sans text-sm">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="rpassword"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rconfirm" className="font-sans text-sm">Confirmer le mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="rconfirm"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full gap-2" size="lg" disabled={loading}>
                {loading ? (
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
  );
};

export default Register;
