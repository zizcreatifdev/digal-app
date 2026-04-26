import { useState, useRef } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { RESEAUX } from "@/lib/clients";
import { logPostAction } from "@/lib/activity-logs";
import { createPost, uploadPostMedia } from "@/lib/posts";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload, X, Image, Video, FileText, GripVertical, AlertCircle } from "lucide-react";
import {
  MediaFile, MAX_FILES, createMediaFile, revokeMediaFile,
  validateMediaFile, ACCEPT_BY_NETWORK, compressImageFile,
} from "@/lib/media-utils";

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  activeNetworks: string[];
  defaultDate?: Date;
  onSuccess: () => void;
}

function FileIcon({ file }: { file: File }) {
  if (file.type.startsWith("video")) return <Video className="h-4 w-4 text-muted-foreground shrink-0" />;
  if (file.type === "application/pdf") return <FileText className="h-4 w-4 text-muted-foreground shrink-0" />;
  return <Image className="h-4 w-4 text-muted-foreground shrink-0" />;
}

export function CreatePostModal({
  open, onOpenChange, clientId, activeNetworks, defaultDate, onSuccess,
}: CreatePostModalProps) {
  const { user, profileRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [reseau, setReseau] = useState(activeNetworks[0] ?? "instagram");
  const [format, setFormat] = useState("");
  const [datePublication, setDatePublication] = useState(
    defaultDate ? defaultDate.toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)
  );
  const [texte, setTexte] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [assigneA, setAssigneA] = useState<string>("");
  const [creators, setCreators] = useState<{ user_id: string; prenom: string; nom: string }[]>([]);

  const isAgenceMember = profileRole === "dm" || profileRole === "cm" ||
    profileRole === "agence_standard" || profileRole === "agence_pro";

  // Fetch creators from same agence when modal opens
  useEffect(() => {
    if (!open || !user || !isAgenceMember) { setCreators([]); return; }
    supabase.from("users").select("user_id, prenom, nom, agence_id").eq("user_id", user.id).maybeSingle()
      .then(({ data: me }) => {
        if (!me?.agence_id) return;
        supabase.from("users").select("user_id, prenom, nom").eq("agence_id", me.agence_id).eq("role", "createur")
          .then(({ data }) => setCreators(data ?? []));
      });
  }, [open, user, isAgenceMember]);

  const selectedReseau = RESEAUX.find((r) => r.id === reseau);
  const formats = selectedReseau?.formats ?? [];
  const accept = ACCEPT_BY_NETWORK[reseau] ?? "image/*,video/*";

  const resetForm = () => {
    mediaFiles.forEach(revokeMediaFile);
    setReseau(activeNetworks[0] ?? "instagram");
    setFormat("");
    setDatePublication(new Date().toISOString().slice(0, 16));
    setTexte("");
    setHashtags("");
    setMediaFiles([]);
    setCompressionProgress(0);
    setAssigneA("");
  };

  const addFiles = (files: FileList | File[]) => {
    const arr = Array.from(files);
    const remaining = MAX_FILES - mediaFiles.length;
    if (remaining <= 0) { toast.error(`Maximum ${MAX_FILES} fichiers par post`); return; }

    const toAdd: MediaFile[] = [];
    for (const f of arr.slice(0, remaining)) {
      const err = validateMediaFile(f, reseau);
      if (err) { toast.error(err); continue; }
      toAdd.push(createMediaFile(f));
    }
    if (arr.length > remaining) {
      toast.error(`Seuls ${remaining} fichier(s) ajouté(s) — limite de ${MAX_FILES} atteinte`);
    }
    setMediaFiles((prev) => [...prev, ...toAdd]);
  };

  const removeFile = (id: string) => {
    setMediaFiles((prev) => {
      const mf = prev.find((f) => f.id === id);
      if (mf) revokeMediaFile(mf);
      return prev.filter((f) => f.id !== id);
    });
  };

  // Drag-to-reorder
  const handleDragStart = (idx: number) => setDragIndex(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === idx) return;
    setMediaFiles((prev) => {
      const arr = [...prev];
      const [moved] = arr.splice(dragIndex, 1);
      arr.splice(idx, 0, moved);
      return arr;
    });
    setDragIndex(idx);
  };

  // Drop zone
  const handleDropZone = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
  };

  const handleSubmit = async () => {
    if (!user || !reseau || !format) {
      toast.error("Réseau et format sont requis");
      return;
    }

    setLoading(true);
    try {
      // 1. Compress images
      const processedFiles: File[] = [];
      for (let i = 0; i < mediaFiles.length; i++) {
        const mf = mediaFiles[i];
        if (mf.file.type.startsWith("image/")) {
          setCompressing(true);
          setCompressionProgress(0);
          const compressed = await compressImageFile(mf.file, (p) => setCompressionProgress(p));
          processedFiles.push(compressed);
        } else {
          processedFiles.push(mf.file);
        }
      }
      setCompressing(false);

      // 2. Upload all files
      const urls = await Promise.all(processedFiles.map((f) => uploadPostMedia(user.id, f)));

      await createPost({
        client_id: clientId,
        user_id: user.id,
        reseau,
        format,
        date_publication: new Date(datePublication).toISOString(),
        texte: texte || null,
        hashtags: hashtags || null,
        media_url: urls[0] ?? null,
        media_urls: urls,
        statut: "brouillon",
        assigne_a: assigneA || null,
        review_comment: null,
      });

      toast.success("Post créé");
      logPostAction(user.id, "Post créé", `${reseau} · ${format}`);
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Erreur lors de la création");
    } finally {
      setLoading(false);
      setCompressing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouveau post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="font-sans">Réseau *</Label>
              <Select value={reseau} onValueChange={(v) => { setReseau(v); setFormat(""); setMediaFiles([]); }}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {activeNetworks.map((id) => {
                    const r = RESEAUX.find((x) => x.id === id);
                    return r ? <SelectItem key={id} value={id}>{r.label}</SelectItem> : null;
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-sans">Format *</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Choisir..." /></SelectTrigger>
                <SelectContent>
                  {formats.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="font-sans">Date & heure de publication</Label>
            <Input
              type="datetime-local"
              value={datePublication}
              onChange={(e) => setDatePublication(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="font-sans">Texte / légende</Label>
            <Textarea
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
              placeholder="Rédigez la légende du post..."
              rows={3}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="font-sans">Hashtags</Label>
            <Input
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="#digal #socialmedia #senegal"
              className="mt-1"
            />
          </div>

          {isAgenceMember && creators.length > 0 && (
            <div>
              <Label className="font-sans">Assigner à un créateur (optionnel)</Label>
              <Select value={assigneA} onValueChange={setAssigneA}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="— Aucun —" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— Aucun —</SelectItem>
                  {creators.map((c) => (
                    <SelectItem key={c.user_id} value={c.user_id}>
                      {c.prenom} {c.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Multi-file media */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="font-sans">Médias</Label>
              <span className="text-xs text-muted-foreground font-sans">
                {mediaFiles.length}/{MAX_FILES} fichier{mediaFiles.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* File list */}
            {mediaFiles.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {mediaFiles.map((mf, idx) => (
                  <div
                    key={mf.id}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={() => setDragIndex(null)}
                    className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/40 cursor-grab active:cursor-grabbing"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                    {/* Thumbnail */}
                    {mf.file.type.startsWith("image/") ? (
                      <img src={mf.preview} alt="" className="h-8 w-8 rounded object-cover shrink-0" />
                    ) : (
                      <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                        <FileIcon file={mf.file} />
                      </div>
                    )}
                    <span className="text-xs font-sans flex-1 truncate text-foreground/80">{mf.file.name}</span>
                    <span className="text-[10px] text-muted-foreground font-sans shrink-0">
                      {(mf.file.size / (1024 * 1024)).toFixed(1)} Mo
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => removeFile(mf.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* TikTok warnings */}
            {reseau === "tiktok" && mediaFiles.length > 0 && (
              <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200 mb-2">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 font-sans">
                  TikTok : vérifiez que la vidéo dure moins de 3 min et utilise le ratio 9:16.
                </p>
              </div>
            )}

            {/* Compression progress */}
            {compressing && (
              <div className="mb-2 space-y-1">
                <p className="text-xs text-muted-foreground font-sans">Compression en cours…</p>
                <Progress value={compressionProgress} className="h-1.5" />
              </div>
            )}

            {/* Drop zone */}
            {mediaFiles.length < MAX_FILES && (
              <div
                className={`flex flex-col items-center justify-center gap-2 py-5 border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
                  dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDropZone}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-sans text-center">
                  Glissez vos fichiers ici ou cliquez pour parcourir
                  <br />
                  <span className="text-[10px]">JPG/PNG (→ 2 Mo) · MP4 (→ 500 Mo) · PDF (→ 50 Mo)</span>
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={accept}
                  multiple
                  className="hidden"
                  onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !format}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Créer le post
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
