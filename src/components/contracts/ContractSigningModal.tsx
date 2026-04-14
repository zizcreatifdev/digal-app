import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SignatureCanvas } from "./SignatureCanvas";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";
import { Loader2, FileText, ShieldCheck } from "lucide-react";
import digalLogo from "@/assets/digal-logo.png";

interface Clause {
  titre: string;
  contenu: string;
}

interface ContractSigningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planSlug: string;
  planNom: string;
  prixMensuel: number;
  userName: string;
  userEmail: string;
  onSigned: () => void;
  typeContrat?: "souscription" | "changement";
  ancienPlan?: string;
}

export function ContractSigningModal({
  open, onOpenChange, planSlug, planNom, prixMensuel,
  userName, userEmail, onSigned, typeContrat = "souscription", ancienPlan
}: ContractSigningModalProps) {
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [ownerSigUrl, setOwnerSigUrl] = useState<string | null>(null);
  const [ownerCachetUrl, setOwnerCachetUrl] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    loadTemplate();
  }, [open, planSlug]);

  const loadTemplate = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("contract_templates")
      .select("*")
      .eq("plan_slug", planSlug)
      .eq("actif", true)
      .limit(1)
      .maybeSingle();

    if (data) {
      setClauses((data.clauses as unknown as Clause[]) ?? []);
      setTemplateId(data.id);
      setOwnerSigUrl(data.owner_signature_url);
      setOwnerCachetUrl(data.owner_cachet_url);
    }
    setLoading(false);
  };

  const handleSign = async () => {
    if (!signature || !accepted) return;
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non connecté");

      // Upload signature
      const blob = await fetch(signature).then(r => r.blob());
      const sigPath = `${user.id}/signature-${Date.now()}.png`;
      const { error: upErr } = await supabase.storage
        .from("contracts")
        .upload(sigPath, blob, { contentType: "image/png" });
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from("contracts").getPublicUrl(sigPath);
      const [prenom, ...nomParts] = userName.split(" ");

      // Create contract
      const { error } = await supabase.from("contracts").insert({
        user_id: user.id,
        template_id: templateId,
        plan_slug: planSlug,
        plan_nom: planNom,
        prix_mensuel: prixMensuel,
        duree_mois: 6,
        clauses: clauses as unknown as Json,
        prenom: prenom || "",
        nom: nomParts.join(" ") || "",
        email: userEmail,
        signature_url: urlData.publicUrl,
        owner_signature_url: ownerSigUrl,
        owner_cachet_url: ownerCachetUrl,
        signed_at: new Date().toISOString(),
        statut: "signe",
        type_contrat: typeContrat,
        ancien_plan: ancienPlan || null,
      });

      if (error) throw error;
      toast.success("Contrat signé avec succès !");
      onSigned();
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error((err as Error).message || "Erreur lors de la signature");
    } finally {
      setSaving(false);
    }
  };

  const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <div className="bg-primary/5 border-b px-6 py-4">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-primary" />
              {typeContrat === "changement" ? "Contrat de changement de formule" : "Contrat de souscription"}
            </DialogTitle>
          </DialogHeader>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <ScrollArea className="flex-1 px-6 py-4">
            <div className="space-y-6">
              {/* Contract header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img src={digalLogo} alt="Digal" className="h-10 w-10" />
                  <div>
                    <h3 className="font-serif font-bold text-lg">Digal</h3>
                    <p className="text-[10px] text-muted-foreground font-sans">Dakar, Sénégal</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-[10px] border-primary/30 text-primary mb-1">
                    <FileText className="h-3 w-3 mr-1" /> CONTRAT
                  </Badge>
                  <p className="text-xs text-muted-foreground font-sans">{today}</p>
                </div>
              </div>

              <div className="border-t" />

              {/* Parties */}
              <div className="grid grid-cols-2 gap-4 text-sm font-sans">
                <div className="bg-muted/50 rounded-xl p-4 space-y-1">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Le prestataire</p>
                  <p className="font-bold">Digal SAS</p>
                  <p className="text-muted-foreground text-xs">Plateforme SaaS pour Community Managers</p>
                  <p className="text-muted-foreground text-xs">Dakar, Sénégal</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 space-y-1">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Le client</p>
                  <p className="font-bold">{userName}</p>
                  <p className="text-muted-foreground text-xs">{userEmail}</p>
                </div>
              </div>

              {/* Plan info */}
              <div className="rounded-xl border-2 border-primary/20 p-4 space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold font-sans">Formule souscrite</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-serif font-bold text-lg">{planNom}</p>
                    {typeContrat === "changement" && ancienPlan && (
                      <p className="text-xs text-muted-foreground font-sans">
                        Migration depuis : <span className="font-medium">{ancienPlan}</span>
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-serif font-bold text-primary">{prixMensuel.toLocaleString("fr-FR")}</p>
                    <p className="text-xs text-muted-foreground font-sans">FCFA / mois</p>
                  </div>
                </div>
              </div>

              {/* Clauses */}
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold font-sans">Clauses du contrat</p>
                {clauses.map((clause, i) => (
                  <div key={i} className="space-y-1">
                    <h4 className="font-sans font-semibold text-sm">
                      Article {i + 1} — {clause.titre}
                    </h4>
                    <p className="text-sm text-muted-foreground font-sans leading-relaxed">
                      {clause.contenu}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t" />

              {/* Owner signature / cachet */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold font-sans">Signature du prestataire</p>
                  {ownerSigUrl ? (
                    <img src={ownerSigUrl} alt="Signature Digal" className="h-16 object-contain" />
                  ) : (
                    <p className="text-xs text-muted-foreground italic font-sans">Signature électronique Digal</p>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold font-sans">Cachet</p>
                  {ownerCachetUrl ? (
                    <img src={ownerCachetUrl} alt="Cachet Digal" className="h-16 object-contain" />
                  ) : (
                    <div className="h-16 flex items-center">
                      <img src={digalLogo} alt="Digal" className="h-12 w-12 opacity-30" />
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t" />

              {/* Client signature */}
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold font-sans">Votre signature</p>
                {signature ? (
                  <div className="space-y-2">
                    <div className="border rounded-xl p-3 bg-white">
                      <img src={signature} alt="Signature" className="h-20 object-contain mx-auto" />
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setSignature(null)} className="font-sans text-xs">
                      Refaire la signature
                    </Button>
                  </div>
                ) : (
                  <SignatureCanvas onSave={setSignature} />
                )}
              </div>

              {/* Accept checkbox */}
              <div className="flex items-start gap-3 bg-muted/50 rounded-xl p-4">
                <Checkbox
                  id="accept"
                  checked={accepted}
                  onCheckedChange={(v) => setAccepted(!!v)}
                />
                <label htmlFor="accept" className="text-sm font-sans leading-relaxed cursor-pointer">
                  J'ai lu et j'accepte l'intégralité des clauses ci-dessus. Je confirme mon engagement
                  pour la formule <strong>{planNom}</strong> à <strong>{prixMensuel.toLocaleString("fr-FR")} FCFA/mois</strong>.
                </label>
              </div>
            </div>
          </ScrollArea>
        )}

        {/* Footer */}
        <div className="border-t px-6 py-4 flex gap-2 justify-end bg-muted/30">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="font-sans">
            Annuler
          </Button>
          <Button
            onClick={handleSign}
            disabled={!accepted || !signature || saving}
            className="font-sans gap-1.5"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Signer le contrat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
