import { useState } from "react";
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
import { RESEAUX, PAYMENT_MODES, createClient } from "@/lib/clients";
import { logClientAction } from "@/lib/activity-logs";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AddClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddClientModal({ open, onOpenChange, onSuccess }: AddClientModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("identite");

  // Identity
  const [nom, setNom] = useState("");
  const [couleurMarque, setCouleurMarque] = useState("#C4522A");
  const [couleurSecondaire, setCouleurSecondaire] = useState("#1A1A1A");
  const [contactNom, setContactNom] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactTelephone, setContactTelephone] = useState("");
  const [reseauxActifs, setReseauxActifs] = useState<string[]>([]);

  // Networks
  const [networkData, setNetworkData] = useState<Record<string, { formats: string[]; frequence: number; notes: string }>>({});

  // Billing
  const [facturationAdresse, setFacturationAdresse] = useState("");
  const [facturationMode, setFacturationMode] = useState("wave");

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

  const resetForm = () => {
    setNom(""); setCouleurMarque("#C4522A"); setCouleurSecondaire("#1A1A1A"); setContactNom(""); setContactEmail("");
    setContactTelephone(""); setReseauxActifs([]); setNetworkData({});
    setFacturationAdresse(""); setFacturationMode("wave"); setTab("identite");
  };

  const handleSubmit = async () => {
    if (!nom.trim()) { toast.error("Le nom du client est requis"); return; }
    if (!user) return;

    setLoading(true);
    try {
      const networks = reseauxActifs.map((r) => ({
        reseau: r,
        formats: networkData[r]?.formats ?? [],
        frequence_posts: networkData[r]?.frequence ?? 3,
        notes_editoriales: networkData[r]?.notes ?? "",
      }));

      await createClient(
        {
          user_id: user.id,
          nom: nom.trim(),
          logo_url: null,
          couleur_marque: couleurMarque,
          couleur_secondaire: couleurSecondaire,
          contact_nom: contactNom || null,
          contact_email: contactEmail || null,
          contact_telephone: contactTelephone || null,
          facturation_adresse: facturationAdresse || null,
          facturation_mode: facturationMode,
          statut: "actif",
        },
        networks
      );

      toast.success("Client ajouté avec succès");
      if (user) logClientAction(user.id, "Client créé", nom);
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Erreur lors de l'ajout du client");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter un client</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="identite" className="flex-1 font-sans text-xs">Identité</TabsTrigger>
            <TabsTrigger value="reseaux" className="flex-1 font-sans text-xs">Réseaux</TabsTrigger>
            <TabsTrigger value="facturation" className="flex-1 font-sans text-xs">Facturation</TabsTrigger>
          </TabsList>

          {/* TAB: Identité */}
          <TabsContent value="identite" className="space-y-4 mt-4">
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
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Ajouter le client
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
