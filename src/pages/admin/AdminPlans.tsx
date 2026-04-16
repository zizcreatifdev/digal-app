import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Tag, Sparkles, Check, X, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAllPlans, Plan } from "@/hooks/usePlans";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

/* ─── Types ────────────────────────────────────────────────── */

interface PlanConfig {
  id: string;
  plan_type: string;
  duree_mois: number;
  prix_fcfa: number;
  est_actif: boolean;
  est_populaire: boolean;
}

/* ─── Constants ─────────────────────────────────────────────── */

const PLAN_TYPES = ["solo", "agence_standard", "agence_pro"] as const;

const PLAN_TYPE_LABELS: Record<string, string> = {
  solo: "CM Pro",
  agence_standard: "Studio",
  agence_pro: "Elite",
};

/* ─── Component ─────────────────────────────────────────────── */

const AdminPlans = () => {
  const { data: plans, isLoading } = useAllPlans();
  const queryClient = useQueryClient();

  /* ── Existing plans state ─────────────────────────────── */
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState({
    nom: "",
    prix_mensuel: "",
    prix_semestriel: "",
    promo_active: false,
    promo_label: "",
    promo_prix_mensuel: "",
    features: "",
    highlighted: false,
    badge: "",
    cta_text: "",
    actif: true,
  });

  /* ── Plan configs state ───────────────────────────────── */
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState("");
  const [addConfigType, setAddConfigType] = useState<string | null>(null);
  const [addForm, setAddForm] = useState({ duree_mois: "", prix_fcfa: "", est_populaire: false });
  const [addConfigLoading, setAddConfigLoading] = useState(false);

  /* ── Plan configs query ───────────────────────────────── */
  const { data: planConfigs } = useQuery({
    queryKey: ["plan-configs"],
    queryFn: async () => {
      // plan_configs not yet in generated types — cast required
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("plan_configs")
        .select("*")
        .order("duree_mois");
      if (error) throw error;
      return (data ?? []) as PlanConfig[];
    },
  });

  const configsByType = (planConfigs ?? []).reduce<Record<string, PlanConfig[]>>(
    (acc, c) => {
      if (!acc[c.plan_type]) acc[c.plan_type] = [];
      acc[c.plan_type].push(c);
      return acc;
    },
    {}
  );

  /* ── Plan configs mutations ───────────────────────────── */

  const updateConfig = async (id: string, updates: Partial<PlanConfig>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("plan_configs").update(updates).eq("id", id);
    if (error) { toast.error("Erreur de mise à jour"); return; }
    queryClient.invalidateQueries({ queryKey: ["plan-configs"] });
    queryClient.invalidateQueries({ queryKey: ["plan-configs-public"] });
  };

  const setPopulaire = async (planType: string, id: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    await db.from("plan_configs").update({ est_populaire: false }).eq("plan_type", planType);
    await db.from("plan_configs").update({ est_populaire: true }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["plan-configs"] });
    queryClient.invalidateQueries({ queryKey: ["plan-configs-public"] });
  };

  const savePrice = async (id: string) => {
    const price = parseInt(editingPrice);
    if (isNaN(price) || price <= 0) { toast.error("Prix invalide"); return; }
    await updateConfig(id, { prix_fcfa: price });
    setEditingConfigId(null);
    toast.success("Prix mis à jour");
  };

  const handleAddConfig = async () => {
    if (!addConfigType) return;
    const duree = parseInt(addForm.duree_mois);
    const prix = parseInt(addForm.prix_fcfa);
    if (isNaN(duree) || duree <= 0 || isNaN(prix) || prix <= 0) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    setAddConfigLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    if (addForm.est_populaire) {
      await db.from("plan_configs").update({ est_populaire: false }).eq("plan_type", addConfigType);
    }
    const { error } = await db.from("plan_configs").insert({
      plan_type: addConfigType,
      duree_mois: duree,
      prix_fcfa: prix,
      est_populaire: addForm.est_populaire,
    });
    setAddConfigLoading(false);
    if (error) { toast.error("Erreur lors de l'ajout"); return; }
    toast.success("Durée ajoutée");
    queryClient.invalidateQueries({ queryKey: ["plan-configs"] });
    queryClient.invalidateQueries({ queryKey: ["plan-configs-public"] });
    setAddConfigType(null);
    setAddForm({ duree_mois: "", prix_fcfa: "", est_populaire: false });
  };

  /* ── Existing plans helpers ───────────────────────────── */

  const openEdit = (plan: Plan) => {
    setEditing(plan);
    setForm({
      nom: plan.nom,
      prix_mensuel: String(plan.prix_mensuel),
      prix_semestriel: plan.prix_semestriel != null ? String(plan.prix_semestriel) : "",
      promo_active: plan.promo_active,
      promo_label: plan.promo_label ?? "",
      promo_prix_mensuel: plan.promo_prix_mensuel != null ? String(plan.promo_prix_mensuel) : "",
      features: plan.features.join("\n"),
      highlighted: plan.highlighted,
      badge: plan.badge ?? "",
      cta_text: plan.cta_text,
      actif: plan.actif,
    });
  };

  const handleSave = async () => {
    if (!editing) return;
    const featuresArr = form.features.split("\n").map(f => f.trim()).filter(Boolean);
    const { error } = await supabase
      .from("plans")
      .update({
        nom: form.nom,
        prix_mensuel: parseInt(form.prix_mensuel) || 0,
        prix_semestriel: form.prix_semestriel ? parseInt(form.prix_semestriel) : null,
        promo_active: form.promo_active,
        promo_label: form.promo_label || null,
        promo_prix_mensuel: form.promo_prix_mensuel ? parseInt(form.promo_prix_mensuel) : null,
        features: featuresArr as unknown as Json,
        highlighted: form.highlighted,
        badge: form.badge || null,
        cta_text: form.cta_text,
        actif: form.actif,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editing.id);
    if (error) { toast.error("Erreur de sauvegarde"); return; }
    toast.success("Plan mis à jour");
    queryClient.invalidateQueries({ queryKey: ["plans"] });
    queryClient.invalidateQueries({ queryKey: ["all-plans"] });
    setEditing(null);
  };

  const formatFCFA = (n: number) => n.toLocaleString("fr-FR") + " FCFA";

  /* ── Render ───────────────────────────────────────────── */

  return (
    <AdminLayout>
      <div className="space-y-8">

        {/* ── Section 1 : Formules existantes ──────────── */}
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold font-serif tracking-tight">Formules & Tarifs</h1>
            <p className="text-muted-foreground font-sans text-sm mt-1">
              Modifiez les formules et promotions ; les changements s'appliquent partout instantanément.
            </p>
          </div>

          {isLoading ? (
            <p className="text-muted-foreground text-center py-12">Chargement...</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {plans?.map((plan) => (
                <Card key={plan.id} className={!plan.actif ? "opacity-50" : ""}>
                  <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <div>
                      <CardTitle className="font-serif text-lg flex items-center gap-2">
                        {plan.nom}
                        {plan.highlighted && <Sparkles className="h-4 w-4 text-primary" />}
                        {!plan.actif && <Badge variant="outline" className="text-[10px]">Inactif</Badge>}
                      </CardTitle>
                      {plan.badge && (
                        <Badge className="mt-1 bg-primary text-primary-foreground text-[10px]">{plan.badge}</Badge>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(plan)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-baseline gap-2">
                      {plan.promo_active && plan.promo_prix_mensuel != null ? (
                        <>
                          <span className="text-2xl font-bold font-serif">{formatFCFA(plan.promo_prix_mensuel)}</span>
                          <span className="text-sm text-muted-foreground line-through font-sans">{formatFCFA(plan.prix_mensuel)}</span>
                        </>
                      ) : (
                        <span className="text-2xl font-bold font-serif">
                          {plan.prix_mensuel === 0 ? "Gratuit" : formatFCFA(plan.prix_mensuel)}
                        </span>
                      )}
                      {plan.prix_mensuel > 0 && <span className="text-sm text-muted-foreground font-sans">/mois</span>}
                    </div>

                    {plan.promo_active && plan.promo_label && (
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <Tag className="h-3 w-3" />
                        {plan.promo_label}
                      </Badge>
                    )}

                    {plan.prix_semestriel != null && (
                      <p className="text-xs text-muted-foreground font-sans">
                        {formatFCFA(plan.prix_semestriel)} / 6 mois
                      </p>
                    )}

                    <ul className="space-y-1.5 text-sm font-sans">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* ── Section 2 : Configurations tarifaires ────── */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold font-serif tracking-tight">Configurations tarifaires</h2>
            <p className="text-muted-foreground font-sans text-sm mt-1">
              Durées et prix disponibles par plan. Ces données alimentent la landing page et la génération de licences.
            </p>
          </div>

          {PLAN_TYPES.map((planType) => (
            <Card key={planType}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="font-serif text-base">{PLAN_TYPE_LABELS[planType]}</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setAddConfigType(planType);
                    setAddForm({ duree_mois: "", prix_fcfa: "", est_populaire: false });
                  }}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Ajouter une durée
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Durée</TableHead>
                      <TableHead>Prix FCFA</TableHead>
                      <TableHead className="w-20">Actif</TableHead>
                      <TableHead className="w-24">Populaire</TableHead>
                      <TableHead className="w-16 text-right">Éditer</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(configsByType[planType] ?? []).map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-sans">
                          {c.duree_mois === 12 ? "12 mois (1 an)" : `${c.duree_mois} mois`}
                          {c.est_populaire && (
                            <Badge className="ml-2 text-[10px] bg-primary/10 text-primary border-0">
                              Le plus choisi
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingConfigId === c.id ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                className="w-28 h-7 text-sm"
                                value={editingPrice}
                                onChange={(e) => setEditingPrice(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") savePrice(c.id);
                                  if (e.key === "Escape") setEditingConfigId(null);
                                }}
                                autoFocus
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => savePrice(c.id)}
                              >
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => setEditingConfigId(null)}
                              >
                                <X className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                            </div>
                          ) : (
                            <span className="font-sans">{c.prix_fcfa.toLocaleString("fr-FR")} FCFA</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={c.est_actif}
                            onCheckedChange={(v) => updateConfig(c.id, { est_actif: v })}
                          />
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={c.est_populaire}
                            onCheckedChange={(v) => {
                              if (v) setPopulaire(planType, c.id);
                              else updateConfig(c.id, { est_populaire: false });
                            }}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => {
                              setEditingConfigId(c.id);
                              setEditingPrice(String(c.prix_fcfa));
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(configsByType[planType] ?? []).length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-muted-foreground text-sm py-6 font-sans"
                        >
                          Aucune configuration. Cliquez sur "Ajouter une durée".
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ── Modal modifier formule (existant) ─────────── */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">Modifier · {editing?.nom}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-sans text-sm">Nom de la formule</Label>
              <Input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-sans text-sm">Prix mensuel (FCFA)</Label>
                <Input type="number" value={form.prix_mensuel} onChange={e => setForm(f => ({ ...f, prix_mensuel: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="font-sans text-sm">Prix 6 mois (FCFA)</Label>
                <Input type="number" value={form.prix_semestriel} onChange={e => setForm(f => ({ ...f, prix_semestriel: e.target.value }))} placeholder="Laisser vide si N/A" />
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-sans text-sm font-semibold">Promotion active</Label>
                <Switch checked={form.promo_active} onCheckedChange={v => setForm(f => ({ ...f, promo_active: v }))} />
              </div>
              {form.promo_active && (
                <>
                  <div className="space-y-2">
                    <Label className="font-sans text-sm">Label promo (ex: "-30% lancement")</Label>
                    <Input value={form.promo_label} onChange={e => setForm(f => ({ ...f, promo_label: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-sans text-sm">Prix promo mensuel (FCFA)</Label>
                    <Input type="number" value={form.promo_prix_mensuel} onChange={e => setForm(f => ({ ...f, promo_prix_mensuel: e.target.value }))} />
                  </div>
                </>
              )}
            </div>

            <div className="space-y-2">
              <Label className="font-sans text-sm">Fonctionnalités (une par ligne)</Label>
              <Textarea rows={5} value={form.features} onChange={e => setForm(f => ({ ...f, features: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-sans text-sm">Badge (ex: "Le plus choisi")</Label>
                <Input value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="font-sans text-sm">Texte CTA</Label>
                <Input value={form.cta_text} onChange={e => setForm(f => ({ ...f, cta_text: e.target.value }))} />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.highlighted} onCheckedChange={v => setForm(f => ({ ...f, highlighted: v }))} />
                <Label className="font-sans text-sm">Mise en avant</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.actif} onCheckedChange={v => setForm(f => ({ ...f, actif: v }))} />
                <Label className="font-sans text-sm">Actif</Label>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditing(null)}>Annuler</Button>
              <Button onClick={handleSave}>Enregistrer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Modal ajouter durée ────────────────────────── */}
      <Dialog open={!!addConfigType} onOpenChange={(o) => !o && setAddConfigType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">
              Ajouter une durée — {PLAN_TYPE_LABELS[addConfigType ?? "solo"]}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-sans text-sm">Durée (mois)</Label>
              <Input
                type="number"
                placeholder="6"
                min="1"
                max="60"
                value={addForm.duree_mois}
                onChange={(e) => setAddForm((f) => ({ ...f, duree_mois: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="font-sans text-sm">Prix FCFA</Label>
              <Input
                type="number"
                placeholder="75000"
                min="1"
                value={addForm.prix_fcfa}
                onChange={(e) => setAddForm((f) => ({ ...f, prix_fcfa: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={addForm.est_populaire}
                onCheckedChange={(v) => setAddForm((f) => ({ ...f, est_populaire: v }))}
              />
              <Label className="font-sans text-sm">Marquer comme "Le plus choisi"</Label>
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setAddConfigType(null)}>Annuler</Button>
            <Button onClick={handleAddConfig} disabled={addConfigLoading}>
              {addConfigLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Ajouter
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminPlans;
