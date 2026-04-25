import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ImageCropModal, LOGO_ACCEPT, LOGO_MAX_BYTES } from "@/components/ui/ImageCropModal";
import {
  ClipboardList, Upload, Inbox, Users, ArrowRight, Camera, Loader2, Check,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface OnboardingCreateurProps {
  onComplete: () => void;
}

interface TeamMember {
  user_id: string;
  prenom: string;
  nom: string;
  avatar_url: string | null;
  role: string;
}

const ROLE_LABEL: Record<string, string> = {
  dm: "Digital Manager",
  agence_standard: "Digital Manager",
  agence_pro: "Digital Manager",
  cm: "Community Manager",
};

export function OnboardingCreateur({ onComplete }: OnboardingCreateurProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);

  // Team members (for slide 4)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

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
    const load = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: prof } = await (supabase as any)
        .from("users")
        .select("prenom, nom, avatar_url, agence_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (prof) {
        setPrenom(prof.prenom ?? "");
        setNom(prof.nom ?? "");
        setAvatarUrl(prof.avatar_url ?? "");

        if (prof.agence_id) {
          const { data: members } = await supabase
            .from("users")
            .select("user_id, prenom, nom, avatar_url, role")
            .eq("agence_id", prof.agence_id)
            .neq("user_id", user.id)
            .in("role", ["dm", "agence_standard", "agence_pro", "cm"]);
          setTeamMembers((members ?? []) as TeamMember[]);
        }
      }
    };
    load();
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
    setSlide(6);
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
    navigate("/dashboard/createur");
  };

  const isDm = (role: string) => role === "dm" || role.startsWith("agence");

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
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <div
                key={s}
                className={`h-1.5 w-5 rounded-full transition-all ${slide >= s ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>
        )}

        {/* ── Slide 0: Intro ── */}
        {slide === 0 && (
          <div className="text-center space-y-6 py-8">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <ClipboardList className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-bold font-serif">Bienvenue sur Digal !</h1>
              <p className="text-muted-foreground font-sans text-sm leading-relaxed max-w-sm mx-auto">
                Vous êtes <strong>Créateur de contenu</strong>. Voici comment fonctionne votre espace.
              </p>
            </div>
            <Button size="lg" className="w-full max-w-xs" onClick={() => setSlide(1)}>
              Découvrir <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* ── Slide 1: Vos missions ── */}
        {slide === 1 && (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center space-y-4 py-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <ClipboardList className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold font-serif">Vos missions</h2>
              <p className="text-muted-foreground font-sans text-sm leading-relaxed max-w-sm">
                Votre CM ou DM vous assigne des tâches avec : le client concerné, le type de contenu,
                la deadline et le réseau social cible.
              </p>
            </div>
            <Button className="w-full" onClick={() => setSlide(2)}>
              Suivant <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* ── Slide 2: Livrez vos fichiers ── */}
        {slide === 2 && (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center space-y-4 py-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold font-serif">Livrez vos fichiers</h2>
              <p className="text-muted-foreground font-sans text-sm leading-relaxed max-w-sm">
                Uploadez directement sur la tâche assignée. Votre CM validera ou rejettera avec un
                commentaire. En cas de rejet, vous serez notifié pour corriger.
              </p>
            </div>
            <Button className="w-full" onClick={() => setSlide(3)}>
              Suivant <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* ── Slide 3: La boîte de dépôt ── */}
        {slide === 3 && (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center space-y-4 py-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Inbox className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold font-serif">La boîte de dépôt</h2>
              <p className="text-muted-foreground font-sans text-sm leading-relaxed max-w-sm">
                Vous pouvez aussi déposer des fichiers librement sans tâche assignée. Votre CM les
                récupérera et les liera à un post.
              </p>
            </div>
            <Button className="w-full" onClick={() => setSlide(4)}>
              Suivant <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* ── Slide 4: Votre équipe ── */}
        {slide === 4 && (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold font-serif">Votre équipe</h2>
              <p className="text-muted-foreground font-sans text-sm leading-relaxed max-w-sm">
                Vous faites partie de l'agence. En cas de question, contactez votre Community Manager
                ou votre Digital Manager.
              </p>
            </div>

            {/* Team members list */}
            {teamMembers.length > 0 && (
              <div className="space-y-2 max-w-xs mx-auto">
                {teamMembers
                  .sort((a, b) => (isDm(a.role) ? -1 : isDm(b.role) ? 1 : 0))
                  .map((m) => (
                    <div key={m.user_id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border">
                      <Avatar className="h-8 w-8 shrink-0">
                        {m.avatar_url && <AvatarImage src={m.avatar_url} />}
                        <AvatarFallback className="text-xs bg-muted text-muted-foreground font-semibold">
                          {m.prenom?.[0]}{m.nom?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium font-sans truncate">{m.prenom} {m.nom}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {ROLE_LABEL[m.role] ?? m.role}
                      </Badge>
                    </div>
                  ))}
              </div>
            )}

            <Button className="w-full" onClick={() => setSlide(5)}>
              Suivant <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* ── Slide 5: Profile ── */}
        {slide === 5 && (
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
                onClick={() => setSlide(6)}
              >
                Passer
              </button>
            </div>
          </div>
        )}

        {/* ── Slide 6: Final ── */}
        {slide === 6 && (
          <div className="text-center space-y-6 py-6">
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mx-auto">
              <Check className="h-10 w-10 text-emerald-600" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold font-serif">Vous êtes prêt ! 🎉</h2>
              <p className="text-muted-foreground font-sans text-sm leading-relaxed max-w-sm mx-auto">
                Attendez vos premières missions. Vous serez notifié dès qu'une tâche vous est assignée.
              </p>
            </div>
            <Button
              size="lg"
              className="w-full max-w-xs"
              onClick={() => { void handleComplete(); }}
              disabled={completing}
            >
              {completing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Accéder à mes missions <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
