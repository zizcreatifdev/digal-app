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
import { Pencil, Tag, Sparkles, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAllPlans, Plan } from "@/hooks/usePlans";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const AdminPlans = () => {
  const { data: plans, isLoading } = useAllPlans();
  const queryClient = useQueryClient();
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
        features: featuresArr,
        highlighted: form.highlighted,
        badge: form.badge || null,
        cta_text: form.cta_text,
        actif: form.actif,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", editing.id);
    if (error) { toast.error("Erreur de sauvegarde"); return; }
    toast.success("Plan mis à jour");
    queryClient.invalidateQueries({ queryKey: ["plans"] });
    queryClient.invalidateQueries({ queryKey: ["all-plans"] });
    setEditing(null);
  };

  const formatFCFA = (n: number) => n.toLocaleString("fr-FR") + " FCFA";

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-serif tracking-tight">Formules & Tarifs</h1>
          <p className="text-muted-foreground font-sans text-sm mt-1">
            Modifiez les formules et promotions — les changements s'appliquent partout instantanément.
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

      {/* Edit modal */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">Modifier — {editing?.nom}</DialogTitle>
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

            {/* Promo section */}
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
    </AdminLayout>
  );
};

export default AdminPlans;
