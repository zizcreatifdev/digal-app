import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  User, Camera, Upload, Building2, Globe, Phone, Mail,
  MapPin, Loader2, Save, Palette, ShieldCheck,
} from "lucide-react";

export default function AdminProfil() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Profile fields
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  // Business fields (stored in site_settings)
  const [entrepriseNom, setEntrepriseNom] = useState("");
  const [entrepriseAdresse, setEntrepriseAdresse] = useState("");
  const [entrepriseTelephone, setEntrepriseTelephone] = useState("");
  const [entrepriseEmail, setEntrepriseEmail] = useState("");
  const [entrepriseSite, setEntrepriseSite] = useState("");
  const [entrepriseDescription, setEntrepriseDescription] = useState("");
  const [brandColor, setBrandColor] = useState("#C4522A");
  const [secondaryColor, setSecondaryColor] = useState("#1A1A1A");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const [profileRes, settingsRes] = await Promise.all([
        supabase.from("users").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("site_settings").select("*").in("key", [
          "owner_entreprise_nom", "owner_entreprise_adresse", "owner_entreprise_telephone",
          "owner_entreprise_email", "owner_entreprise_site", "owner_entreprise_description",
          "owner_brand_color", "owner_secondary_color",
        ]),
      ]);

      if (profileRes.data) {
        setPrenom(profileRes.data.prenom);
        setNom(profileRes.data.nom);
        setEmail(profileRes.data.email);
        setAvatarUrl(profileRes.data.avatar_url ?? "");
        setLogoUrl(profileRes.data.logo_url ?? "");
      }

      settingsRes.data?.forEach((s) => {
        switch (s.key) {
          case "owner_entreprise_nom": setEntrepriseNom(s.value); break;
          case "owner_entreprise_adresse": setEntrepriseAdresse(s.value); break;
          case "owner_entreprise_telephone": setEntrepriseTelephone(s.value); break;
          case "owner_entreprise_email": setEntrepriseEmail(s.value); break;
          case "owner_entreprise_site": setEntrepriseSite(s.value); break;
          case "owner_entreprise_description": setEntrepriseDescription(s.value); break;
          case "owner_brand_color": setBrandColor(s.value); break;
          case "owner_secondary_color": setSecondaryColor(s.value); break;
        }
      });
      setLoading(false);
    };
    load();
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
    if (url) {
      setAvatarUrl(url);
      await supabase.from("users").update({ avatar_url: url }).eq("user_id", user!.id);
      toast.success("Photo mise à jour");
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file, "logo");
    if (url) {
      setLogoUrl(url);
      await supabase.from("users").update({ logo_url: url }).eq("user_id", user!.id);
      toast.success("Logo mis à jour");
    }
  };

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
    if (!user) return;
    setSaving(true);

    await Promise.all([
      supabase.from("users").update({ prenom, nom }).eq("user_id", user.id),
      saveSetting("owner_entreprise_nom", entrepriseNom),
      saveSetting("owner_entreprise_adresse", entrepriseAdresse),
      saveSetting("owner_entreprise_telephone", entrepriseTelephone),
      saveSetting("owner_entreprise_email", entrepriseEmail),
      saveSetting("owner_entreprise_site", entrepriseSite),
      saveSetting("owner_entreprise_description", entrepriseDescription),
      saveSetting("owner_brand_color", brandColor),
      saveSetting("owner_secondary_color", secondaryColor),
    ]);

    setSaving(false);
    toast.success("Profil Owner enregistré");
  };

  const handlePasswordChange = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    if (error) toast.error("Erreur : " + error.message);
    else toast.success("Email de réinitialisation envoyé");
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-serif">Mon Profil</h1>
          <p className="text-muted-foreground font-sans mt-1">
            Gérez vos informations personnelles et celles de votre entreprise
          </p>
        </div>

        {/* Identity Card */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif flex items-center gap-2">
              <User className="h-5 w-5" /> Identité
            </CardTitle>
            <CardDescription className="font-sans">Votre photo et vos coordonnées</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Avatar */}
            <div className="flex items-center gap-5">
              <div className="relative group">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <Camera className="h-7 w-7 text-muted-foreground" />
                  )}
                </div>
                <label className="absolute inset-0 cursor-pointer rounded-full opacity-0 group-hover:opacity-100 bg-foreground/30 flex items-center justify-center transition-opacity">
                  <Upload className="h-5 w-5 text-background" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </label>
              </div>
              <div>
                <p className="font-medium font-sans">{prenom} {nom}</p>
                <Badge className="bg-primary/10 text-primary text-[10px] mt-1">
                  <ShieldCheck className="h-3 w-3 mr-1" /> Owner
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="font-sans text-sm">Prénom</Label>
                <Input value={prenom} onChange={e => setPrenom(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="font-sans text-sm">Nom</Label>
                <Input value={nom} onChange={e => setNom(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="font-sans text-sm">Email</Label>
              <Input value={email} disabled className="opacity-60" />
            </div>

            <Button variant="outline" size="sm" onClick={handlePasswordChange} className="font-sans">
              Modifier le mot de passe
            </Button>
          </CardContent>
        </Card>

        {/* Enterprise Card */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif flex items-center gap-2">
              <Building2 className="h-5 w-5" /> Entreprise
            </CardTitle>
            <CardDescription className="font-sans">Informations de votre structure (apparaissent sur les contrats et factures)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-lg border border-dashed border-input flex items-center justify-center overflow-hidden bg-background">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-full w-full object-contain p-1" />
                ) : (
                  <Upload className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <label className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild className="font-sans">
                    <span><Upload className="h-3.5 w-3.5 mr-1.5" /> {logoUrl ? "Modifier" : "Ajouter"} le logo</span>
                  </Button>
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </label>
                <p className="text-[10px] text-muted-foreground mt-1">PNG ou SVG recommandé</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="font-sans text-sm">Nom de l'entreprise</Label>
              <Input value={entrepriseNom} onChange={e => setEntrepriseNom(e.target.value)} placeholder="Digal SAS" />
            </div>

            <div className="space-y-1.5">
              <Label className="font-sans text-sm">Description courte</Label>
              <Textarea value={entrepriseDescription} onChange={e => setEntrepriseDescription(e.target.value)}
                placeholder="Plateforme SaaS de gestion pour Community Managers" rows={2} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="font-sans text-sm flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> Email professionnel
                </Label>
                <Input type="email" value={entrepriseEmail} onChange={e => setEntrepriseEmail(e.target.value)} placeholder="contact@digal.sn" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-sans text-sm flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> Téléphone
                </Label>
                <Input value={entrepriseTelephone} onChange={e => setEntrepriseTelephone(e.target.value)} placeholder="+221 77 000 00 00" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="font-sans text-sm flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" /> Site web
              </Label>
              <Input value={entrepriseSite} onChange={e => setEntrepriseSite(e.target.value)} placeholder="https://digal.sn" />
            </div>

            <div className="space-y-1.5">
              <Label className="font-sans text-sm flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Adresse
              </Label>
              <Textarea value={entrepriseAdresse} onChange={e => setEntrepriseAdresse(e.target.value)}
                placeholder="Dakar, Sénégal" rows={2} />
            </div>
          </CardContent>
        </Card>

        {/* Brand Colors */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif flex items-center gap-2">
              <Palette className="h-5 w-5" /> Identité visuelle
            </CardTitle>
            <CardDescription className="font-sans">Couleurs utilisées sur la plateforme et les documents</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-sans text-sm">Couleur principale</Label>
                <div className="flex items-center gap-3">
                  <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)}
                    className="h-10 w-14 rounded border border-input cursor-pointer" />
                  <Input value={brandColor} onChange={e => setBrandColor(e.target.value)}
                    className="w-28 font-mono text-sm" maxLength={7} placeholder="#C4522A" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-sans text-sm">Couleur secondaire</Label>
                <div className="flex items-center gap-3">
                  <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)}
                    className="h-10 w-14 rounded border border-input cursor-pointer" />
                  <Input value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)}
                    className="w-28 font-mono text-sm" maxLength={7} placeholder="#1A1A1A" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-2">
              <div className="h-12 w-24 rounded-lg" style={{ backgroundColor: brandColor }} />
              <div className="h-12 w-24 rounded-lg" style={{ backgroundColor: secondaryColor }} />
              <div className="h-12 flex-1 rounded-lg border" style={{
                background: `linear-gradient(135deg, ${brandColor}, ${secondaryColor})`
              }} />
            </div>
          </CardContent>
        </Card>

        <Separator />

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving || uploading} className="gap-1.5 font-sans min-w-[180px]">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Enregistrement..." : "Enregistrer tout"}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
