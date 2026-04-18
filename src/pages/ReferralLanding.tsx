import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, ArrowLeft, User, Mail, Lock, Loader2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SolutionSection } from "@/components/landing/SolutionSection";
import { TeamRolesSection } from "@/components/landing/TeamRolesSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { usePageTitle } from "@/hooks/usePageTitle";

const PLAN_LABELS: Record<string, string> = {
  freemium: "Découverte (Gratuit)",
  solo_standard: "CM Pro",
  agence_standard: "Studio",
  agence_pro: "Elite",
};

const SLIDES = ["Découverte", "Fonctionnalités", "Équipe", "Tarifs", "Inscription"];

const ReferralLanding = () => {
  usePageTitle("Digal · Invitation parrainage");
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [referrerPrenom, setReferrerPrenom] = useState<string | null>(null);
  const [referrerId, setReferrerId] = useState<string | null>(null);
  const [invalidCode, setInvalidCode] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("freemium");

  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!code) { setInvalidCode(true); return; }
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("users")
        .select("user_id, prenom")
        .eq("referral_code", code)
        .maybeSingle();
      if (error || !data) { setInvalidCode(true); return; }
      setReferrerPrenom(data.prenom ?? "Votre parrain");
      setReferrerId(data.user_id);
    })();
  }, [code]);

  const handleSelectPlan = (slug: string) => {
    setSelectedPlan(slug);
    setStep(4);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { toast.error("Les mots de passe ne correspondent pas."); return; }
    if (password.length < 8) { toast.error("Le mot de passe doit contenir au moins 8 caractères."); return; }

    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error || !data.user) {
      setSubmitting(false);
      toast.error(error?.message || "Erreur lors de la création du compte.");
      return;
    }

    const userId = data.user.id;
    const referralCode = "DIG" + Math.random().toString(36).toUpperCase().slice(2, 8);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: profileError } = await (supabase as any).from("users").insert({
      user_id: userId,
      email,
      prenom,
      nom,
      role: "freemium",
      plan: "freemium",
      referred_by: referrerId,
      referral_code: referralCode,
    });
    if (profileError) console.error("[ReferralLanding] profile error:", profileError);

    await supabase.from("user_roles").insert({ user_id: userId, role: "user" });

    if (referrerId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("referrals").insert({
        referrer_id: referrerId,
        referred_id: userId,
        status: "pending",
      });
    }

    setSubmitting(false);
    toast.success("Compte créé ! Connectez-vous pour commencer.");
    navigate("/login");
  };

  if (invalidCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <h1 className="text-3xl font-bold font-serif">Digal</h1>
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold font-serif">Lien invalide</h2>
          <p className="text-muted-foreground font-sans">Ce lien de parrainage est invalide.</p>
          <Link to="/"><Button variant="outline">Retour à l'accueil</Button></Link>
        </div>
      </div>
    );
  }

  if (referrerPrenom === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Progress dots */}
      <div className="fixed top-4 left-0 right-0 z-50 flex justify-center gap-2 pointer-events-none">
        {SLIDES.map((_, i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full transition-all duration-300 ${
              i === step ? "bg-primary scale-125" : i < step ? "bg-primary/50" : "bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>

      {/* Slide content */}
      <div className="pt-10">
        {/* Slide 0: Accroche */}
        {step === 0 && (
          <div className="min-h-screen flex items-center justify-center px-4">
            <div className="max-w-xl w-full text-center space-y-8 animate-fade-in">
              <h1 className="text-4xl font-bold font-serif">Digal</h1>
              <div className="space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold font-serif">
                  {referrerPrenom} vous invite sur Digal
                </h2>
                <p className="text-muted-foreground font-sans text-lg leading-relaxed">
                  Tout ce dont vous avez besoin,<br />
                  au même endroit. De la planification<br />
                  à la facturation, Digal couvre<br />
                  l&apos;intégralité de votre workflow éditorial.
                </p>
              </div>
              <Button size="lg" className="gap-2" onClick={() => setStep(1)}>
                Découvrir Digal
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Slide 1: Features */}
        {step === 1 && <SolutionSection />}

        {/* Slide 2: Team roles */}
        {step === 2 && <TeamRolesSection />}

        {/* Slide 3: Pricing */}
        {step === 3 && <PricingSection onSelectPlan={handleSelectPlan} />}

        {/* Slide 4: Registration form */}
        {step === 4 && (
          <div className="min-h-screen flex items-center justify-center px-4 py-16">
            <div className="w-full max-w-md space-y-6 animate-fade-in">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold font-serif">Créer mon compte</h2>
                <p className="text-muted-foreground font-sans text-sm">
                  Invité par <span className="font-semibold text-foreground">{referrerPrenom}</span>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="ref-prenom" className="font-sans text-sm">Prénom *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="ref-prenom"
                        placeholder="Amadou"
                        value={prenom}
                        onChange={(e) => setPrenom(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ref-nom" className="font-sans text-sm">Nom *</Label>
                    <Input
                      id="ref-nom"
                      placeholder="Diallo"
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ref-email" className="font-sans text-sm">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="ref-email"
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
                  <Label htmlFor="ref-password" className="font-sans text-sm">
                    Mot de passe * <span className="text-muted-foreground font-normal">(min 8 caractères)</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="ref-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ref-confirm" className="font-sans text-sm">Confirmer le mot de passe *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="ref-confirm"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-sans text-sm">Plan sélectionné</Label>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-primary border-primary/30 text-xs shrink-0">
                      {PLAN_LABELS[selectedPlan] ?? selectedPlan}
                    </Badge>
                    <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PLAN_LABELS).map(([slug, label]) => (
                          <SelectItem key={slug} value={slug}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button type="submit" className="w-full gap-2" size="lg" disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>Créer mon compte <ArrowRight className="h-4 w-4" /></>
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground font-sans">
                  Déjà un compte ?{" "}
                  <Link to="/login" className="text-primary hover:underline font-semibold">Se connecter</Link>
                </p>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      {step < 4 && (
        <div className="fixed bottom-6 left-0 right-0 z-40 flex justify-between px-6 max-w-6xl mx-auto">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep(step - 1)} className="gap-1 bg-background/80 backdrop-blur-sm">
              <ArrowLeft className="h-4 w-4" /> Retour
            </Button>
          ) : <div />}
          {step < 3 && (
            <Button onClick={() => setStep(step + 1)} className="gap-1">
              Suivant <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ReferralLanding;
