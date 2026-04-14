import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RESEAUX } from "@/lib/clients";
import { Post, POST_STATUTS, RESEAU_LABELS, updatePost, deletePost, uploadPostMedia } from "@/lib/posts";
import { fetchPreviewActions, PreviewAction } from "@/lib/preview-links";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Upload, Image, Video, Trash2, MessageSquare, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface EditPostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: Post | null;
  activeNetworks: string[];
  onSuccess: () => void;
}

export function EditPostModal({ open, onOpenChange, post, activeNetworks, onSuccess }: EditPostModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reseau, setReseau] = useState("");
  const [fmt, setFmt] = useState("");
  const [datePublication, setDatePublication] = useState("");
  const [texte, setTexte] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [statut, setStatut] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [clientComments, setClientComments] = useState<PreviewAction[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    if (post && open) {
      setReseau(post.reseau);
      setFmt(post.format);
      setDatePublication(new Date(post.date_publication).toISOString().slice(0, 16));
      setTexte(post.texte ?? "");
      setHashtags(post.hashtags ?? "");
      setStatut(post.statut);
      setMediaFile(null);
      loadClientComments(post.id);
    }
  }, [post, open]);

  const loadClientComments = async (postId: string) => {
    setLoadingComments(true);
    try {
      // Fetch preview actions for this post
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

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let mediaUrl = post.media_url;
      if (mediaFile) {
        mediaUrl = await uploadPostMedia(user.id, mediaFile);
      }

      // Si le post était refusé et qu'on le modifie, repasser en production automatiquement
      const finalStatut = (post.statut === "refuse" && statut === "refuse") ? "en_production" : statut;

      await updatePost(post.id, {
        reseau,
        format: fmt,
        date_publication: new Date(datePublication).toISOString(),
        texte: texte || null,
        hashtags: hashtags || null,
        media_url: mediaUrl,
        statut: finalStatut,
      });

      toast.success("Post mis à jour");
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Erreur");
    } finally {
      setLoading(false);
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
                rows={4}
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

            <div>
              <Label className="font-sans text-xs">Média</Label>
              <div className="mt-1">
                {post.media_url && !mediaFile && (
                  <div className="rounded-lg overflow-hidden border border-border bg-muted mb-2">
                    {post.media_url.match(/\.(mp4|webm|mov)$/i) ? (
                      <video src={post.media_url} controls className="w-full max-h-[150px] object-contain" />
                    ) : (
                      <img src={post.media_url} alt="" className="w-full max-h-[150px] object-contain" />
                    )}
                  </div>
                )}
                {mediaFile ? (
                  <div className="space-y-2">
                    <div className="rounded-lg overflow-hidden border border-border bg-muted">
                      {mediaFile.type.startsWith("video") ? (
                        <video src={URL.createObjectURL(mediaFile)} controls className="w-full max-h-[150px] object-contain" />
                      ) : (
                        <img src={URL.createObjectURL(mediaFile)} alt="" className="w-full max-h-[150px] object-contain" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-sans flex-1 truncate text-muted-foreground">{mediaFile.name}</span>
                      <Button variant="ghost" size="sm" onClick={() => setMediaFile(null)} className="text-xs">
                        Retirer
                      </Button>
                    </div>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 py-3 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-sans">
                      {post.media_url ? "Remplacer le média" : "Ajouter un média"}
                    </span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setMediaFile(f);
                      }}
                    />
                  </label>
                )}
              </div>
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
                <p className="text-xs text-muted-foreground font-sans">
                  Aucun retour client pour ce post
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
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
                        {format(new Date(action.created_at), "d MMM à HH:mm", { locale: fr })}
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
