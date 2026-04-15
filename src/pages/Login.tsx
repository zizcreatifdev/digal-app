import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  // Rate limiting state
  const attemptsRef = useRef(0);
  const lockoutUntilRef = useRef<number>(0);

  const logSecurityEvent = async (action: string, success: boolean, detail?: string) => {
    try {
      await supabase.from("security_logs").insert({
        email,
        action,
        success,
        detail,
        user_agent: navigator.userAgent,
      });
    } catch { /* intentional silent fail */ }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    // Check lockout
    if (Date.now() < lockoutUntilRef.current) {
      const remaining = Math.ceil((lockoutUntilRef.current - Date.now()) / 60000);
      toast.error(`Trop de tentatives. Réessayez dans ${remaining} minute(s).`);
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      attemptsRef.current += 1;
      await logSecurityEvent("login_failed", false, `Tentative ${attemptsRef.current}/${MAX_ATTEMPTS}`);

      if (attemptsRef.current >= MAX_ATTEMPTS) {
        lockoutUntilRef.current = Date.now() + LOCKOUT_MS;
        attemptsRef.current = 0;
        toast.error("Trop de tentatives. Compte temporairement bloqué pendant 15 minutes.");
        await logSecurityEvent("account_locked", false, "Blocage 15 min après 5 échecs");
        return;
      }

      toast.error(`Email ou mot de passe incorrect. (${MAX_ATTEMPTS - attemptsRef.current} tentative(s) restante(s))`);
      return;
    }

    // Success
    attemptsRef.current = 0;
    await logSecurityEvent("login_success", true);

    const userId = (await supabase.auth.getUser()).data.user?.id ?? "";
    const [{ data: roleData }, { data: profileData }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
      supabase.from("users").select("role").eq("user_id", userId).maybeSingle(),
    ]);

    if (roleData?.role === "admin" || profileData?.role === "owner") {
      navigate("/admin");
    } else {
      navigate("/dashboard");
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetLoading(false);
    if (error) {
      toast.error("Erreur lors de l'envoi. Vérifiez votre email.");
    } else {
      toast.success("Un email de réinitialisation a été envoyé.");
      setResetOpen(false);
    }
  };

  const isLocked = Date.now() < lockoutUntilRef.current;

  return (
    <div className="min-h-screen flex bg-background">
      <div className="hidden lg:flex lg:w-1/2 bg-foreground items-center justify-center p-12">
        <div className="max-w-md text-center space-y-6 animate-fade-in">
          <h1 className="text-5xl font-bold font-serif text-primary-foreground">Digal</h1>
          <p className="text-lg text-primary-foreground/70 font-sans leading-relaxed">
            Plateforme de gestion intelligente pour piloter votre activité avec élégance et efficacité.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md border-0 shadow-none bg-transparent">
          <CardHeader className="space-y-2 text-center lg:text-left">
            <div className="lg:hidden mb-6">
              <Link to="/" className="inline-flex items-center gap-1">
                <span className="text-4xl font-bold font-serif text-foreground">Digal</span>
                <span className="w-2 h-2 rounded-full bg-primary mt-1" />
              </Link>
            </div>
            <CardTitle className="text-2xl">Connexion</CardTitle>
            <CardDescription>
              Entrez vos identifiants pour accéder à votre espace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-sans text-sm">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="vous@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="font-sans text-sm">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" required />
                </div>
              </div>

              <div className="flex justify-end">
                <Dialog open={resetOpen} onOpenChange={setResetOpen}>
                  <DialogTrigger asChild>
                    <button type="button" className="text-xs text-primary hover:underline font-sans">
                      Mot de passe oublié ?
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
                      <DialogDescription>
                        Entrez votre email pour recevoir un lien de réinitialisation.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleReset} className="space-y-4">
                      <Input type="email" placeholder="vous@exemple.com" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required />
                      <Button type="submit" disabled={resetLoading} className="w-full">
                        {resetLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Envoyer le lien"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <Button type="submit" className="w-full gap-2" size="lg" disabled={loading || isLocked}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  <>Se connecter<ArrowRight className="h-4 w-4" /></>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
