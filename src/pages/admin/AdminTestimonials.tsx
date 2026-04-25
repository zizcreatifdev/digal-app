import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ImageCropModal } from "@/components/ui/ImageCropModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, GripVertical, Quote, ChevronDown, Save } from "lucide-react";

/* ── Types ──────────────────────────────────────────────── */
interface Testimonial {
  id: string;
  texte: string;
  nom: string;
  fonction: string;
  photo_url: string | null;
  ordre: number;
  actif: boolean;
  created_at: string;
}

interface FormState {
  texte: string;
  nom: string;
  fonction: string;
  actif: boolean;
  _photoBlob?: Blob;
}

interface SectionConfig {
  badge: string;
  titre: string;
  sous_titre: string;
}

interface Stat {
  valeur: string;
  libelle: string;
}

const EMPTY_FORM: FormState = { texte: "", nom: "", fonction: "", actif: true };

const DEFAULT_SECTION: SectionConfig = {
  badge: "Témoignages",
  titre: "Ils font confiance à Digal",
  sous_titre: "Des community managers et agences au Sénégal qui ont transformé leur activité.",
};

const DEFAULT_STATS: Stat[] = [
  { valeur: "500+", libelle: "Community Managers actifs" },
  { valeur: "3h", libelle: "Économisées par jour en moyenne" },
  { valeur: "98%", libelle: "Taux de satisfaction client" },
  { valeur: "2×", libelle: "Plus de clients fidélisés" },
];

/* ── Upload helper ───────────────────────────────────────── */
async function uploadPhoto(blob: Blob, testimonialId: string): Promise<string> {
  const path = `${testimonialId}.png`;
  const { error } = await supabase.storage
    .from("testimonials")
    .upload(path, blob, { upsert: true, contentType: "image/png" });
  if (error) throw error;
  const { data } = supabase.storage.from("testimonials").getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}

/* ── Page ────────────────────────────────────────────────── */
const AdminTestimonials = () => {
  const qc = useQueryClient();

  /* Config section */
  const [configOpen, setConfigOpen] = useState(true);
  const [section, setSection] = useState<SectionConfig>(DEFAULT_SECTION);
  const [stats, setStats] = useState<Stat[]>(DEFAULT_STATS);
  const [savingConfig, setSavingConfig] = useState(false);

  /* Testimonials CRUD */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Testimonial | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Testimonial | null>(null);
  const [saving, setSaving] = useState(false);

  /* Load config */
  useEffect(() => {
    supabase
      .from("testimonials_config")
      .select("id, data")
      .in("id", ["section", "stats"])
      .then(({ data }) => {
        data?.forEach((row) => {
          if (row.id === "section") setSection(row.data as SectionConfig);
          if (row.id === "stats") setStats(row.data as Stat[]);
        });
      });
  }, []);

  /* Load testimonials */
  const { data: testimonials = [], isLoading } = useQuery({
    queryKey: ["admin-testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("ordre", { ascending: true });
      if (error) throw error;
      return data as Testimonial[];
    },
  });

  /* ── Config save ─────────────────────────────────────── */
  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      const [r1, r2] = await Promise.all([
        supabase.from("testimonials_config").upsert({ id: "section", data: section, updated_at: new Date().toISOString() }),
        supabase.from("testimonials_config").upsert({ id: "stats",   data: stats,   updated_at: new Date().toISOString() }),
      ]);
      if (r1.error) throw r1.error;
      if (r2.error) throw r2.error;
      toast.success("Configuration enregistrée");
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSavingConfig(false);
    }
  };

  const updateStat = (i: number, field: keyof Stat, value: string) => {
    setStats((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  };

  /* ── Testimonial toggle ──────────────────────────────── */
  const handleToggle = async (id: string, actif: boolean) => {
    const { error } = await supabase.from("testimonials").update({ actif }).eq("id", id);
    if (error) { toast.error("Erreur de mise à jour"); return; }
    void qc.invalidateQueries({ queryKey: ["admin-testimonials"] });
  };

  /* ── Testimonial delete ──────────────────────────────── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("testimonials").delete().eq("id", deleteTarget.id);
    if (error) { toast.error("Erreur lors de la suppression"); return; }
    void qc.invalidateQueries({ queryKey: ["admin-testimonials"] });
    toast.success("Témoignage supprimé");
    setDeleteTarget(null);
  };

  /* ── Dialog open ─────────────────────────────────────── */
  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setPhotoPreview(null);
    setDialogOpen(true);
  };

  const openEdit = (t: Testimonial) => {
    setEditTarget(t);
    setForm({ texte: t.texte, nom: t.nom, fonction: t.fonction, actif: t.actif });
    setPhotoPreview(t.photo_url);
    setDialogOpen(true);
  };

  /* ── Photo crop ──────────────────────────────────────── */
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPendingPhoto(file);
    e.target.value = "";
  };

  const handleCropConfirm = (blob: Blob) => {
    setPendingPhoto(null);
    setPhotoPreview(URL.createObjectURL(blob));
    setForm((f) => ({ ...f, _photoBlob: blob }));
  };

  /* ── Testimonial save ────────────────────────────────── */
  const handleSave = async () => {
    if (!form.texte.trim() || !form.nom.trim()) {
      toast.error("Le texte et le nom sont obligatoires");
      return;
    }
    setSaving(true);
    try {
      if (editTarget) {
        let photo_url = editTarget.photo_url;
        if (form._photoBlob) photo_url = await uploadPhoto(form._photoBlob, editTarget.id);
        const { error } = await supabase
          .from("testimonials")
          .update({ texte: form.texte, nom: form.nom, fonction: form.fonction, actif: form.actif, photo_url })
          .eq("id", editTarget.id);
        if (error) throw error;
      } else {
        const nextOrdre = testimonials.length > 0 ? Math.max(...testimonials.map((t) => t.ordre)) + 1 : 0;
        const { data: inserted, error } = await supabase
          .from("testimonials")
          .insert({ texte: form.texte, nom: form.nom, fonction: form.fonction, actif: form.actif, ordre: nextOrdre })
          .select()
          .single();
        if (error) throw error;
        if (form._photoBlob && inserted) {
          const photo_url = await uploadPhoto(form._photoBlob, (inserted as Testimonial).id);
          await supabase.from("testimonials").update({ photo_url }).eq("id", (inserted as Testimonial).id);
        }
      }
      void qc.invalidateQueries({ queryKey: ["admin-testimonials"] });
      toast.success(editTarget ? "Témoignage mis à jour" : "Témoignage ajouté");
      setDialogOpen(false);
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const initials = (nom: string) =>
    nom.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  /* ── Render ──────────────────────────────────────────── */
  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-serif">Témoignages</h1>
            <p className="text-muted-foreground font-sans text-sm mt-1">
              Gérez tout le contenu de la section témoignages de la page d&rsquo;accueil.
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Ajouter
          </Button>
        </div>

        {/* ── Config de la section ───────────────────────── */}
        <div className="border border-border rounded-2xl overflow-hidden">
          <button
            type="button"
            className="w-full flex items-center justify-between px-5 py-4 bg-muted/40 hover:bg-muted/60 transition-colors text-left"
            onClick={() => setConfigOpen((v) => !v)}
          >
            <span className="font-semibold font-sans text-sm">Configuration de la section</span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${configOpen ? "rotate-180" : ""}`} />
          </button>

          {configOpen && (
            <div className="p-5 space-y-5 border-t border-border">
              {/* Textes */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Badge</Label>
                  <Input
                    value={section.badge}
                    onChange={(e) => setSection((s) => ({ ...s, badge: e.target.value }))}
                    placeholder="Témoignages"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs text-muted-foreground">Titre principal</Label>
                  <Input
                    value={section.titre}
                    onChange={(e) => setSection((s) => ({ ...s, titre: e.target.value }))}
                    placeholder="Ils font confiance à Digal"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Sous-titre</Label>
                <Textarea
                  value={section.sous_titre}
                  onChange={(e) => setSection((s) => ({ ...s, sous_titre: e.target.value }))}
                  rows={2}
                  placeholder="Des community managers et agences…"
                />
              </div>

              {/* Stats */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Statistiques (4 chiffres clés)</Label>
                <div className="grid md:grid-cols-2 gap-3">
                  {stats.map((stat, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <Input
                        value={stat.valeur}
                        onChange={(e) => updateStat(i, "valeur", e.target.value)}
                        className="w-24 shrink-0 font-bold text-center"
                        placeholder="500+"
                      />
                      <Input
                        value={stat.libelle}
                        onChange={(e) => updateStat(i, "libelle", e.target.value)}
                        placeholder="Community Managers actifs"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => void handleSaveConfig()} disabled={savingConfig} className="gap-2">
                  <Save className="h-4 w-4" />
                  {savingConfig ? "Enregistrement…" : "Enregistrer la configuration"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ── Liste des témoignages ──────────────────────── */}
        <div>
          <h2 className="font-semibold font-sans text-sm text-muted-foreground uppercase tracking-wider mb-3">
            Témoignages ({testimonials.length})
          </h2>

          {isLoading ? (
            <div className="text-center text-muted-foreground py-12 font-sans">Chargement…</div>
          ) : testimonials.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground font-sans space-y-2 border border-dashed border-border rounded-2xl">
              <Quote className="h-10 w-10 mx-auto opacity-20" />
              <p>Aucun témoignage. Cliquez sur &laquo; Ajouter &raquo; pour commencer.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {testimonials.map((t) => (
                <div key={t.id} className="glass-card p-4 flex items-center gap-4">
                  <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />

                  {t.photo_url ? (
                    <img src={t.photo_url} alt={t.nom} className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/20 shrink-0" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary/10 ring-2 ring-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-primary font-semibold font-sans text-xs">{initials(t.nom)}</span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold font-sans text-sm truncate">{t.nom}</p>
                      {t.fonction && <span className="text-muted-foreground font-sans text-xs truncate">· {t.fonction}</span>}
                    </div>
                    <p className="text-muted-foreground font-sans text-xs line-clamp-1 italic mt-0.5">
                      &ldquo;{t.texte}&rdquo;
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Switch checked={t.actif} onCheckedChange={(v) => void handleToggle(t.id, v)} />
                    <Button size="icon" variant="ghost" onClick={() => openEdit(t)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(t)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Dialog création / édition ─────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {editTarget ? "Modifier le témoignage" : "Nouveau témoignage"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Photo */}
            <div className="flex items-center gap-4">
              {photoPreview ? (
                <img src={photoPreview} alt="preview" className="h-16 w-16 rounded-full object-cover ring-2 ring-primary/20" />
              ) : (
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-sans text-xs">
                  Photo
                </div>
              )}
              <div>
                <Label htmlFor="photo-input" className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild>
                    <span>Choisir une photo</span>
                  </Button>
                </Label>
                <input id="photo-input" type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handlePhotoSelect} />
                <p className="text-muted-foreground font-sans text-xs mt-1">Format carré recommandé</p>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="nom">Nom *</Label>
              <Input id="nom" value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} placeholder="Aminata Diallo" />
            </div>

            <div className="space-y-1">
              <Label htmlFor="fonction">Fonction / Entreprise</Label>
              <Input id="fonction" value={form.fonction} onChange={(e) => setForm((f) => ({ ...f, fonction: e.target.value }))} placeholder="Community Manager Freelance" />
            </div>

            <div className="space-y-1">
              <Label htmlFor="texte">Témoignage *</Label>
              <Textarea id="texte" value={form.texte} onChange={(e) => setForm((f) => ({ ...f, texte: e.target.value }))} placeholder="Digal a transformé ma façon de travailler…" rows={4} />
            </div>

            <div className="flex items-center gap-3">
              <Switch id="actif" checked={form.actif} onCheckedChange={(v) => setForm((f) => ({ ...f, actif: v }))} />
              <Label htmlFor="actif" className="cursor-pointer">Visible sur le site</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={() => void handleSave()} disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Crop */}
      <ImageCropModal file={pendingPhoto} onConfirm={handleCropConfirm} onCancel={() => setPendingPhoto(null)} aspect={1} />

      {/* Delete */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce témoignage ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le témoignage de <strong>{deleteTarget?.nom}</strong> sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => void handleDelete()}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminTestimonials;
