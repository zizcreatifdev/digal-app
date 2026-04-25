import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageCropModal, LOGO_ACCEPT, LOGO_MAX_BYTES } from "@/components/ui/ImageCropModal";
import {
  Briefcase, CalendarDays, Link2, ArrowRight, Camera, Loader2, Check,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface OnboardingCMProps {
  onComplete: () => void;
}

const WORKFLOW_STEPS = ["Brouillon", "Soumis", "Lien envoyé", "Validé", "Publié"];

export function OnboardingCM({ onComplete }: OnboardingCMProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);

  // Profile step
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [completing, setCompleting] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from("users")
      .select("prenom, nom, avatar_url")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: { data: { prenom: string; nom: string; avatar_url: string | null } | null }) => {
        if (data) {
          setPrenom(data.prenom ?? "");
          setNom(data.nom ?? "");
          setAvatarUrl(data.avatar_url ?? "");
        }
      });
  }, [user]);

  /* ── Avatar upload ── */
  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > LOGO_MAX_BYTES) { toast.error("Fichier trop lourd (max 5 Mo)"); e.target.value = ""; return; }
    setPendingAvatarFile(file);
    e.target.value = "";
  };

  const handleAvatarCropConfirm = async (blob: Blob) => {
    setPendingAvatarFile(null);
    if (!user) return;
    setUploadingAvatar(true);
    const path = `${user.id}/avatar.png`;
    const { error } = await supabase.storage.from("user-uploads").upload(path, blob, { contentType: "image/png", upsert: true });
    setUploadingAvatar(false);
    if (error) { toast.error("Erreur d'upload"); return; }
    const { data: { publicUrl } } = supabase.storage.from("user-uploads").getPublicUrl(path);
    setAvatarUrl(`${publicUrl}?t=${Date.now()}`);
    toast.success("Photo mise à jour");
  };

  /* ── Save profile ── */
  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("users").update({
      prenom,
      nom,
      avatar_url: avatarUrl.split("?")[0] || null,
    }).eq("user_id", user.id);
    setSavingProfile(false);
    if (error) { toast.error("Erreur de sauvegarde"); return; }
    toast.success("Profil mis à jour");
    setSlide(5);
  };

  /* ── Complete ── */
  const handleComplete = async () => {
    if (!user) return;
    setCompleting(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("users").update({ onboarding_completed: true }).eq("user_id", user.id).catch(() => {/* silent */});
    localStorage.removeItem("onboarding_role");
    setCompleting(false);
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-auto flex items-center justify-center p-4">
      <ImageCropModal file={pendingAvatarFile} onConfirm={handleAvatarCropConfirm} onCancel={() => setPendingAvatarFile(null)} />
      <input ref={avatarInputRef} type="file" accept={LOGO_ACCEPT} className="hidden" onChange={handleAvatarFileSelect} />

      <div className="w-full max-w-lg animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src="/logos/Logo%20Digal_iconorange_ettext_ennoir.svg.svg"
            alt="Digal"
            className="h-8 w-auto dark:content-[url(/logos/Logo%20Digal_iconorange_ettext_enblanc.svg.svg)]"
          />
        </div>

        {/* Dot indicator */}
        {slide > 0 && (
          <div className="flex justify-center gap-1.5 mb-6">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-1.5 w-6 rounded-full transition-all ${slide >= s ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>
        )}

        {/* ── Slide 0: Intro ── */}
        {slide === 0 && (
          <div className="text-center space-y-6 py-8">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Briefcase className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-bold font-serif">Bienvenue sur Digal !</h1>
              <p className="text-muted-foreground font-sans text-sm leading-relaxed max-w-sm mx-auto">
                Vous êtes <strong>Community Manager</strong>. Voici votre espace de travail.
              </p>
            </div>
            <Button size="lg" className="w-full max-w-xs" onClick={() => setSlide(1)}>
              Découvrir <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* ── Slide 1: Vos clients ── */}
        {slide === 1 && (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center space-y-4 py-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Briefcase className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold font-serif">Vos clients assignés</h2>
              <p className="text-muted-foreground font-sans text-sm leading-relaxed max-w-sm">
                Vous voyez uniquement les clients que votre Digital Manager vous a assignés. Vous gérez
                leur calendrier éditorial et leurs validations.
              </p>
            </div>
            <Button className="w-full" onClick={() => setSlide(2)}>
              Suivant <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* ── Slide 2: Le calendrier ── */}
        {slide === 2 && (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CalendarDays className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold font-serif">Le calendrier éditorial</h2>
              <p className="text-muted-foreground font-sans text-sm leading-relaxed max-w-sm">
                Planifiez les posts de vos clients, soumettez-les pour validation, et suivez les statuts
                en temps réel.
              </p>
              {/* Workflow visual */}
              <div className="flex items-center gap-1 flex-wrap justify-center mt-2">
                {WORKFLOW_STEPS.map((step, i) => (
                  <div key={step} className="flex items-center gap-1">
                    <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-sans font-medium whitespace-nowrap">
                      {step}
                    </span>
                    {i < WORKFLOW_STEPS.length - 1 && (
                      <span className="text-muted-foreground text-xs">→</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={() => setSlide(3)}>
              Suivant <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* ── Slide 3: La validation client ── */}
        {slide === 3 && (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center space-y-4 py-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Link2 className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold font-serif">La validation client</h2>
              <p className="text-muted-foreground font-sans text-sm leading-relaxed max-w-sm">
                Générez un lien de prévisualisation valable 48h. Votre client voit ses posts en conditions
                réelles et approuve ou refuse directement.
              </p>
            </div>
            <Button className="w-full" onClick={() => setSlide(4)}>
              Suivant <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* ── Slide 4: Profile ── */}
        {slide === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold font-serif">Complétez votre profil</h2>
              <p className="text-sm text-muted-foreground font-sans mt-1">
                Votre nom et photo sont visibles par votre équipe.
              </p>
            </div>
            <div className="space-y-4">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="h-16 w-16 rounded-full object-cover border-2 border-border" />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-muted border-2 border-border flex items-center justify-center text-lg font-bold text-muted-foreground">
                      {prenom?.[0]}{nom?.[0]}
                    </div>
                  )}
                  <button
                    className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
                  </button>
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium font-sans">Photo de profil</p>
                  <p className="text-xs text-muted-foreground font-sans">Visible par votre équipe</p>
                </div>
              </div>
              {/* Name fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="font-sans text-sm">Prénom</Label>
                  <Input value={prenom} onChange={(e) => setPrenom(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-sans text-sm">Nom</Label>
                  <Input value={nom} onChange={(e) => setNom(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={() => { void handleSaveProfile(); }} disabled={savingProfile}>
                {savingProfile && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Enregistrer <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <button
                className="text-xs text-muted-foreground hover:text-foreground font-sans underline-offset-2 hover:underline"
                onClick={() => setSlide(5)}
              >
                Passer
              </button>
            </div>
          </div>
        )}

        {/* ── Slide 5: Final ── */}
        {slide === 5 && (
          <div className="text-center space-y-6 py-6">
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mx-auto">
              <Check className="h-10 w-10 text-emerald-600" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold font-serif">Vous êtes prêt ! 🎉</h2>
              <p className="text-muted-foreground font-sans text-sm leading-relaxed max-w-sm mx-auto">
                Votre Digital Manager vous assignera vos premiers clients.
              </p>
            </div>
            <Button
              size="lg"
              className="w-full max-w-xs"
              onClick={() => { void handleComplete(); }}
              disabled={completing}
            >
              {completing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Accéder à mon espace <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
