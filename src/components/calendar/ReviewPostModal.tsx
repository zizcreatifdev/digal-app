import { useState } from "react";
import { Post, POST_STATUTS, RESEAU_LABELS } from "@/lib/posts";
import { validateCreatorUpload, rejectCreatorUpload } from "@/lib/creator-workflow";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Loader2, Eye } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ReviewPostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: Post | null;
  onSuccess: () => void;
}

export function ReviewPostModal({ open, onOpenChange, post, onSuccess }: ReviewPostModalProps) {
  const [rejecting, setRejecting] = useState(false);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  if (!post) return null;

  const handleValidate = async () => {
    if (!post.assigne_a) return;
    setLoading(true);
    try {
      await validateCreatorUpload(post.id, post.assigne_a);
      toast.success("Fichier validé");
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Erreur");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!post.assigne_a || !comment.trim()) {
      toast.error("Le commentaire est obligatoire pour un rejet");
      return;
    }
    setLoading(true);
    try {
      await rejectCreatorUpload(post.id, post.assigne_a, comment.trim(), post.media_url);
      toast.success("Fichier rejeté, le créateur a été notifié");
      setRejecting(false);
      setComment("");
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Erreur");
    } finally {
      setLoading(false);
    }
  };

  const statut = POST_STATUTS.find((s) => s.id === post.statut);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Revue du fichier créateur
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Post info */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-[10px]">
              {RESEAU_LABELS[post.reseau] ?? post.reseau}
            </Badge>
            <Badge variant="outline" className="text-[10px]">{post.format}</Badge>
            {statut && (
              <span className={`text-[10px] font-semibold font-sans px-2 py-0.5 rounded-full ${statut.color}`}>
                {statut.label}
              </span>
            )}
            <span className="text-[10px] text-muted-foreground font-sans">
              {format(new Date(post.date_publication), "d MMM · HH:mm", { locale: fr })}
            </span>
          </div>

          {/* Media preview */}
          {post.media_url && (
            <div className="rounded-lg overflow-hidden border border-border bg-muted">
              {post.media_url.match(/\.(mp4|webm|mov)$/i) ? (
                <video src={post.media_url} controls className="w-full max-h-[300px] object-contain" />
              ) : (
                <img src={post.media_url} alt="" className="w-full max-h-[300px] object-contain" />
              )}
            </div>
          )}

          {post.texte && <p className="text-sm font-sans">{post.texte}</p>}

          {/* Actions */}
          {!rejecting ? (
            <div className="flex gap-2 pt-2 border-t border-border">
              <Button
                className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
                onClick={handleValidate}
                disabled={loading}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                <CheckCircle className="h-4 w-4" /> Valider
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => setRejecting(true)}
                disabled={loading}
              >
                <XCircle className="h-4 w-4" /> Rejeter
              </Button>
            </div>
          ) : (
            <div className="space-y-3 pt-2 border-t border-border">
              <p className="text-sm font-sans font-semibold text-destructive">
                Commentaire obligatoire pour le rejet :
              </p>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Expliquez ce qui doit être corrigé..."
                rows={3}
              />
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleReject}
                  disabled={loading || !comment.trim()}
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Confirmer le rejet
                </Button>
                <Button variant="outline" onClick={() => { setRejecting(false); setComment(""); }}>
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
