import { useState, useRef } from "react";
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
import { Plus, Pencil, Trash2, GripVertical, Quote } from "lucide-react";

/* ── Types ─────────────────────────────────────────────── */
interface Testimonial {
  id: string;
  nom: string;
  fonction: string;
  texte: string;
  photo_url: string | null;
  est_actif: boolean;
  ordre: number;
  created_at: string;
}

interface FormState {
  nom: string;
  fonction: string;
  texte: string;
  est_actif: boolean;
  _photoBlob?: Blob;
}

const EMPTY_FORM: FormState = {
  nom: "",
  fonction: "",
  texte: "",
  est_actif: true,
};

/* ── Upload photo ───────────────────────────────────────── */
async function uploadPhoto(blob: Blob, id: string): Promise<string> {
  const path = `${id}.png`;
  const { error } = await supabase.storage
    .from("testimonials")
    .upload(path, blob, { upsert: true, contentType: "image/png" });
  if (error) throw error;
  const { data } = supabase.storage.from("testimonials").getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}

/* ── Page ───────────────────────────────────────────────── */
const AdminTestimonials = () => {
  const qc = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Testimonial | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Testimonial | null>(null);
  const [saving, setSaving] = useState(false);

  /* Drag-and-drop state */
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  /* ── Query ──────────────────────────────────────────── */
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

  /* ── Toggle actif ───────────────────────────────────── */
  const handleToggle = async (id: string, est_actif: boolean) => {
    const { error } = await supabase
      .from("testimonials")
      .update({ est_actif })
      .eq("id", id);
    if (error) { toast.error("Erreur de mise à jour"); return; }
    void qc.invalidateQueries({ queryKey: ["admin-testimonials"] });
  };

  /* ── Drag and drop ──────────────────────────────────── */
  const handleDragStart = (id: string) => setDraggedId(id);

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOverId(id);
  };

  const handleDrop = async (targetId: string) => {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const items = [...testimonials];
    const fromIdx = items.findIndex((t) => t.id === draggedId);
    const toIdx = items.findIndex((t) => t.id === targetId);
    const [moved] = items.splice(fromIdx, 1);
    items.splice(toIdx, 0, moved);

    /* Mise à jour des ordres en DB */
    try {
      await Promise.all(
        items.map((t, i) =>
          supabase.from("testimonials").update({ ordre: i + 1 }).eq("id", t.id)
        )
      );
      void qc.invalidateQueries({ queryKey: ["admin-testimonials"] });
    } catch (err) {
      if (import.meta.env.DEV) console.error("Testimonials reorder error:", err);
      toast.error("Erreur lors du réordonnancement");
    }

    setDraggedId(null);
    setDragOverId(null);
  };

  /* ── Photo crop ─────────────────────────────────────── */
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

  /* ── Ouvrir dialog ──────────────────────────────────── */
  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setPhotoPreview(null);
    setDialogOpen(true);
  };

  const openEdit = (t: Testimonial) => {
    setEditTarget(t);
    setForm({ nom: t.nom, fonction: t.fonction, texte: t.texte, est_actif: t.est_actif });
    setPhotoPreview(t.photo_url);
    setDialogOpen(true);
  };

  /* ── Sauvegarder ────────────────────────────────────── */
  const handleSave = async () => {
    if (!form.nom.trim() || !form.fonction.trim() || !form.texte.trim()) {
      toast.error("Nom, fonction et témoignage sont obligatoires");
      return;
    }
    setSaving(true);
    try {
      if (editTarget) {
        let photo_url = editTarget.photo_url;
        if (form._photoBlob) photo_url = await uploadPhoto(form._photoBlob, editTarget.id);
        const { error } = await supabase
          .from("testimonials")
          .update({ nom: form.nom, fonction: form.fonction, texte: form.texte, est_actif: form.est_actif, photo_url })
          .eq("id", editTarget.id);
        if (error) throw error;
      } else {
        const nextOrdre =
          testimonials.length > 0
            ? Math.max(...testimonials.map((t) => t.ordre)) + 1
            : 1;
        const { data: inserted, error } = await supabase
          .from("testimonials")
          .insert({ nom: form.nom, fonction: form.fonction, texte: form.texte, est_actif: form.est_actif, ordre: nextOrdre })
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
    } catch (err) {
      if (import.meta.env.DEV) console.error("Testimonials save error:", err);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  /* ── Supprimer ──────────────────────────────────────── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("testimonials").delete().eq("id", deleteTarget.id);
    if (error) { toast.error("Erreur lors de la suppression"); return; }
    void qc.invalidateQueries({ queryKey: ["admin-testimonials"] });
    toast.success("Témoignage supprimé");
    setDeleteTarget(null);
  };

  const initials = (nom: string) =>
    nom.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  /* ── Render ─────────────────────────────────────────── */
  return (
    <AdminLayout>
      <div className="p-6 max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-serif">Témoignages</h1>
            <p className="text-muted-foreground font-sans text-sm mt-1">
              Gérez les témoignages de la page d&rsquo;accueil. Glissez pour réordonner.
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" /> Ajouter
          </Button>
        </div>

        {/* Liste — tous les témoignages (actifs + inactifs) */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground font-sans">
            Chargement…
          </div>
        ) : testimonials.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-2xl text-muted-foreground font-sans space-y-2">
            <Quote className="h-10 w-10 mx-auto opacity-20" />
            <p>Aucun témoignage. Cliquez sur &laquo; Ajouter &raquo;.</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground font-sans">
              {testimonials.length} témoignage{testimonials.length > 1 ? "s" : ""} ·{" "}
              {testimonials.filter((t) => t.est_actif).length} actif{testimonials.filter((t) => t.est_actif).length > 1 ? "s" : ""} ·{" "}
              {testimonials.filter((t) => !t.est_actif).length} masqué{testimonials.filter((t) => !t.est_actif).length > 1 ? "s" : ""}
            </p>
          <div className="space-y-2">
            {testimonials.map((t) => (
              <div
                key={t.id}
                draggable
                onDragStart={() => handleDragStart(t.id)}
                onDragOver={(e) => handleDragOver(e, t.id)}
                onDrop={() => void handleDrop(t.id)}
                onDragEnd={() => { setDraggedId(null); setDragOverId(null); }}
                className={[
                  "glass-card p-4 flex items-center gap-3 transition-all",
                  draggedId === t.id ? "opacity-40" : "",
                  dragOverId === t.id && draggedId !== t.id
                    ? "ring-2 ring-primary/40"
                    : "",
                ].join(" ")}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0 cursor-grab" />

                {/* Photo */}
                {t.photo_url ? (
                  <img
                    src={t.photo_url}
                    alt={t.nom}
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/20 shrink-0 pointer-events-none"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-primary/10 ring-2 ring-primary/20 flex items-center justify-center shrink-0 pointer-events-none">
                    <span className="text-primary font-semibold font-sans text-xs">
                      {initials(t.nom)}
                    </span>
                  </div>
                )}

                {/* Infos */}
                <div className="flex-1 min-w-0 pointer-events-none">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold font-sans text-sm truncate">{t.nom}</p>
                    <span className="text-muted-foreground font-sans text-xs truncate">
                      · {t.fonction}
                    </span>
                  </div>
                  <p className="text-muted-foreground font-sans text-xs italic line-clamp-1 mt-0.5">
                    &ldquo;{t.texte}&rdquo;
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={t.est_actif}
                    onCheckedChange={(v) => void handleToggle(t.id, v)}
                  />
                  <Button size="icon" variant="ghost" onClick={() => openEdit(t)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(t)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          </>
        )}
      </div>

      {/* ── Dialog création / édition ─────────────────── */}
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
                <img
                  src={photoPreview}
                  alt="preview"
                  className="h-16 w-16 rounded-full object-cover ring-2 ring-primary/20 shrink-0"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center shrink-0 text-muted-foreground font-sans text-xs">
                  Photo
                </div>
              )}
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => photoInputRef.current?.click()}
                >
                  Choisir une photo
                </Button>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
                <p className="text-muted-foreground font-sans text-xs mt-1">
                  Format carré recommandé (1:1)
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="t-nom">Nom *</Label>
              <Input
                id="t-nom"
                value={form.nom}
                onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                placeholder="Ayssata Deme"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="t-fonction">Fonction *</Label>
              <Input
                id="t-fonction"
                value={form.fonction}
                onChange={(e) => setForm((f) => ({ ...f, fonction: e.target.value }))}
                placeholder="Community Manager Freelance"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="t-texte">Témoignage *</Label>
              <Textarea
                id="t-texte"
                value={form.texte}
                onChange={(e) => setForm((f) => ({ ...f, texte: e.target.value }))}
                placeholder="Ce que l'utilisateur dit de Digal…"
                rows={4}
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="t-actif"
                checked={form.est_actif}
                onCheckedChange={(v) => setForm((f) => ({ ...f, est_actif: v }))}
              />
              <Label htmlFor="t-actif" className="cursor-pointer">
                Visible sur le site
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={() => void handleSave()} disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ImageCropModal */}
      <ImageCropModal
        file={pendingPhoto}
        onConfirm={handleCropConfirm}
        onCancel={() => setPendingPhoto(null)}
        aspect={1}
      />

      {/* Confirmation suppression */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce témoignage ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le témoignage de <strong>{deleteTarget?.nom}</strong> sera
              définitivement supprimé. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void handleDelete()}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminTestimonials;
