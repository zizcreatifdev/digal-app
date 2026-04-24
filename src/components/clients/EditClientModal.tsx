import { useEffect, useRef, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogoCropModal } from "@/components/ui/logo-crop-modal";
import { RESEAUX, PAYMENT_MODES, updateClient, Client, ClientNetwork } from "@/lib/clients";
import { logClientAction } from "@/lib/activity-logs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";

interface EditClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
  networks: ClientNetwork[];
  onSuccess: () => void;
}

async function uploadClientLogo(userId: string, blob: Blob): Promise<string> {
  const path = `${userId}/client-logos/${Date.now()}.png`;
  const { error } = await supabase.storage
    .from("user-uploads")
    .upload(path, blob, { contentType: "image/png", upsert: false });
  if (error) throw error;
  return supabase.storage.from("user-uploads").getPublicUrl(path).data.publicUrl;
}

export function EditClientModal({ open, onOpenChange, client, networks, onSuccess }: EditClientModalProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("identite");

  const [nom, setNom] = useState(client.nom);
  const [couleurMarque, setCouleurMarque] = useState(client.couleur_marque);
  const [couleurSecondaire, setCouleurSecondaire] = useState(client.couleur_secondaire ?? "#1A1A1A");
  const [contactNom, setContactNom] = useState(client.contact_nom ?? "");
  const [contactEmail, setContactEmail] = useState(client.contact_email ?? "");
  const [contactTelephone, setContactTelephone] = useState(client.contact_telephone ?? "");
  const [facturationAdresse, setFacturationAdresse] = useState(client.facturation_adresse ?? "");
  const [facturationMode, setFacturationMode] = useState(client.facturation_mode);
  const [reseauxActifs, setReseauxActifs] = useState<string[]>(networks.map((n) => n.reseau));
  const [networkData, setNetworkData] = useState<Record<string, { formats: string[]; frequence: number; notes: string }>>(() => {
    const initial: Record<string, { formats: string[]; frequence: number; notes: string }> = {};
    networks.forEach((n) => {
      initial[n.reseau] = { formats: n.formats, frequence: n.frequence_posts, notes: n.notes_editoriales ?? "" };
    });
    return initial;
  });

  // Logo
  const [logoUrl, setLogoUrl] = useState<string | null>(client.logo_url);
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Sync state when client prop changes
  useEffect(() => {
    setNom(client.nom);
    setCouleurMarque(client.couleur_marque);
    setCouleurSecondaire(client.couleur_secondaire ?? "#1A1A1A");
    setContactNom(client.contact_nom ?? "");
    setContactEmail(client.contact_email ?? "");
    setContactTelephone(client.contact_telephone ?? "");
    setFacturationAdresse(client.facturation_adresse ?? "");
    setFacturationMode(client.facturation_mode);
    setLogoUrl(client.logo_url);
    setReseauxActifs(networks.map((n) => n.reseau));
    const initial: Record<string, { formats: string[]; frequence: number; notes: string }> = {};
    networks.forEach((n) => {
      initial[n.reseau] = { formats: n.formats, frequence: n.frequence_posts, notes: n.notes_editoriales ?? "" };
    });
    setNetworkData(initial);
  }, [client, networks]);

  const toggleReseau = (id: string) => {
    setReseauxActifs((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const toggleFormat = (reseau: string, format: string) => {
    setNetworkData((prev) => {
      const current = prev[reseau] || { formats: [], frequence: 3, notes: "" };
      const formats = current.formats.includes(format)
        ? current.formats.filter((f) => f !== format)
        : [...current.formats, format];
      return { ...prev, [reseau]: { ...current, formats } };
    });
  };

  const updateNetworkField = (reseau: string, field: "frequence" | "notes", value: number | string) => {
    setNetworkData((prev) => {
      const current = prev[reseau] || { formats: [], frequence: 3, notes: "" };
      return { ...prev, [reseau]: { ...current, [field]: value } };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPendingLogoFile(file);
    e.target.value = "";
  };

  const handleCropConfirm = async (blob: Blob) => {
    setPendingLogoFile(null);
    if (!user) return;
    setUploadingLogo(true);
    try {
      const url = await uploadClientLogo(user.id, blob);
      setLogoUrl(url);
    } catch {
      toast.error("Erreur lors de l'upload du logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async () => {
    if (!nom.trim()) { toast.error("Le nom du client est requis"); return; }
    if (!user) return;

    setLoading(true);
    try {
      const updatedNetworks = reseauxActifs.map((r) => ({
        reseau: r,
        formats: networkData[r]?.formats ?? [],
        frequence_posts: networkData[r]?.frequence ?? 3,
        notes_editoriales: networkData[r]?.notes ?? "",
      }));

      await updateClient(
        client.id,
        {
          nom: nom.trim(),
          logo_url: logoUrl,
          couleur_marque: couleurMarque,
          couleur_secondaire: couleurSecondaire,
          contact_nom: contactNom || null,
          contact_email: contactEmail || null,
          contact_telephone: contactTelephone || null,
          facturation_adresse: facturationAdresse || null,
          facturation_mode: facturationMode,
        },
        updatedNetworks
      );

      toast.success("Client modifié avec succès");
      logClientAction(user.id, "Client modifié", nom);
      onOpenChange(false);
      onSuccess();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Erreur lors de la modification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le client</DialogTitle>
          </DialogHeader>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full">
              <TabsTrigger value="identite" className="flex-1 font-sans text-xs">Identité</TabsTrigger>
              <TabsTrigger value="reseaux" className="flex-1 font-sans text-xs">Réseaux</TabsTrigger>
              <TabsTrigger value="facturation" className="flex-1 font-sans text-xs">Facturation</TabsTrigger>
            </TabsList>

            {/* TAB: Identité */}
            <TabsContent value="identite" className="space-y-4 mt-4">
              {/* Logo upload */}
              <div>
                <Label className="font-sans">Logo du client</Label>
                <div className="flex items-center gap-3 mt-1">
                  <div
                    className="h-16 w-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center shrink-0 overflow-hidden"
                    style={{ backgroundColor: logoUrl ? "transparent" : couleurMarque }}
                  >
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-white font-bold font-serif text-xl">
                        {nom ? nom.charAt(0).toUpperCase() : "?"}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      disabled={uploadingLogo}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploadingLogo
                        ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Envoi…</>
                        : <><Upload className="h-3.5 w-3.5" /> {logoUrl ? "Changer" : "Choisir une image"}</>
                      }
                    </Button>
                    {logoUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs text-destructive hover:text-destructive"
                        onClick={() => setLogoUrl(null)}
                      >
                        <X className="h-3 w-3" /> Supprimer
                      </Button>
                    )}
                    <p className="text-[10px] text-muted-foreground font-sans">PNG, JPG ou SVG</p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              <div>
                <Label className="font-sans">Nom du client *</Label>
                <Input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex : Acme Corp" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="font-sans">Couleur principale</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={couleurMarque}
                      onChange={(e) => setCouleurMarque(e.target.value)}
                      className="h-9 w-12 rounded border border-input cursor-pointer"
                    />
                    <Input
                      value={couleurMarque}
                      onChange={(e) => {
                        const v = e.target.value;
                        setCouleurMarque(v.startsWith("#") ? v : `#${v}`);
                      }}
                      placeholder="#C4522A"
                      className="flex-1 font-mono text-sm"
                      maxLength={7}
                    />
                  </div>
                </div>
                <div>
                  <Label className="font-sans">Couleur secondaire</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={couleurSecondaire}
                      onChange={(e) => setCouleurSecondaire(e.target.value)}
                      className="h-9 w-12 rounded border border-input cursor-pointer"
                    />
                    <Input
                      value={couleurSecondaire}
                      onChange={(e) => {
                        const v = e.target.value;
                        setCouleurSecondaire(v.startsWith("#") ? v : `#${v}`);
                      }}
                      placeholder="#1A1A1A"
                      className="flex-1 font-mono text-sm"
                      maxLength={7}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="font-sans mb-2 block">Réseaux actifs</Label>
                <div className="flex flex-wrap gap-3">
                  {RESEAUX.map((r) => (
                    <label key={r.id} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={reseauxActifs.includes(r.id)}
                        onCheckedChange={() => toggleReseau(r.id)}
                      />
                      <span className="text-sm font-sans">{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-sm font-semibold font-sans text-muted-foreground mb-3">Interlocuteur</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="font-sans">Nom</Label>
                    <Input value={contactNom} onChange={(e) => setContactNom(e.target.value)} placeholder="Jean Dupont" />
                  </div>
                  <div>
                    <Label className="font-sans">Email</Label>
                    <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="jean@acme.com" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="font-sans">Téléphone</Label>
                    <Input value={contactTelephone} onChange={(e) => setContactTelephone(e.target.value)} placeholder="+221 77 000 00 00" />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB: Réseaux */}
            <TabsContent value="reseaux" className="space-y-6 mt-4">
              {reseauxActifs.length === 0 ? (
                <p className="text-sm text-muted-foreground font-sans text-center py-8">
                  Sélectionnez d'abord les réseaux dans l'onglet Identité.
                </p>
              ) : (
                reseauxActifs.map((rId) => {
                  const reseau = RESEAUX.find((r) => r.id === rId);
                  if (!reseau) return null;
                  const data = networkData[rId] || { formats: [], frequence: 3, notes: "" };
                  return (
                    <div key={rId} className="border border-border rounded-lg p-4 space-y-3">
                      <h4 className="font-semibold font-sans text-sm">{reseau.label}</h4>
                      <div>
                        <Label className="font-sans text-xs">Formats actifs</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {reseau.formats.map((f) => (
                            <label key={f} className="flex items-center gap-1.5 cursor-pointer">
                              <Checkbox
                                checked={data.formats.includes(f)}
                                onCheckedChange={() => toggleFormat(rId, f)}
                              />
                              <span className="text-xs font-sans">{f}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="font-sans text-xs">Posts / semaine</Label>
                        <Input
                          type="number"
                          min={1}
                          max={30}
                          value={data.frequence}
                          onChange={(e) => updateNetworkField(rId, "frequence", parseInt(e.target.value) || 1)}
                          className="w-24 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="font-sans text-xs">Notes éditoriales</Label>
                        <Textarea
                          value={data.notes}
                          onChange={(e) => updateNetworkField(rId, "notes", e.target.value)}
                          placeholder="Ton, visuels à privilégier, hashtags..."
                          className="mt-1"
                          rows={2}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </TabsContent>

            {/* TAB: Facturation */}
            <TabsContent value="facturation" className="space-y-4 mt-4">
              <div>
                <Label className="font-sans">Coordonnées de facturation</Label>
                <Textarea
                  value={facturationAdresse}
                  onChange={(e) => setFacturationAdresse(e.target.value)}
                  placeholder="Adresse complète, N° NINEA..."
                  rows={3}
                />
              </div>
              <div>
                <Label className="font-sans">Mode de paiement préféré</Label>
                <Select value={facturationMode} onValueChange={setFacturationMode}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_MODES.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={loading || uploadingLogo}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Enregistrer les modifications
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <LogoCropModal
        file={pendingLogoFile}
        onConfirm={handleCropConfirm}
        onCancel={() => setPendingLogoFile(null)}
      />
    </>
  );
}
