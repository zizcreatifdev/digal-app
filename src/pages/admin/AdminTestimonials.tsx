import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
}

const EMPTY_FORM: FormState = { texte: "", nom: "", fonction: "", actif: true };

async function uploadPhoto(blob: Blob, testimonialId: string): Promise<string> {
  const ext = "png";
  const path = `${testimonialId}.${ext}`;
  const { error } = await supabase.storage
    .from("testimonials")
    .upload(path, blob, { upsert: true, contentType: "image/png" });
  if (error) throw error;
  const { data } = supabase.storage.from("testimonials").getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}

const AdminTestimonials = () => {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Testimonial | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Testimonial | null>(null);
  const [saving, setSaving] = useState(false);

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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("testimonials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-testimonials"] });
      toast.success("Témoignage supprimé");
      setDeleteTarget(null);
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, actif }: { id: string; actif: boolean }) => {
      const { error } = await supabase.from("testimonials").update({ actif }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin-testimonials"] }),
    onError: () => toast.error("Erreur de mise à jour"),
  });

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

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPendingPhoto(file);
    e.target.value = "";
  };

  const handleCropConfirm = (blob: Blob) => {
    setPendingPhoto(null);
    const url = URL.createObjectURL(blob);
    setPhotoPreview(url);
    // store blob on form state for upload on save
    (form as FormState & { _photoBlob?: Blob })._photoBlob = blob;
  };

  const handleSave = async () => {
    if (!form.texte.trim() || !form.nom.trim()) {
      toast.error("Le texte et le nom sont obligatoires");
      return;
    }
    setSaving(true);
    try {
      const photoBlob = (form as FormState & { _photoBlob?: Blob })._photoBlob;

      if (editTarget) {
        let photo_url = editTarget.photo_url;
        if (photoBlob) {
          photo_url = await uploadPhoto(photoBlob, editTarget.id);
        }
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
        if (photoBlob && inserted) {
          const photo_url = await uploadPhoto(photoBlob, (inserted as Testimonial).id);
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

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-serif">Témoignages</h1>
            <p className="text-muted-foreground font-sans text-sm mt-1">
              Gérez les témoignages affichés sur la page d&rsquo;accueil.
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Ajouter
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center text-muted-foreground py-12 font-sans">Chargement…</div>
        ) : testimonials.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground font-sans space-y-2">
            <Quote className="h-10 w-10 mx-auto opacity-20" />
            <p>Aucun témoignage pour l&rsquo;instant.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {testimonials.map((t) => (
              <div
                key={t.id}
                className="glass-card p-4 flex items-center gap-4"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />

                {t.photo_url ? (
                  <img
                    src={t.photo_url}
                    alt={t.nom}
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/20 shrink-0"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-primary/10 ring-2 ring-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-primary font-semibold font-sans text-xs">{initials(t.nom)}</span>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold font-sans text-sm truncate">{t.nom}</p>
                    {t.fonction && (
                      <span className="text-muted-foreground font-sans text-xs truncate">· {t.fonction}</span>
                    )}
                  </div>
                  <p className="text-muted-foreground font-sans text-xs line-clamp-1 italic mt-0.5">
                    &ldquo;{t.texte}&rdquo;
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Switch
                    checked={t.actif}
                    onCheckedChange={(v) => toggleMutation.mutate({ id: t.id, actif: v })}
                  />
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

      {/* Create / Edit dialog */}
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
                <input
                  id="photo-input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
                <p className="text-muted-foreground font-sans text-xs mt-1">PNG, JPG ou WebP</p>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="nom">Nom *</Label>
              <Input
                id="nom"
                value={form.nom}
                onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                placeholder="Aminata Diallo"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="fonction">Fonction / Entreprise</Label>
              <Input
                id="fonction"
                value={form.fonction}
                onChange={(e) => setForm((f) => ({ ...f, fonction: e.target.value }))}
                placeholder="Community Manager Freelance"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="texte">Témoignage *</Label>
              <Textarea
                id="texte"
                value={form.texte}
                onChange={(e) => setForm((f) => ({ ...f, texte: e.target.value }))}
                placeholder="Digal a transformé ma façon de travailler…"
                rows={4}
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="actif"
                checked={form.actif}
                onCheckedChange={(v) => setForm((f) => ({ ...f, actif: v }))}
              />
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

      {/* Crop modal */}
      <ImageCropModal
        file={pendingPhoto}
        onConfirm={handleCropConfirm}
        onCancel={() => setPendingPhoto(null)}
        aspect={1}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce témoignage ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le témoignage de{" "}
              <strong>{deleteTarget?.nom}</strong> sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
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
