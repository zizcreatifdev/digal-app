import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, ArrowRight, ArrowLeft, Check, Camera, Building2, Palette, Users as UsersIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface UserProfileData {
  role?: string;
  prenom?: string;
  nom?: string;
  agence_nom?: string | null;
  avatar_url?: string | null;
  logo_url?: string | null;
}

interface OnboardingWizardProps {
  profile: UserProfileData;
  onComplete: () => void;
}

const PLAN_LABELS: Record<string, string> = {
  freemium: "Découverte",
  solo: "CM Pro",
  agence_standard: "Studio",
  agence_pro: "Elite",
};

export function OnboardingWizard({ profile, onComplete }: OnboardingWizardProps) {
  const { user } = useAuth();
  const role = profile?.role ?? "freemium";
  const isAgence = role.startsWith("agence");

  // Steps: Welcome → Profile → Agency/Brand → Done
  const steps = isAgence
    ? ["Bienvenue", "Profil", "Agence", "Terminé"]
    : ["Bienvenue", "Profil", "Marque", "Terminé"];

  const [step, setStep] = useState(0);
  const [prenom, setPrenom] = useState(profile?.prenom ?? "");
  const [nom, setNom] = useState(profile?.nom ?? "");
  const [agenceName, setAgenceName] = useState(profile?.agence_nom ?? "");
  const [brandColor, setBrandColor] = useState("#C4522A");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");
  const [logoUrl, setLogoUrl] = useState(profile?.logo_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const progress = ((step + 1) / steps.length) * 100;

  const uploadFile = async (file: File, folder: string) => {
    if (!user) return null;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("user-uploads").upload(path, file, { upsert: true });
    setUploading(false);
    if (error) { toast.error("Erreur d'upload"); return null; }
    const { data: { publicUrl } } = supabase.storage.from("user-uploads").getPublicUrl(path);
    return publicUrl;
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);

    // Ensure JWT is current before the first authenticated request (race condition after fresh sign-in)
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setSaving(false);
      toast.error("Session expirée. Reconnectez-vous.");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("users").update({
      prenom,
      nom,
      agence_nom: agenceName || null,
      avatar_url: avatarUrl || null,
      logo_url: logoUrl || null,
      onboarding_completed: true,
    }).eq("user_id", user.id);

    setSaving(false);

    if (error) {
      console.error("[OnboardingWizard] handleFinish error:", error);
      toast.error("Erreur lors de la sauvegarde");
      return;
    }

    toast.success("Configuration terminée !");
    onComplete();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold font-serif">Digal</h1>
          <p className="text-muted-foreground text-sm font-sans">Configuration de votre compte</p>
          <Badge variant="outline" className="text-xs">{PLAN_LABELS[role] ?? role}</Badge>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground font-sans">
            {steps.map((s, i) => (
              <span key={s} className={i <= step ? "text-primary font-medium" : ""}>{s}</span>
            ))}
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        <Card className="border-border/50">
          <CardContent className="pt-6">
            {/* Step 0: Welcome */}
            {step === 0 && (
              <div className="text-center space-y-4 py-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Check className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold font-serif">Bienvenue sur Digal, {prenom} !</h2>
                <p className="text-muted-foreground font-sans text-sm leading-relaxed">
                  {isAgence
                    ? "Configurons votre espace agence en quelques étapes. Vous pourrez ensuite inviter vos collaborateurs."
                    : "Configurons votre profil en quelques étapes pour personnaliser votre expérience."}
                </p>
                <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
                  <p className="text-sm font-medium">Votre plan : <span className="text-primary">{PLAN_LABELS[role] ?? role}</span></p>
                  {role === "freemium" && (
                    <ul className="text-xs text-muted-foreground space-y-1 font-sans">
                      <li>• 2 clients maximum</li>
                      <li>• Calendrier éditorial</li>
                      <li>• Liens de prévisualisation</li>
                    </ul>
                  )}
                  {role === "solo_standard" && (
                    <ul className="text-xs text-muted-foreground space-y-1 font-sans">
                      <li>• Clients illimités</li>
                      <li>• Facturation & devis</li>
                      <li>• Rapports KPI</li>
                    </ul>
                  )}
                  {role === "solo_pro" && (
                    <ul className="text-xs text-muted-foreground space-y-1 font-sans">
                      <li>• Toutes les fonctionnalités Solo</li>
                      <li>• Comptabilité avancée</li>
                      <li>• Rapports KPI PDF</li>
                    </ul>
                  )}
                  {isAgence && (
                    <ul className="text-xs text-muted-foreground space-y-1 font-sans">
                      <li>• Gestion d'équipe</li>
                      <li>• Attribution de tâches</li>
                      <li>• Journal d'équipe</li>
                      <li>• Masse salariale</li>
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* Step 1: Profile */}
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold font-serif">Votre profil</h2>

                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <Camera className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <label className="absolute inset-0 cursor-pointer rounded-full opacity-0 group-hover:opacity-100 bg-foreground/30 flex items-center justify-center transition-opacity">
                      <Upload className="h-5 w-5 text-background" />
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = await uploadFile(file, "avatar");
                          if (url) setAvatarUrl(url);
                        }
                      }} />
                    </label>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Photo de profil</p>
                    <p className="text-xs text-muted-foreground font-sans">Cliquez pour uploader</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Prénom</Label>
                    <Input value={prenom} onChange={(e) => setPrenom(e.target.value)} />
                  </div>
                  <div>
                    <Label>Nom</Label>
                    <Input value={nom} onChange={(e) => setNom(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Brand/Agency */}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold font-serif flex items-center gap-2">
                  {isAgence ? <Building2 className="h-5 w-5" /> : <Palette className="h-5 w-5" />}
                  {isAgence ? "Votre agence" : "Votre marque"}
                </h2>

                <div>
                  <Label>{isAgence ? "Nom de l'agence" : "Nom de marque / entreprise"}</Label>
                  <Input
                    value={agenceName}
                    onChange={(e) => setAgenceName(e.target.value)}
                    placeholder={isAgence ? "Mon Agence Digitale" : "Ma Marque"}
                  />
                </div>

                {/* Logo upload */}
                <div>
                  <Label className="flex items-center gap-2"><Upload className="h-4 w-4" /> Logo</Label>
                  <div className="flex items-center gap-3 mt-2">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="h-16 w-16 rounded-lg border object-contain bg-background" />
                    ) : (
                      <div className="h-16 w-16 rounded-lg border border-dashed border-input flex items-center justify-center">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <label className="cursor-pointer">
                      <Button variant="outline" size="sm" asChild><span>{logoUrl ? "Changer" : "Uploader"}</span></Button>
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = await uploadFile(file, "logo");
                          if (url) setLogoUrl(url);
                        }
                      }} />
                    </label>
                  </div>
                </div>

                <div>
                  <Label className="flex items-center gap-2"><Palette className="h-4 w-4" /> Couleur de marque</Label>
                  <div className="flex items-center gap-3 mt-1">
                    <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="h-10 w-14 rounded border border-input cursor-pointer" />
                    <span className="text-sm text-muted-foreground font-mono">{brandColor}</span>
                  </div>
                </div>

                {isAgence && (
                  <div className="bg-muted/50 rounded-lg p-4 space-y-1">
                    <p className="text-sm font-medium flex items-center gap-2"><UsersIcon className="h-4 w-4" /> Équipe</p>
                    <p className="text-xs text-muted-foreground font-sans">
                      Vous pourrez inviter vos collaborateurs depuis l'onglet Équipe des Paramètres une fois la configuration terminée.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Done */}
            {step === 3 && (
              <div className="text-center space-y-4 py-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Check className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold font-serif">Tout est prêt !</h2>
                <p className="text-muted-foreground font-sans text-sm">
                  Votre compte est configuré. Vous pouvez maintenant commencer à utiliser Digal.
                </p>
                <Button onClick={handleFinish} disabled={saving} size="lg" className="gap-2">
                  {saving ? "..." : "Accéder au tableau de bord"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        {step < 3 && (
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Retour
            </Button>
            <Button onClick={() => setStep(step + 1)} disabled={uploading}>
              {step === 2 ? "Terminer" : "Suivant"} <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Skip */}
        {step < 3 && (
          <div className="text-center">
            <Button variant="link" className="text-xs text-muted-foreground" onClick={handleFinish}>
              Passer et configurer plus tard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
