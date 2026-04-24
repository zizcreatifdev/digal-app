import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SignatureCanvas } from "@/components/contracts/SignatureCanvas";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";
import {
  FileText, Plus, Trash2, Save, Loader2, Upload, Eye,
  ShieldCheck, PenTool,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import digalLogo from "@/assets/digal-logo.png";

interface Clause {
  titre: string;
  contenu: string;
}

interface ContractTemplate {
  id: string;
  nom: string;
  plan_slug: string;
  clauses: Clause[];
  owner_signature_url: string | null;
  owner_cachet_url: string | null;
  actif: boolean;
}

interface Contract {
  id: string;
  user_id: string;
  plan_slug: string;
  plan_nom: string;
  prix_mensuel: number;
  prenom: string;
  nom: string;
  email: string;
  signature_url: string | null;
  owner_signature_url: string | null;
  signed_at: string | null;
  statut: string;
  type_contrat: string;
  ancien_plan: string | null;
  created_at: string;
}

export default function AdminContrats() {
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTemplate, setEditTemplate] = useState<ContractTemplate | null>(null);
  const [viewContract, setViewContract] = useState<Contract | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<ContractTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [signatureModal, setSignatureModal] = useState(false);
  const [uploadingCachet, setUploadingCachet] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [tRes, cRes] = await Promise.all([
      supabase.from("contract_templates").select("*").order("plan_slug"),
      supabase.from("contracts").select("*").order("created_at", { ascending: false }),
    ]);
    setTemplates((tRes.data as unknown as ContractTemplate[]) ?? []);
    setContracts((cRes.data as Contract[]) ?? []);
    setLoading(false);
  };

  const deleteTemplate = async (id: string) => {
    const { error } = await supabase.from("contract_templates").delete().eq("id", id);
    if (error) { toast.error("Erreur lors de la suppression"); return; }
    toast.success("Template supprimé");
    setEditTemplate(null);
    fetchAll();
  };

  const saveTemplate = async () => {
    if (!editTemplate) return;
    setSaving(true);
    const { id, ...rest } = editTemplate;
    const { error } = await supabase.from("contract_templates")
      .update({ ...rest, clauses: rest.clauses as unknown as Json, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast.error("Erreur de sauvegarde");
    else {
      toast.success("Template mis à jour");
      fetchAll();
    }
    setSaving(false);
  };

  const updateClause = (idx: number, field: keyof Clause, value: string) => {
    if (!editTemplate) return;
    const newClauses = [...editTemplate.clauses];
    newClauses[idx] = { ...newClauses[idx], [field]: value };
    setEditTemplate({ ...editTemplate, clauses: newClauses });
  };

  const addClause = () => {
    if (!editTemplate) return;
    setEditTemplate({
      ...editTemplate,
      clauses: [...editTemplate.clauses, { titre: "Nouvelle clause", contenu: "" }],
    });
  };

  const removeClause = (idx: number) => {
    if (!editTemplate) return;
    setEditTemplate({
      ...editTemplate,
      clauses: editTemplate.clauses.filter((_, i) => i !== idx),
    });
  };

  const handleOwnerSignature = async (dataUrl: string) => {
    if (!editTemplate) return;
    try {
      const blob = await fetch(dataUrl).then(r => r.blob());
      const path = `owner/signature-${editTemplate.plan_slug}-${Date.now()}.png`;
      await supabase.storage.from("contracts").upload(path, blob, { contentType: "image/png", upsert: true });
      const { data } = supabase.storage.from("contracts").getPublicUrl(path);
      
      await supabase.from("contract_templates")
        .update({ owner_signature_url: data.publicUrl })
        .eq("id", editTemplate.id);
      
      setEditTemplate({ ...editTemplate, owner_signature_url: data.publicUrl });
      setSignatureModal(false);
      toast.success("Signature du propriétaire enregistrée");
      fetchAll();
    } catch {
      toast.error("Erreur upload signature");
    }
  };

  const handleCachetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editTemplate) return;
    setUploadingCachet(true);
    try {
      const path = `owner/cachet-${editTemplate.plan_slug}-${Date.now()}.png`;
      await supabase.storage.from("contracts").upload(path, file, { contentType: file.type, upsert: true });
      const { data } = supabase.storage.from("contracts").getPublicUrl(path);
      
      await supabase.from("contract_templates")
        .update({ owner_cachet_url: data.publicUrl })
        .eq("id", editTemplate.id);
      
      setEditTemplate({ ...editTemplate, owner_cachet_url: data.publicUrl });
      toast.success("Cachet enregistré");
      fetchAll();
    } catch {
      toast.error("Erreur upload cachet");
    }
    setUploadingCachet(false);
  };

  const planLabels: Record<string, string> = {
    solo: "CM Pro",
    solo_standard: "CM Pro",
    agence_standard: "Studio",
    agence_pro: "Elite",
    freemium: "Découverte",
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-serif">Contrats</h1>
          <p className="text-muted-foreground font-sans mt-1">
            Gérez les templates de contrats et consultez les contrats signés
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="templates">
            <TabsList>
              <TabsTrigger value="templates" className="gap-1.5 font-sans">
                <FileText className="h-3.5 w-3.5" /> Templates ({templates.length})
              </TabsTrigger>
              <TabsTrigger value="signes" className="gap-1.5 font-sans">
                <ShieldCheck className="h-3.5 w-3.5" /> Contrats signés ({contracts.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {templates.map((t) => (
                  <Card key={t.id} className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setEditTemplate(t)}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-sans flex items-center justify-between">
                        {t.nom}
                        <Badge variant="outline" className="text-[10px]">
                          {planLabels[t.plan_slug] || t.plan_slug}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground font-sans">
                        {t.clauses.length} clauses
                      </p>
                      <div className="flex gap-2 mt-2">
                        {t.owner_signature_url && (
                          <Badge className="text-[9px] bg-success/10 text-success border-emerald-200">
                            Signature ✓
                          </Badge>
                        )}
                        {t.owner_cachet_url && (
                          <Badge className="text-[9px] bg-info/10 text-info border-blue-200">
                            Cachet ✓
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="signes" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-sans">Client</TableHead>
                        <TableHead className="font-sans">Plan</TableHead>
                        <TableHead className="font-sans">Type</TableHead>
                        <TableHead className="font-sans">Montant</TableHead>
                        <TableHead className="font-sans">Date</TableHead>
                        <TableHead className="font-sans">Statut</TableHead>
                        <TableHead className="font-sans text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contracts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-12 text-muted-foreground font-sans">
                            Aucun contrat signé pour le moment
                          </TableCell>
                        </TableRow>
                      ) : contracts.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell>
                            <p className="font-medium font-sans">{c.prenom} {c.nom}</p>
                            <p className="text-xs text-muted-foreground">{c.email}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] font-sans">
                              {c.plan_nom}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={c.type_contrat === "changement"
                              ? "bg-warning/10 text-warning text-[10px]"
                              : "bg-primary/10 text-primary text-[10px]"
                            }>
                              {c.type_contrat === "changement" ? "Changement" : "Souscription"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-sans font-medium">
                            {c.prix_mensuel.toLocaleString("fr-FR")} FCFA
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground font-sans">
                            {c.signed_at ? format(new Date(c.signed_at), "dd MMM yyyy", { locale: fr }) : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge className={c.statut === "signe"
                              ? "bg-success/10 text-success"
                              : "bg-muted text-muted-foreground"
                            }>
                              {c.statut === "signe" ? "Signé" : "En attente"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => setViewContract(c)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Edit template modal */}
        <Dialog open={!!editTemplate} onOpenChange={(open) => { if (!open) setEditTemplate(null); }}>
          <DialogContent className="max-w-3xl h-[85vh] overflow-hidden flex flex-col p-0">
            <div className="px-6 py-4 border-b bg-muted/30">
              <DialogHeader>
                <DialogTitle className="font-serif">{editTemplate?.nom}</DialogTitle>
              </DialogHeader>
            </div>
            {editTemplate && (
              <ScrollArea className="flex-1 px-6 py-4">
                <div className="space-y-6">
                  {/* Template name */}
                  <div className="space-y-2">
                    <Label className="font-sans text-sm">Nom du template</Label>
                    <Input value={editTemplate.nom}
                      onChange={e => setEditTemplate({ ...editTemplate, nom: e.target.value })} />
                  </div>

                  {/* Owner signature & cachet */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-sans text-sm">Votre signature</Label>
                      {editTemplate.owner_signature_url ? (
                        <div className="border rounded-lg p-3 bg-white">
                          <img src={editTemplate.owner_signature_url} alt="Signature" className="h-16 object-contain" />
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground font-sans">Aucune signature</p>
                      )}
                      <Button variant="outline" size="sm" className="gap-1.5 font-sans"
                        onClick={() => setSignatureModal(true)}>
                        <PenTool className="h-3.5 w-3.5" />
                        {editTemplate.owner_signature_url ? "Modifier" : "Ajouter"} la signature
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-sans text-sm">Cachet / Tampon</Label>
                      {editTemplate.owner_cachet_url ? (
                        <div className="border rounded-lg p-3 bg-white">
                          <img src={editTemplate.owner_cachet_url} alt="Cachet" className="h-16 object-contain" />
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground font-sans">Aucun cachet</p>
                      )}
                      <label>
                        <Button variant="outline" size="sm" className="gap-1.5 font-sans" asChild>
                          <span>
                            <Upload className="h-3.5 w-3.5" />
                            {uploadingCachet ? "Upload..." : editTemplate.owner_cachet_url ? "Modifier" : "Ajouter"} le cachet
                          </span>
                        </Button>
                        <input type="file" className="hidden" accept="image/*" onChange={handleCachetUpload} />
                      </label>
                    </div>
                  </div>

                  {/* Clauses */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-sans text-sm">Clauses du contrat</Label>
                      <Button variant="outline" size="sm" onClick={addClause} className="gap-1.5 font-sans">
                        <Plus className="h-3.5 w-3.5" /> Ajouter une clause
                      </Button>
                    </div>
                    {editTemplate.clauses.map((clause, idx) => (
                      <div key={idx} className="border rounded-lg p-4 space-y-2 bg-muted/30">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1">
                            <Label className="text-[10px] text-muted-foreground font-sans">
                              Article {idx + 1} · Titre
                            </Label>
                            <Input value={clause.titre}
                              onChange={e => updateClause(idx, "titre", e.target.value)}
                              className="mt-1" />
                          </div>
                          <Button variant="ghost" size="icon" className="shrink-0 text-destructive"
                            onClick={() => removeClause(idx)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div>
                          <Label className="text-[10px] text-muted-foreground font-sans">Contenu</Label>
                          <Textarea value={clause.contenu}
                            onChange={e => updateClause(idx, "contenu", e.target.value)}
                            rows={3} className="mt-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            )}
            <div className="border-t px-6 py-3 flex gap-2 justify-between bg-muted/30">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1.5 font-sans text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" /> Supprimer
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer ce template</AlertDialogTitle>
                    <AlertDialogDescription>
                      Le template « {editTemplate?.nom} » sera définitivement supprimé. Cette action est irréversible.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => editTemplate && deleteTemplate(editTemplate.id)}>
                      Supprimer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditTemplate(null)} className="font-sans">Annuler</Button>
                <Button variant="outline" onClick={() => { if (editTemplate) setPreviewTemplate(editTemplate); }} className="gap-1.5 font-sans">
                  <Eye className="h-4 w-4" /> Aperçu
                </Button>
                <Button onClick={saveTemplate} disabled={saving} className="gap-1.5 font-sans">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Save className="h-4 w-4" /> Enregistrer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Signature modal for owner */}
        <Dialog open={signatureModal} onOpenChange={setSignatureModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-serif">Dessiner votre signature</DialogTitle>
            </DialogHeader>
            <SignatureCanvas onSave={handleOwnerSignature} />
          </DialogContent>
        </Dialog>

        {/* View contract modal */}
        <Dialog open={!!viewContract} onOpenChange={(open) => { if (!open) setViewContract(null); }}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {viewContract && (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img src={digalLogo} alt="Digal" className="h-8 w-8" />
                    <div>
                      <h3 className="font-serif font-bold">Contrat · {viewContract.plan_nom}</h3>
                      <p className="text-xs text-muted-foreground font-sans">{viewContract.email}</p>
                    </div>
                  </div>
                  <Badge className={viewContract.statut === "signe" ? "bg-success/10 text-success" : ""}>
                    {viewContract.statut === "signe" ? "Signé" : "En attente"}
                  </Badge>
                </div>
                <div className="border-t" />
                <div className="grid grid-cols-2 gap-4 text-sm font-sans">
                  <div>
                    <p className="text-muted-foreground text-xs">Client</p>
                    <p className="font-medium">{viewContract.prenom} {viewContract.nom}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Montant</p>
                    <p className="font-medium">{viewContract.prix_mensuel.toLocaleString("fr-FR")} FCFA/mois</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Type</p>
                    <p className="font-medium">{viewContract.type_contrat === "changement" ? "Changement de plan" : "Souscription"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Date signature</p>
                    <p className="font-medium">
                      {viewContract.signed_at ? format(new Date(viewContract.signed_at), "dd MMMM yyyy", { locale: fr }) : "-"}
                    </p>
                  </div>
                </div>
                {viewContract.signature_url && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold font-sans mb-2">Signature du client</p>
                    <div className="border rounded-xl p-3 bg-white">
                      <img src={viewContract.signature_url} alt="Signature" className="h-20 object-contain mx-auto" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Contract template preview modal */}
        <Dialog open={!!previewTemplate} onOpenChange={(open) => { if (!open) setPreviewTemplate(null); }}>
          <DialogContent className="max-w-2xl h-[90vh] overflow-hidden flex flex-col p-0">
            <div className="px-6 py-4 border-b bg-muted/30">
              <DialogHeader>
                <DialogTitle className="font-serif">Aperçu du contrat</DialogTitle>
              </DialogHeader>
            </div>
            {previewTemplate && (
              <ScrollArea className="flex-1">
                <div className="px-10 py-8 bg-white min-h-full">
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <img src={digalLogo} alt="Digal" className="h-10 w-10" />
                      <div>
                        <h2 className="font-serif font-bold text-xl text-foreground">Digal</h2>
                        <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-widest">Plateforme SaaS</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-sans">
                      {planLabels[previewTemplate.plan_slug] || previewTemplate.plan_slug}
                    </Badge>
                  </div>

                  <div className="text-center mb-8">
                    <h1 className="font-serif font-bold text-2xl text-foreground">{previewTemplate.nom}</h1>
                    <p className="text-sm text-muted-foreground font-sans mt-1">Contrat de prestation de services</p>
                  </div>

                  <div className="border rounded-lg p-4 mb-6 bg-muted/20">
                    <p className="text-sm font-sans"><span className="font-semibold">Entre :</span> Digal SAS, ci-après désigné « Le Prestataire »</p>
                    <p className="text-sm font-sans mt-2"><span className="font-semibold">Et :</span> <span className="text-muted-foreground italic">[Nom et prénom du client]</span>, ci-après désigné « Le Client »</p>
                  </div>

                  <div className="space-y-5">
                    {previewTemplate.clauses.map((clause, idx) => (
                      <div key={idx}>
                        <h3 className="font-serif font-bold text-sm mb-1.5">Article {idx + 1} · {clause.titre}</h3>
                        <p className="text-sm font-sans text-muted-foreground whitespace-pre-line leading-relaxed">{clause.contenu}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-10 pt-6 border-t">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold font-sans mb-4">Signatures</p>
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <p className="text-xs font-sans font-medium">Le Prestataire</p>
                        <div className="border rounded-lg p-3 bg-muted/10 min-h-[80px] flex flex-col items-center justify-center">
                          {previewTemplate.owner_signature_url ? (
                            <img src={previewTemplate.owner_signature_url} alt="Signature" className="h-14 object-contain" />
                          ) : (
                            <p className="text-[10px] text-muted-foreground italic">Signature non ajoutée</p>
                          )}
                        </div>
                        {previewTemplate.owner_cachet_url && (
                          <div className="flex justify-center">
                            <img src={previewTemplate.owner_cachet_url} alt="Cachet" className="h-12 object-contain opacity-80" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-sans font-medium">Le Client</p>
                        <div className="border rounded-lg border-dashed p-3 bg-muted/10 min-h-[80px] flex items-center justify-center">
                          <p className="text-[10px] text-muted-foreground italic">Signature du client à la souscription</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t text-center">
                    <p className="text-[9px] text-muted-foreground font-sans">
                      Fait en deux exemplaires, à Dakar, le {format(new Date(), "dd MMMM yyyy", { locale: fr })}
                    </p>
                  </div>
                </div>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
