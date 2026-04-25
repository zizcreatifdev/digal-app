import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageCropModal, LOGO_ACCEPT, LOGO_MAX_BYTES } from "@/components/ui/ImageCropModal";
import {
  PartyPopper, Users, Building2, UserPlus, Briefcase,
  Check, Copy, ArrowRight, Camera, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/clipboard";
import { RESEAUX } from "@/lib/clients";

interface OnboardingDMProps {
  onComplete: () => void;
}

const TOTAL_STEPS = 5;

export function OnboardingDM({ onComplete }: OnboardingDMProps) {
  const { user } = useAuth();
  const [slide, setSlide] = useState(0);

  // Step 1 — Identity
  const [agenceName, setAgenceName] = useState("");
  const [brandColor, setBrandColor] = useState("#C4522A");
  const [logoUrl, setLogoUrl] = useState("");
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [savingStep1, setSavingStep1] = useState(false);

  // Step 2 — Team
  const [nbCm, setNbCm] = useState(0);
  const [nbCreateurs, setNbCreateurs] = useState(0);
  const [savingStep2, setSavingStep2] = useState(false);

  // Step 3 — Invite links
  const [cmLink, setCmLink] = useState("");
  const [createurLink, setCreateurLink] = useState("");
  const [generatingCm, setGeneratingCm] = useState(false);
  const [generatingCreateur, setGeneratingCreateur] = useState(false);

  // Step 4 — First client
  const [clientName, setClientName] = useState("");
  const [selectedNetworks, setSelectedNetworks] = useState<string[]>([]);
  const [savingClient, setSavingClient] = useState(false);

  // Completion flags for recap
  const [agencyConfigured, setAgencyConfigured] = useState(false);
  const [teamConfigured, setTeamConfigured] = useState(false);
  const [membersInvited, setMembersInvited] = useState(false);
  const [clientAdded, setClientAdded] = useState(false);
  const [completing, setCompleting] = useState(false);

  /* ── Logo upload ── */
  const handleLogoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > LOGO_MAX_BYTES) { toast.error("Fichier trop lourd (max 5 Mo)"); e.target.value = ""; return; }
    setPendingLogoFile(file);
    e.target.value = "";
  };

  const handleLogoCropConfirm = async (blob: Blob) => {
    setPendingLogoFile(null);
    if (!user) return;
    setUploadingLogo(true);
    const path = `${user.id}/logo/${Date.now()}.png`;
    const { error } = await supabase.storage.from("user-uploads").upload(path, blob, { contentType: "image/png", upsert: false });
    setUploadingLogo(false);
    if (error) { toast.error("Erreur d'upload du logo"); return; }
    const { data: { publicUrl } } = supabase.storage.from("user-uploads").getPublicUrl(path);
    setLogoUrl(publicUrl);
    toast.success("Logo chargé");
  };

  /* ── Step 1: Save identity ── */
  const handleSaveIdentity = async () => {
    if (!user) return;
    setSavingStep1(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("users").update({
      agence_nom: agenceName || null,
      logo_url: logoUrl || null,
      brand_color: brandColor,
    }).eq("user_id", user.id);
    setSavingStep1(false);
    if (error) { toast.error("Erreur de sauvegarde"); return; }
    setAgencyConfigured(true);
    setSlide(2);
  };

  /* ── Step 2: Save team config ── */
  const handleSaveTeam = async () => {
    if (!user) return;
    setSavingStep2(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("users").update({ nb_cm: nbCm, nb_createurs: nbCreateurs }).eq("user_id", user.id);
    setSavingStep2(false);
    if (error) { toast.error("Erreur de sauvegarde"); return; }
    if (nbCm > 0 || nbCreateurs > 0) setTeamConfigured(true);
    setSlide(3);
  };

  /* ── Step 3: Generate invite link ── */
  const generateInviteLink = async (role: "cm" | "createur") => {
    if (!user) return;
    const setGenerating = role === "cm" ? setGeneratingCm : setGeneratingCreateur;
    setGenerating(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: prof } = await (supabase as any).from("users").select("agence_id").eq("user_id", user.id).maybeSingle();

    const { data: tokenData, error } = await supabase
      .from("activation_tokens")
      .insert({
        email: "",
        prenom: "",
        nom: "",
        type_compte: role,
        agence_id: prof?.agence_id ?? null,
      } as Parameters<ReturnType<typeof supabase.from>["insert"]>[0])
      .select("token")
      .single();

    setGenerating(false);
    if (error || !tokenData) { toast.error("Erreur lors de la génération du lien"); return; }

    const link = `${window.location.origin}/activate/${tokenData.token}`;
    if (role === "cm") setCmLink(link);
    else setCreateurLink(link);
    setMembersInvited(true);
  };

  /* ── Step 4: Create first client ── */
  const handleCreateClient = async () => {
    if (!user || !clientName.trim()) { toast.error("Veuillez entrer un nom de client"); return; }
    setSavingClient(true);
    const { data: client, error } = await supabase.from("clients").insert({
      user_id: user.id,
      nom: clientName.trim(),
      statut: "actif",
    }).select("id").single();
    if (error || !client) { setSavingClient(false); toast.error("Erreur lors de la création du client"); return; }

    if (selectedNetworks.length > 0) {
      await supabase.from("client_networks").insert(
        selectedNetworks.map((r) => ({ client_id: client.id, reseau: r, user_id: user.id }))
      );
    }
    setSavingClient(false);
    setClientAdded(true);
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

  const progressValue = slide > 0 ? (Math.min(slide, TOTAL_STEPS) / TOTAL_STEPS) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-auto flex items-center justify-center p-4">
      <ImageCropModal file={pendingLogoFile} onConfirm={handleLogoCropConfirm} onCancel={() => setPendingLogoFile(null)} />
      <input ref={logoInputRef} type="file" accept={LOGO_ACCEPT} className="hidden" onChange={handleLogoFileSelect} />

      <div className="w-full max-w-lg animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src="/logos/Logo%20Digal_iconorange_ettext_ennoir.svg.svg"
            alt="Digal"
            className="h-8 w-auto dark:content-[url(/logos/Logo%20Digal_iconorange_ettext_enblanc.svg.svg)]"
          />
        </div>

        {/* Progress bar (steps 1–5) */}
        {slide > 0 && (
          <div className="mb-6 space-y-2">
            <div className="flex justify-between text-xs font-sans text-muted-foreground">
              <span className="font-medium text-foreground">
                Étape {Math.min(slide, TOTAL_STEPS)} sur {TOTAL_STEPS}
              </span>
              <span>{Math.round(progressValue)}%</span>
            </div>
            <Progress value={progressValue} className="h-2" />
          </div>
        )}

        {/* ── Slide 0: Intro ── */}
        {slide === 0 && (
          <div className="text-center space-y-6 py-8">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Building2 className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-bold font-serif">Bienvenue sur Digal !</h1>
              <p className="text-muted-foreground font-sans text-sm leading-relaxed max-w-sm mx-auto">
                Vous êtes <strong>Digital Manager</strong>. Vous pilotez votre agence, gérez vos clients,
                votre équipe et la facturation.
              </p>
            </div>
            <Button size="lg" className="w-full max-w-xs" onClick={() => setSlide(1)}>
              Commencer <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* ── Slide 1: Agency identity ── */}
        {slide === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold font-serif flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" /> Configurez votre identité
              </h2>
              <p className="text-sm text-muted-foreground font-sans mt-1">
                Votre logo et vos couleurs s'affichent sur tous vos documents et liens clients.
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="font-sans">Nom de l'agence</Label>
                <Input
                  value={agenceName}
                  onChange={(e) => setAgenceName(e.target.value)}
                  placeholder="Mon agence digitale"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-sans">Logo</Label>
                <div className="flex items-center gap-3">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo agence" className="h-12 w-12 rounded-lg object-cover border border-border" />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}>
                    {uploadingLogo ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Camera className="h-4 w-4 mr-1" />}
                    {logoUrl ? "Changer" : "Ajouter un logo"}
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="font-sans">Couleur principale</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="h-10 w-16 rounded-lg border border-border cursor-pointer p-1"
                  />
                  <span className="text-sm text-muted-foreground font-mono">{brandColor}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={() => { void handleSaveIdentity(); }} disabled={savingStep1}>
                {savingStep1 && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Continuer <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <button
                className="text-xs text-muted-foreground hover:text-foreground font-sans underline-offset-2 hover:underline"
                onClick={() => setSlide(2)}
              >
                Passer cette étape
              </button>
            </div>
          </div>
        )}

        {/* ── Slide 2: Team config ── */}
        {slide === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold font-serif flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" /> Composez votre équipe
              </h2>
              <p className="text-sm text-muted-foreground font-sans mt-1">
                Définissez combien de Community Managers et Créateurs vous allez inviter.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="font-sans text-sm">Community Managers</Label>
                <Input
                  type="number"
                  min="0"
                  value={nbCm}
                  onChange={(e) => setNbCm(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-sans text-sm">Créateurs de contenu</Label>
                <Input
                  type="number"
                  min="0"
                  value={nbCreateurs}
                  onChange={(e) => setNbCreateurs(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={() => { void handleSaveTeam(); }} disabled={savingStep2}>
                {savingStep2 && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Continuer <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <button
                className="text-xs text-muted-foreground hover:text-foreground font-sans underline-offset-2 hover:underline"
                onClick={() => setSlide(3)}
              >
                Passer cette étape
              </button>
            </div>
          </div>
        )}

        {/* ── Slide 3: Invite links ── */}
        {slide === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold font-serif flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" /> Invitez vos membres
              </h2>
              <p className="text-sm text-muted-foreground font-sans mt-1">
                Envoyez les liens d'activation à vos Community Managers et Créateurs via WhatsApp.
              </p>
            </div>
            <div className="space-y-4">
              {/* CM link */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium font-sans">Community Manager</span>
                  <Button variant="outline" size="sm" onClick={() => { void generateInviteLink("cm"); }} disabled={generatingCm}>
                    {generatingCm ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <UserPlus className="h-4 w-4 mr-1" />}
                    Générer un lien CM
                  </Button>
                </div>
                {cmLink && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted border border-border">
                    <p className="text-xs font-mono flex-1 truncate text-muted-foreground">{cmLink}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 shrink-0"
                      onClick={() => { copyToClipboard(cmLink).then(() => toast.success("Lien CM copié")).catch(() => {}); }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Créateur link */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium font-sans">Créateur de contenu</span>
                  <Button variant="outline" size="sm" onClick={() => { void generateInviteLink("createur"); }} disabled={generatingCreateur}>
                    {generatingCreateur ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Briefcase className="h-4 w-4 mr-1" />}
                    Générer un lien Créateur
                  </Button>
                </div>
                {createurLink && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted border border-border">
                    <p className="text-xs font-mono flex-1 truncate text-muted-foreground">{createurLink}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 shrink-0"
                      onClick={() => { copyToClipboard(createurLink).then(() => toast.success("Lien Créateur copié")).catch(() => {}); }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={() => setSlide(4)}>
                Continuer <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <button
                className="text-xs text-muted-foreground hover:text-foreground font-sans underline-offset-2 hover:underline"
                onClick={() => setSlide(4)}
              >
                Passer cette étape
              </button>
            </div>
          </div>
        )}

        {/* ── Slide 4: First client ── */}
        {slide === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold font-serif flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" /> Ajoutez votre premier client
              </h2>
              <p className="text-sm text-muted-foreground font-sans mt-1">
                Créez la fiche de votre premier client pour commencer.
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="font-sans">Nom du client *</Label>
                <Input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Nom de l'entreprise ou du client"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-sans">Réseaux actifs</Label>
                <div className="grid grid-cols-2 gap-2">
                  {RESEAUX.map((r) => (
                    <div key={r.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`network-dm-${r.id}`}
                        checked={selectedNetworks.includes(r.id)}
                        onCheckedChange={(checked) => {
                          setSelectedNetworks((prev) =>
                            checked ? [...prev, r.id] : prev.filter((n) => n !== r.id)
                          );
                        }}
                      />
                      <label htmlFor={`network-dm-${r.id}`} className="text-sm font-sans cursor-pointer">
                        {r.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => { void handleCreateClient(); }}
                disabled={savingClient || !clientName.trim()}
              >
                {savingClient && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Ajouter le client <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <button
                className="text-xs text-muted-foreground hover:text-foreground font-sans underline-offset-2 hover:underline"
                onClick={() => setSlide(5)}
              >
                Passer cette étape
              </button>
            </div>
          </div>
        )}

        {/* ── Slide 5: Congratulations ── */}
        {slide === 5 && (
          <div className="text-center space-y-6 py-4">
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mx-auto">
              <PartyPopper className="h-10 w-10 text-emerald-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold font-serif">Votre agence est prête ! 🎉</h2>
              <p className="text-muted-foreground font-sans text-sm">Voici ce que vous avez configuré :</p>
            </div>
            <div className="space-y-2.5 text-left max-w-xs mx-auto">
              {[
                { done: agencyConfigured, label: "Identité de l'agence" },
                { done: teamConfigured, label: "Équipe configurée" },
                { done: membersInvited, label: "Membres invités" },
                { done: clientAdded, label: "Premier client ajouté" },
              ].map(({ done, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                    <Check className="h-3 w-3" />
                  </div>
                  <span className={`text-sm font-sans ${done ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
            <Button
              size="lg"
              className="w-full max-w-xs"
              onClick={() => { void handleComplete(); }}
              disabled={completing}
            >
              {completing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Accéder à mon dashboard <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
