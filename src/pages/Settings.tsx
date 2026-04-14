import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  User, Camera, Palette, FileText, Users as UsersIcon,
  LayoutTemplate, CreditCard, Bell, Plus, Trash2, Upload, Crown, Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { RESEAUX } from "@/lib/clients";
import type { Tables } from "@/integrations/supabase/types";

type UserRow = Tables<"users">;
type PostTemplateRow = Tables<"post_templates">;

/* ──────────────────────── PROFILE TAB ──────────────────────── */
function ProfileTab() {
  const { user } = useAuth();
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [agenceName, setAgenceName] = useState("");
  const [brandColor, setBrandColor] = useState("#C4522A");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("users").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setPrenom(data.prenom);
        setNom(data.nom);
        setEmail(data.email);
        setAgenceName(data.agence_nom ?? "");
        setAvatarUrl(data.avatar_url ?? "");
        setLogoUrl(data.logo_url ?? "");
      }
    });
  }, [user]);

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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file, "avatar");
    if (url) { setAvatarUrl(url); toast.success("Photo mise à jour"); }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file, "logo");
    if (url) { setLogoUrl(url); toast.success("Logo mis à jour"); }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("users").update({
      prenom, nom, agence_nom: agenceName || null, avatar_url: avatarUrl || null, logo_url: logoUrl || null,
    }).eq("user_id", user.id);
    setSaving(false);
    if (error) toast.error("Erreur lors de la sauvegarde");
    else toast.success("Profil mis à jour");
  };

  const handlePasswordChange = async () => {
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    if (resetError) toast.error("Erreur : " + resetError.message);
    else toast.success("Un email de réinitialisation a été envoyé");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="font-serif flex items-center gap-2"><User className="h-5 w-5" /> Profil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avatar upload */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <Camera className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <label className="absolute inset-0 cursor-pointer rounded-full opacity-0 group-hover:opacity-100 bg-foreground/30 flex items-center justify-center transition-opacity">
                <Upload className="h-4 w-4 text-background" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
            </div>
            <div>
              <p className="text-sm font-medium">Photo de profil</p>
              <p className="text-xs text-muted-foreground">JPG, PNG. Max 2 Mo</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><Label>Prénom</Label><Input value={prenom} onChange={(e) => setPrenom(e.target.value)} /></div>
            <div><Label>Nom</Label><Input value={nom} onChange={(e) => setNom(e.target.value)} /></div>
          </div>
          <div><Label>Email</Label><Input value={email} disabled className="opacity-60" /></div>
          <div>
            <Button variant="outline" size="sm" onClick={handlePasswordChange}>Modifier le mot de passe</Button>
          </div>
          <Separator />
          <div><Label>Nom de l'agence / marque</Label><Input value={agenceName} onChange={(e) => setAgenceName(e.target.value)} placeholder="Mon Agence" /></div>
          
          {/* Logo upload */}
          <div>
            <Label className="flex items-center gap-2"><Upload className="h-4 w-4" /> Logo</Label>
            <div className="flex items-center gap-3 mt-2">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-12 w-12 rounded border object-contain bg-background" />
              ) : (
                <div className="h-12 w-12 rounded border border-dashed border-input flex items-center justify-center">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <label className="cursor-pointer">
                <Button variant="outline" size="sm" asChild><span>Choisir un fichier</span></Button>
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
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
          <Button onClick={handleSave} disabled={saving || uploading}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/* ──────────────────────── BILLING SETTINGS TAB ──────────────────────── */
function BillingSettingsTab() {
  const { user } = useAuth();
  const [sigle, setSigle] = useState("");
  const [brsEnabled, setBrsEnabled] = useState(true);
  const [tvaEnabled, setTvaEnabled] = useState(false);
  const [headerText, setHeaderText] = useState("");
  const [footerText, setFooterText] = useState("");
  const [paymentMethods, setPaymentMethods] = useState({
    wave: true, yas: false, orange_money: true, virement: false, cash: true,
  });
  const [saving, setSaving] = useState(false);
  const [tamponsUrl, setTamponsUrl] = useState<string>("");
  const [signatureUrl, setSignatureUrl] = useState<string>("");
  const [uploadingTampon, setUploadingTampon] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Load global billing settings
    supabase.from("site_settings").select("*").in("key", [
      "billing_sigle", "billing_brs", "billing_tva", "billing_header",
      "billing_footer", "billing_payment_methods",
    ]).then(({ data }) => {
      data?.forEach((s) => {
        switch (s.key) {
          case "billing_sigle": setSigle(s.value); break;
          case "billing_brs": setBrsEnabled(s.value === "true"); break;
          case "billing_tva": setTvaEnabled(s.value === "true"); break;
          case "billing_header": setHeaderText(s.value); break;
          case "billing_footer": setFooterText(s.value); break;
          case "billing_payment_methods": try { setPaymentMethods(JSON.parse(s.value)); } catch { /* intentional silent fail */ } break;
        }
      });
    });
    // Load per-user tampon + signature from users table
    supabase.from("users").select("tampon_url, signature_url").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setTamponsUrl(data.tampon_url ?? "");
          setSignatureUrl(data.signature_url ?? "");
        }
      });
  }, [user]);

  const saveSetting = async (key: string, value: string) => {
    if (!user) return;
    const { data: existing } = await supabase.from("site_settings").select("id").eq("key", key).maybeSingle();
    if (existing) {
      await supabase.from("site_settings").update({ value }).eq("key", key);
    } else {
      await supabase.from("site_settings").insert({ key, value, created_by: user.id });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await Promise.all([
      saveSetting("billing_sigle", sigle),
      saveSetting("billing_brs", String(brsEnabled)),
      saveSetting("billing_tva", String(tvaEnabled)),
      saveSetting("billing_header", headerText),
      saveSetting("billing_footer", footerText),
      saveSetting("billing_payment_methods", JSON.stringify(paymentMethods)),
    ]);
    setSaving(false);
    toast.success("Paramètres de facturation enregistrés");
  };

  const togglePayment = (key: string) => {
    setPaymentMethods((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const uploadStampFile = async (file: File, field: "tampon" | "signature") => {
    if (!user) return;
    const setter = field === "tampon" ? setUploadingTampon : setUploadingSignature;
    setter(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${field}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("user-uploads").upload(path, file, { upsert: true });
      if (upErr) { toast.error("Erreur d'upload"); return; }
      const { data: { publicUrl } } = supabase.storage.from("user-uploads").getPublicUrl(path);
      // Save URL to users table
      const col = field === "tampon" ? { tampon_url: publicUrl } : { signature_url: publicUrl };
      await supabase.from("users").update(col).eq("user_id", user.id);
      if (field === "tampon") { setTamponsUrl(publicUrl); toast.success("Tampon mis à jour"); }
      else { setSignatureUrl(publicUrl); toast.success("Signature mise à jour"); }
    } finally {
      setter(false);
    }
  };

  const paymentLabels: Record<string, string> = {
    wave: "Wave", yas: "YAS", orange_money: "Orange Money", virement: "Virement bancaire", cash: "Cash",
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="font-serif flex items-center gap-2"><FileText className="h-5 w-5" /> Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>En-tête des documents</Label>
            <Textarea value={headerText} onChange={(e) => setHeaderText(e.target.value)} placeholder="Texte affiché en en-tête de vos devis et factures" rows={3} />
          </div>
          <div>
            <Label>Pied de page des documents</Label>
            <Textarea value={footerText} onChange={(e) => setFooterText(e.target.value)} placeholder="Mentions légales, coordonnées..." rows={3} />
          </div>
          <div>
            <Label>Sigle de numérotation</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">DEV-</span>
              <Input value={sigle} onChange={(e) => setSigle(e.target.value.toUpperCase())} placeholder="DGL" className="w-24" maxLength={5} />
              <span className="text-sm text-muted-foreground">-YYYY-0001</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tampon + Signature */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif flex items-center gap-2">
            <Upload className="h-5 w-5" /> Tampon & Signature
          </CardTitle>
          <CardDescription className="font-sans">
            Images PNG à fond transparent — appliquées automatiquement en bas de vos devis et factures.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tampon */}
          <div className="space-y-2">
            <Label>Tampon / Cachet</Label>
            <div className="flex items-start gap-4">
              <label className="flex flex-col items-center justify-center gap-1 w-32 h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors bg-muted/30 shrink-0">
                {uploadingTampon ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground font-sans text-center px-1">
                      {tamponsUrl ? "Remplacer" : "Importer PNG"}
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/png,image/webp"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadStampFile(f, "tampon"); }}
                />
              </label>
              {tamponsUrl && (
                <div className="border border-border rounded-lg p-2 bg-checkerboard">
                  <img src={tamponsUrl} alt="Tampon" className="h-20 max-w-[160px] object-contain" />
                </div>
              )}
            </div>
          </div>

          {/* Signature */}
          <div className="space-y-2">
            <Label>Signature</Label>
            <div className="flex items-start gap-4">
              <label className="flex flex-col items-center justify-center gap-1 w-32 h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors bg-muted/30 shrink-0">
                {uploadingSignature ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground font-sans text-center px-1">
                      {signatureUrl ? "Remplacer" : "Importer PNG"}
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/png,image/webp"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadStampFile(f, "signature"); }}
                />
              </label>
              {signatureUrl && (
                <div className="border border-border rounded-lg p-2 bg-checkerboard">
                  <img src={signatureUrl} alt="Signature" className="h-20 max-w-[160px] object-contain" />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Taxes & Devise</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">BRS 5%</p>
              <p className="text-xs text-muted-foreground">Appliqué par défaut sur les prestations</p>
            </div>
            <Switch checked={brsEnabled} onCheckedChange={setBrsEnabled} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">TVA 18%</p>
              <p className="text-xs text-muted-foreground">Désactivé par défaut</p>
            </div>
            <Switch checked={tvaEnabled} onCheckedChange={setTvaEnabled} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Devise</p>
            </div>
            <Badge variant="outline">FCFA</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Méthodes de paiement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(paymentLabels).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm">{label}</span>
              <Switch checked={paymentMethods[key as keyof typeof paymentMethods]} onCheckedChange={() => togglePayment(key)} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Enregistrement..." : "Enregistrer"}
      </Button>
    </div>
  );
}

/* ──────────────────────── TEAM TAB ──────────────────────── */
function TeamTab() {
  const { user } = useAuth();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("cm");
  const [profile, setProfile] = useState<UserRow | null>(null);
  const [teamMembers, setTeamMembers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: prof } = await supabase.from("users").select("*").eq("user_id", user.id).maybeSingle();
      setProfile(prof);

      if (prof?.agence_id) {
        const { data: team } = await supabase.from("users").select("*").eq("agence_id", prof.agence_id).order("created_at");
        setTeamMembers(team ?? []);
      } else {
        // Solo user is the only member
        setTeamMembers(prof ? [prof] : []);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const isAgence = profile?.role === "dm" || profile?.role?.startsWith("agence");

  const handleInvite = () => {
    if (!inviteEmail) return;
    toast.success(`Invitation envoyée à ${inviteEmail}`);
    setInviteEmail("");
  };

  const ROLE_LABELS: Record<string, string> = {
    dm: "DM",
    freemium: "Freemium",
    solo_standard: "Solo Standard",
    solo_pro: "Solo Pro",
    agence_starter: "DM Agence",
    agence_standard: "DM",
    agence_pro: "DM Agence Pro",
    cm: "CM",
    createur: "Créateur",
  };

  const getRoleBadgeStyle = (role: string): string => {
    if (role === "dm" || role?.startsWith("agence")) return "bg-[#C4522A] text-white border-transparent";
    if (role === "cm") return "bg-muted text-muted-foreground border-transparent";
    if (role === "createur") return "bg-blue-100 text-blue-800 border-transparent";
    return "";
  };

  // Sort: DM/agence founder first, then others
  const sortedMembers = [...teamMembers].sort((a, b) => {
    const aIsDm = a.role === "dm" || a.role?.startsWith("agence");
    const bIsDm = b.role === "dm" || b.role?.startsWith("agence");
    if (aIsDm && !bIsDm) return -1;
    if (!aIsDm && bIsDm) return 1;
    return 0;
  });

  return (
    <div className="space-y-6 max-w-2xl">
      {isAgence && (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif flex items-center gap-2"><UsersIcon className="h-5 w-5" /> Inviter un membre</CardTitle>
            <CardDescription>Mode Agence uniquement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <Label>Email</Label>
                <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="membre@agence.sn" />
              </div>
              <div className="w-36">
                <Label>Rôle</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cm">CM</SelectItem>
                    <SelectItem value="createur">Créateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleInvite}><Plus className="h-4 w-4 mr-1" /> Inviter</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Membres de l'équipe</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Chargement...</p>
          ) : teamMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Aucun membre dans l'équipe pour le moment</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Membre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  {isAgence && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedMembers.map((m) => {
                  const isDm = m.role === "dm" || m.role?.startsWith("agence");
                  const isSelf = m.user_id === user?.id;
                  return (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {m.avatar_url ? (
                          <img src={m.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                            {m.prenom?.[0]}{m.nom?.[0]}
                          </div>
                        )}
                        {m.prenom} {m.nom}
                        {isSelf && (
                          <Badge variant="outline" className="text-[10px] ml-1">Vous</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{m.email}</TableCell>
                    <TableCell>
                      <Badge className={`text-xs border ${getRoleBadgeStyle(m.role)}`}>
                        {isDm ? "DM" : (ROLE_LABELS[m.role] ?? m.role)}
                      </Badge>
                    </TableCell>
                    {isAgence && (
                      <TableCell>
                        {!isDm && !isSelf && (
                          <Button variant="ghost" size="sm" className="text-destructive h-7 px-2">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {isAgence && (
        <Button variant="outline" onClick={() => toast.info("Demande envoyée à l'administrateur")}>
          Demander plus de membres
        </Button>
      )}
    </div>
  );
}

/* ──────────────────────── TEMPLATES TAB ──────────────────────── */
function TemplatesTab() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<PostTemplateRow[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [titre, setTitre] = useState("");
  const [texte, setTexte] = useState("");
  const [reseau, setReseau] = useState("instagram");
  const [format, setFormat] = useState("image");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("post_templates").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setTemplates(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleCreate = async () => {
    if (!user || !titre) return;
    const { error } = await supabase.from("post_templates").insert({ user_id: user.id, titre, texte, reseau, format });
    if (error) { toast.error("Erreur"); return; }
    toast.success("Modèle créé");
    setShowCreate(false);
    setTitre(""); setTexte("");
    load();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("post_templates").delete().eq("id", id);
    toast.success("Modèle supprimé");
    load();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-serif flex items-center gap-2"><LayoutTemplate className="h-5 w-5" /> Modèles de posts</CardTitle>
          <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1" /> Nouveau</Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Chargement...</p>
          ) : templates.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucun modèle créé</p>
          ) : (
            <div className="space-y-3">
              {templates.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border bg-background">
                  <div>
                    <p className="font-medium text-sm">{t.titre}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{t.reseau}</Badge>
                      <Badge variant="secondary" className="text-xs">{t.format}</Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau modèle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Titre</Label>
              <Input value={titre} onChange={(e) => setTitre(e.target.value)} />
            </div>
            <div>
              <Label>Texte</Label>
              <Textarea value={texte} onChange={(e) => setTexte(e.target.value)} rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Réseau</Label>
                <Select value={reseau} onValueChange={setReseau}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RESEAUX.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Format</Label>
                <Input value={format} onChange={(e) => setFormat(e.target.value)} placeholder="image, vidéo, reel..." />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
            <Button onClick={handleCreate}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ──────────────────────── LICENSE TAB ──────────────────────── */
const PLAN_LABELS: Record<string, string> = {
  freemium: "Freemium",
  solo: "Solo Standard",
  agence_standard: "Agence Standard",
  agence_pro: "Agence Pro",
  dm: "Directeur Marketing",
  cm: "Community Manager",
  createur: "Créateur de contenu",
  owner: "Owner",
  admin: "Admin",
};

function LicenseTab() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserRow | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [activating, setActivating] = useState(false);
  const [history, setHistory] = useState<{ key_code: string; type: string; duration_months: number; used_at: string }[]>([]);

  const loadProfile = () => {
    if (!user) return;
    supabase.from("users").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => setProfile(data));
  };

  const loadHistory = (profileId?: string) => {
    if (!profileId) return;
    supabase.from("license_keys")
      .select("key_code, type, duration_months, used_at")
      .eq("used_by", profileId)
      .order("used_at", { ascending: false })
      .then(({ data }) => setHistory(data ?? []));
  };

  useEffect(() => {
    if (!user) return;
    supabase.from("users").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      setProfile(data);
      if (data?.id) loadHistory(data.id);
    });
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleActivate = async () => {
    const key = keyInput.trim().toUpperCase();
    if (!key) { toast.error("Saisissez une clé de licence"); return; }
    if (!user) return;

    setActivating(true);
    try {
      const { data: result, error } = await supabase.rpc("activate_license_key", { p_key_code: key });
      if (error) throw error;

      const res = result as { error?: string; success?: boolean; type?: string; expires_at?: string };
      if (res.error) { toast.error(res.error); return; }

      const expiresDate = res.expires_at ? new Date(res.expires_at).toLocaleDateString("fr-FR") : "";
      toast.success(`Licence activée — plan ${PLAN_LABELS[res.type ?? ""] ?? res.type} jusqu'au ${expiresDate}`);
      setKeyInput("");
      supabase.from("users").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
        setProfile(data);
        if (data?.id) loadHistory(data.id);
      });
    } catch (err: unknown) {
      toast.error((err as Error).message || "Erreur lors de l'activation");
    } finally {
      setActivating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="font-serif flex items-center gap-2"><CreditCard className="h-5 w-5" /> Ma licence</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Plan actuel</span>
            <Badge>{PLAN_LABELS[profile?.role ?? "freemium"] ?? profile?.role ?? "Freemium"}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Expiration</span>
            <span className="text-sm text-muted-foreground">
              {profile?.licence_expiration
                ? new Date(profile.licence_expiration).toLocaleDateString("fr-FR")
                : "—"}
            </span>
          </div>
          <Separator />
          <div>
            <Label className="font-sans mb-1 block flex items-center gap-1">
              <Crown className="h-4 w-4" /> Activer une clé de licence
            </Label>
            <div className="flex gap-2">
              <Input
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="DIGAL-SOLO-XXXXXX"
                className="font-mono"
                onKeyDown={(e) => e.key === "Enter" && handleActivate()}
              />
              <Button onClick={handleActivate} disabled={activating || !keyInput.trim()}>
                {activating ? "..." : "Activer"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              La durée s'ajoute à votre licence actuelle si elle n'est pas expirée.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Historique des licences</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">Aucun historique disponible</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Clé</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Durée</TableHead>
                  <TableHead>Activée le</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((h) => (
                  <TableRow key={h.key_code}>
                    <TableCell className="font-mono text-xs">{h.key_code}</TableCell>
                    <TableCell><Badge variant="outline">{PLAN_LABELS[h.type] ?? h.type}</Badge></TableCell>
                    <TableCell className="text-sm">{h.duration_months} mois</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {h.used_at ? new Date(h.used_at).toLocaleDateString("fr-FR") : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ──────────────────────── NOTIFICATIONS TAB ──────────────────────── */
function NotificationsTab() {
  const [notifSettings, setNotifSettings] = useState({
    validation_client: true,
    refus_client: true,
    fichier_uploade: true,
    tache_assignee: true,
    fichier_valide: true,
    fichier_rejete: true,
    lien_expire: true,
    membre_non_paye: true,
    rappel_publication: true,
    push_pwa: false,
  });

  const toggleNotif = (key: string) => {
    setNotifSettings((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const labels: Record<string, string> = {
    validation_client: "Client valide le lien",
    refus_client: "Client refuse le lien",
    fichier_uploade: "Créateur uploade un fichier",
    tache_assignee: "Tâche assignée",
    fichier_valide: "Fichier validé par CM",
    fichier_rejete: "Fichier rejeté",
    lien_expire: "Lien expiré sans réponse",
    membre_non_paye: "Membre non payé fin de mois",
    rappel_publication: "Rappel publication J-1",
    push_pwa: "Notifications push PWA",
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="font-serif flex items-center gap-2"><Bell className="h-5 w-5" /> Préférences de notification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(labels).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between py-1">
              <span className="text-sm">{label}</span>
              <Switch
                checked={notifSettings[key as keyof typeof notifSettings]}
                onCheckedChange={() => toggleNotif(key)}
              />
            </div>
          ))}
        </CardContent>
      </Card>
      <Button onClick={() => toast.success("Préférences enregistrées")}>
        Enregistrer
      </Button>
    </div>
  );
}

/* ──────────────────────── MAIN SETTINGS PAGE ──────────────────────── */
export default function Settings() {
  return (
    <DashboardLayout pageTitle="Paramètres">
      <div className="max-w-4xl mx-auto">
        <Tabs defaultValue="profil" className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
            <TabsTrigger value="profil" className="text-xs"><User className="h-3.5 w-3.5 mr-1" /> Profil</TabsTrigger>
            <TabsTrigger value="facturation" className="text-xs"><FileText className="h-3.5 w-3.5 mr-1" /> Facturation</TabsTrigger>
            <TabsTrigger value="equipe" className="text-xs"><UsersIcon className="h-3.5 w-3.5 mr-1" /> Équipe</TabsTrigger>
            <TabsTrigger value="modeles" className="text-xs"><LayoutTemplate className="h-3.5 w-3.5 mr-1" /> Modèles</TabsTrigger>
            <TabsTrigger value="licence" className="text-xs"><CreditCard className="h-3.5 w-3.5 mr-1" /> Licence</TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs"><Bell className="h-3.5 w-3.5 mr-1" /> Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="profil"><ProfileTab /></TabsContent>
          <TabsContent value="facturation"><BillingSettingsTab /></TabsContent>
          <TabsContent value="equipe"><TeamTab /></TabsContent>
          <TabsContent value="modeles"><TemplatesTab /></TabsContent>
          <TabsContent value="licence"><LicenseTab /></TabsContent>
          <TabsContent value="notifications"><NotificationsTab /></TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
