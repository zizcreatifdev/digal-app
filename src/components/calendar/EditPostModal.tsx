import { useState, useEffect, useRef } from "react";
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
import { Post, POST_STATUTS, RESEAU_LABELS, updatePost, deletePost, uploadPostMedia } from "@/lib/posts";
import { fetchPreviewActions, PreviewAction } from "@/lib/preview-links";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Loader2, Upload, X, Image, Video, FileText, GripVertical,
  Trash2, MessageSquare, CheckCircle, XCircle, AlertCircle,
} from "lucide-react";
import { format as dateFmt } from "date-fns";
import { fr } from "date-fns/locale";
import {
  MediaFile, MAX_FILES, createMediaFile, revokeMediaFile,
  validateMediaFile, ACCEPT_BY_NETWORK, compressImageFile,
} from "@/lib/media-utils";

interface EditPostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: Post | null;
  activeNetworks: string[];
  onSuccess: () => void;
}

function FileIcon({ file }: { file: File }) {
  if (file.type.startsWith("video")) return <Video className="h-4 w-4 text-muted-foreground shrink-0" />;
  if (file.type === "application/pdf") return <FileText className="h-4 w-4 text-muted-foreground shrink-0" />;
  return <Image className="h-4 w-4 text-muted-foreground shrink-0" />;
}

export function EditPostModal({ open, onOpenChange, post, activeNetworks, onSuccess }: EditPostModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [reseau, setReseau] = useState("");
  const [fmt, setFmt] = useState("");
  const [datePublication, setDatePublication] = useState("");
  const [texte, setTexte] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [statut, setStatut] = useState("");
  // New-file queue (files to upload on save)
  const [newFiles, setNewFiles] = useState<MediaFile[]>([]);
  // Existing media URLs (already uploaded)
  const [existingUrls, setExistingUrls] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [clientComments, setClientComments] = useState<PreviewAction[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (post && open) {
      setReseau(post.reseau);
      setFmt(post.format);
      setDatePublication(new Date(post.date_publication).toISOString().slice(0, 16));
      setTexte(post.texte ?? "");
      setHashtags(post.hashtags ?? "");
      setStatut(post.statut);
      // Existing media
      const urls = post.media_urls?.length ? post.media_urls : post.media_url ? [post.media_url] : [];
      setExistingUrls(urls);
      setNewFiles([]);
      loadClientComments(post.id);
    }
  }, [post, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadClientComments = async (postId: string) => {
    setLoadingComments(true);
    try {
      const { data } = await supabase
        .from("preview_actions")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: false });
      setClientComments((data ?? []) as PreviewAction[]);
    } catch {
      setClientComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  if (!post) return null;

  const selectedReseau = RESEAUX.find((r) => r.id === reseau);
  const formats = selectedReseau?.formats ?? [];
  const accept = ACCEPT_BY_NETWORK[reseau] ?? "image/*,video/*";
  const totalFiles = existingUrls.length + newFiles.length;

  const addFiles = (files: FileList | File[]) => {
    const arr = Array.from(files);
    const remaining = MAX_FILES - totalFiles;
    if (remaining <= 0) { toast.error(`Maximum ${MAX_FILES} fichiers par post`); return; }
    const toAdd: MediaFile[] = [];
    for (const f of arr.slice(0, remaining)) {
      const err = validateMediaFile(f, reseau);
      if (err) { toast.error(err); continue; }
      toAdd.push(createMediaFile(f));
    }
    if (arr.length > remaining) toast.error(`Seuls ${remaining} fichier(s) ajouté(s)`);
    setNewFiles((prev) => [...prev, ...toAdd]);
  };

  const removeExisting = (url: string) => setExistingUrls((prev) => prev.filter((u) => u !== url));
  const removeNew = (id: string) => setNewFiles((prev) => {
    const mf = prev.find((f) => f.id === id);
    if (mf) revokeMediaFile(mf);
    return prev.filter((f) => f.id !== id);
  });

  const handleDragStart = (idx: number) => setDragIndex(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === idx) return;
    setExistingUrls((prev) => {
      const arr = [...prev];
      const [moved] = arr.splice(dragIndex, 1);
      arr.splice(idx, 0, moved);
      return arr;
    });
    setDragIndex(idx);
  };

  const handleDropZone = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Compress + upload new files
      const processedFiles: File[] = [];
      for (const mf of newFiles) {
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
      const newUrls = await Promise.all(processedFiles.map((f) => uploadPostMedia(user.id, f)));

      // 2. Merge existing + new
      const allUrls = [...existingUrls, ...newUrls];

      // Si le post était refusé et qu'on le modifie, repasser en production
      const finalStatut = (post.statut === "refuse" && statut === "refuse") ? "en_production" : statut;

      await updatePost(post.id, {
        reseau,
        format: fmt,
        date_publication: new Date(datePublication).toISOString(),
        texte: texte || null,
        hashtags: hashtags || null,
        media_url: allUrls[0] ?? null,
        media_urls: allUrls,
        statut: finalStatut,
      });

      toast.success("Post mis à jour");
      onOpenChange(false);
      onSuccess();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Erreur");
    } finally {
      setLoading(false);
      setCompressing(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deletePost(post.id);
      toast.success("Post supprimé");
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  const currentStatut = POST_STATUTS.find((s) => s.id === post.statut);
  const isVideo = (url: string) => /\.(mp4|webm|mov)$/i.test(url);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif">
            Modifier le post
            {currentStatut && (
              <span className={`text-xs font-sans px-2 py-0.5 rounded-full ${currentStatut.color}`}>
                {currentStatut.label}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
          {/* Left: Edit form */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-sans text-xs">Réseau</Label>
                <Select value={reseau} onValueChange={(v) => { setReseau(v); setFmt(""); }}>
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
                <Label className="font-sans text-xs">Format</Label>
                <Select value={fmt} onValueChange={setFmt}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {formats.map((f) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="font-sans text-xs">Statut</Label>
              <Select value={statut} onValueChange={setStatut}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {POST_STATUTS.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="font-sans text-xs">Date & heure</Label>
              <Input
                type="datetime-local"
                value={datePublication}
                onChange={(e) => setDatePublication(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="font-sans text-xs">Texte / légende</Label>
              <Textarea
                value={texte}
                onChange={(e) => setTexte(e.target.value)}
                placeholder="Rédigez la légende du post..."
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="font-sans text-xs">Hashtags</Label>
              <Input
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="#digal #socialmedia"
                className="mt-1"
              />
            </div>

            {/* Multi-file media */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="font-sans text-xs">Médias</Label>
                <span className="text-[10px] text-muted-foreground font-sans">{totalFiles}/{MAX_FILES}</span>
              </div>

              {/* Existing URLs */}
              {existingUrls.length > 0 && (
                <div className="space-y-1 mb-2">
                  {existingUrls.map((url, idx) => (
                    <div
                      key={url}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDragEnd={() => setDragIndex(null)}
                      className="flex items-center gap-2 p-1.5 rounded border border-border bg-muted/30 cursor-grab"
                    >
                      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                      {isVideo(url) ? (
                        <Video className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      ) : (
                        <img src={url} alt="" className="h-6 w-6 rounded object-cover shrink-0" />
                      )}
                      <span className="text-[10px] font-sans flex-1 truncate text-muted-foreground">{url.split("/").pop()}</span>
                      <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={() => removeExisting(url)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* New files */}
              {newFiles.length > 0 && (
                <div className="space-y-1 mb-2">
                  {newFiles.map((mf) => (
                    <div key={mf.id} className="flex items-center gap-2 p-1.5 rounded border border-primary/30 bg-primary/5">
                      {mf.file.type.startsWith("image/") ? (
                        <img src={mf.preview} alt="" className="h-6 w-6 rounded object-cover shrink-0" />
                      ) : (
                        <div className="h-6 w-6 flex items-center justify-center"><FileIcon file={mf.file} /></div>
                      )}
                      <span className="text-[10px] font-sans flex-1 truncate">{mf.file.name}</span>
                      <span className="text-[9px] text-muted-foreground font-sans shrink-0">
                        {(mf.file.size / (1024 * 1024)).toFixed(1)} Mo
                      </span>
                      <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={() => removeNew(mf.id)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Compression progress */}
              {compressing && (
                <div className="mb-2 space-y-1">
                  <p className="text-xs text-muted-foreground font-sans">Compression en cours…</p>
                  <Progress value={compressionProgress} className="h-1.5" />
                </div>
              )}

              {/* TikTok warning */}
              {reseau === "tiktok" && totalFiles > 0 && (
                <div className="flex items-start gap-2 p-2 rounded bg-amber-50 border border-amber-200 mb-2">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-700 font-sans">
                    TikTok : vérifiez durée &lt; 3 min et ratio 9:16.
                  </p>
                </div>
              )}

              {totalFiles < MAX_FILES && (
                <div
                  className={`flex items-center justify-center gap-2 py-3 border-2 border-dashed rounded-lg transition-colors cursor-pointer text-xs ${
                    dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDropZone}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground font-sans">Ajouter des fichiers</span>
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

          {/* Right: Client comments */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold font-serif">Retours client</h3>
            </div>

            {post.review_comment && (
              <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
                <p className="text-xs font-semibold font-sans text-orange-700 mb-1">Commentaire de revue interne</p>
                <p className="text-sm font-sans">{post.review_comment}</p>
              </div>
            )}

            {loadingComments ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : clientComments.length === 0 ? (
              <div className="text-center py-8 bg-muted/30 rounded-lg">
                <MessageSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground font-sans">Aucun retour client pour ce post</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[350px] overflow-y-auto">
                {clientComments.map((action) => (
                  <div
                    key={action.id}
                    className={`p-3 rounded-lg border ${
                      action.decision === "valide"
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {action.decision === "valide" ? (
                        <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-red-600" />
                      )}
                      <span className={`text-xs font-semibold font-sans ${
                        action.decision === "valide" ? "text-green-700" : "text-red-700"
                      }`}>
                        {action.decision === "valide" ? "Validé par le client" : "Refusé par le client"}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-sans ml-auto">
                        {dateFmt(new Date(action.created_at), "d MMM à HH:mm", { locale: fr })}
                      </span>
                    </div>
                    {action.commentaire && (
                      <p className="text-sm font-sans mt-1 text-foreground/80">{action.commentaire}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={deleting || loading}
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Supprimer
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
